import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { db } from '$lib/server/db';

interface StatsCache {
    youtubeSubscribers: string;
    youtubeVideos: string;
    steamGroupMembers: string;
    steamGroupOnline: string;
    steamLevel: string;
    steamFriends: string;
    xCommunityMembers: string;
    timestamp: number;
}

let cache: StatsCache | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds
const cacheFilePath = path.resolve('src/lib/stats-cache.json');

function readPersistedCache() {
    try {
        if (fs.existsSync(cacheFilePath)) {
            const fileData = fs.readFileSync(cacheFilePath, 'utf8');
            return JSON.parse(fileData);
        }
    } catch (e) {
        console.error('Error reading persisted cache:', e);
    }
    return {
        youtubeSubscribers: '57,4 B',
        youtubeVideos: '776',
        steamGroupMembers: '1.101',
        steamGroupOnline: '380',
        steamLevel: '45',
        steamFriends: '294',
        xCommunityMembers: '4,7 B'
    };
}

function writePersistedCache(data: Omit<StatsCache, 'timestamp'>) {
    try {
        fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing persisted cache:', e);
    }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

async function scrapeStats(): Promise<Omit<StatsCache, 'timestamp'>> {
    const stats = {
        youtubeSubscribers: '',
        youtubeVideos: '',
        steamGroupMembers: '',
        steamGroupOnline: '',
        steamLevel: '',
        steamFriends: '',
        xCommunityMembers: ''
    };

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    await Promise.allSettled([
        // YouTube channel page
        fetchWithTimeout('https://www.youtube.com/@MstafaKadir', { headers }, 6000)
            .then(res => res.text())
            .then(html => {
                const scriptMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/);
                if (scriptMatch) {
                    try {
                        const data = JSON.parse(scriptMatch[1]);
                        const rows = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
                        if (rows && rows.length > 1) {
                            const parts = rows[1].metadataParts;
                            if (parts && parts.length > 0) {
                                stats.youtubeSubscribers = parts[0].text?.content || '';
                            }
                            if (parts && parts.length > 1) {
                                stats.youtubeVideos = parts[1].text?.content || '';
                            }
                        }
                    } catch (e) {
                        // ignore and let fallbacks handle
                    }
                }
                
                // Fallbacks if JSON parsing failed
                if (!stats.youtubeSubscribers) {
                    const subMatch = html.match(/"subscriberCountText"[^}]+?"accessibilityData"\s*:\s*\{\s*"label"\s*:\s*"([^"]+?)"/i)
                        || html.match(/"subscriberCountText"[^}]+?"label"\s*:\s*"([^"]+?)"/i);
                    if (subMatch) stats.youtubeSubscribers = subMatch[1];
                }
                if (!stats.youtubeVideos) {
                    const vidMatch = html.match(/"videoCountText"[^}]+?"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+?)"/i);
                    if (vidMatch) stats.youtubeVideos = vidMatch[1];
                }
            }),

        // Steam Group
        fetchWithTimeout('https://steamcommunity.com/groups/mstafakadir', { headers }, 6000)
            .then(res => res.text())
            .then(html => {
                const membersMatch = html.match(/membercount members[^]*?class="count\s*"[^>]*>([^<]+)/i);
                const onlineMatch = html.match(/membercount online[^]*?class="count\s*"[^>]*>([^<]+)/i);
                if (membersMatch) stats.steamGroupMembers = membersMatch[1].trim();
                if (onlineMatch) stats.steamGroupOnline = onlineMatch[1].trim();
            }),

        // Steam Profile
        fetchWithTimeout('https://steamcommunity.com/id/mustafakadir', { headers }, 6000)
            .then(res => res.text())
            .then(html => {
                const levelMatch = html.match(/<span class="friendPlayerLevelNum">(\d+)<\/span>/i);
                const friendsMatch = html.match(/profile_friend_links[^]*?profile_count_link_total[^]*?>\s*([\d,.]+)\s*<\/span>/i);
                if (levelMatch) stats.steamLevel = levelMatch[1].trim();
                if (friendsMatch) stats.steamFriends = friendsMatch[1].trim();
            }),

        // X Community
        fetchWithTimeout('https://x.com/i/communities/1888733402792128619', { headers }, 6000)
            .then(res => res.text())
            .then(html => {
                // Try parsing metadata descriptions that public communities display
                const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) 
                    || html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
                if (metaMatch) {
                    const desc = metaMatch[1];
                    // Matches strings like "4.7K members" or "4,7 B Üye"
                    const memberMatch = desc.match(/([\d.,]+[KMB]?[^·\n]*?members)/i) 
                        || desc.match(/([\d.,]+[KMB]?\s*üye)/i);
                    if (memberMatch) {
                        stats.xCommunityMembers = memberMatch[1].trim();
                    }
                }
            })
    ]);

    return stats;
}

export const GET: RequestHandler = async () => {
    const now = Date.now();

    // Fetch overrides from settings table
    let overrides: Record<string, string> = {};
    try {
        const settingsRes = await db.execute("SELECT key, value FROM settings WHERE key LIKE 'stat_%'");
        for (const row of settingsRes.rows) {
            overrides[row.key as string] = row.value as string;
        }
    } catch (e) {
        console.error('Failed to read database overrides for stats:', e);
    }
    
    if (cache && (now - cache.timestamp < CACHE_TTL_MS)) {
        return json({
            youtubeSubscribers: overrides.stat_youtube_subscribers || cache.youtubeSubscribers,
            youtubeVideos: overrides.stat_youtube_videos || cache.youtubeVideos,
            steamGroupMembers: overrides.stat_steam_members || cache.steamGroupMembers,
            steamGroupOnline: overrides.stat_steam_online || cache.steamGroupOnline,
            steamLevel: overrides.stat_steam_level || cache.steamLevel,
            steamFriends: overrides.stat_steam_friends || cache.steamFriends,
            xCommunityMembers: overrides.stat_x_members || cache.xCommunityMembers
        });
    }

    const diskCache = readPersistedCache();

    try {
        const freshStats = await scrapeStats();
        
        const updatedStats = {
            youtubeSubscribers: overrides.stat_youtube_subscribers || freshStats.youtubeSubscribers || cache?.youtubeSubscribers || diskCache.youtubeSubscribers || '57,4 B',
            youtubeVideos: overrides.stat_youtube_videos || freshStats.youtubeVideos || cache?.youtubeVideos || diskCache.youtubeVideos || '776',
            steamGroupMembers: overrides.stat_steam_members || freshStats.steamGroupMembers || cache?.steamGroupMembers || diskCache.steamGroupMembers || '1.101',
            steamGroupOnline: overrides.stat_steam_online || freshStats.steamGroupOnline || cache?.steamGroupOnline || diskCache.steamGroupOnline || '380',
            steamLevel: overrides.stat_steam_level || freshStats.steamLevel || cache?.steamLevel || diskCache.steamLevel || '45',
            steamFriends: overrides.stat_steam_friends || freshStats.steamFriends || cache?.steamFriends || diskCache.steamFriends || '294',
            xCommunityMembers: overrides.stat_x_members || freshStats.xCommunityMembers || cache?.xCommunityMembers || diskCache.xCommunityMembers || '4,7 B'
        };

        cache = {
            ...updatedStats,
            timestamp: now
        };

        // Write the fresh data to disk cache for future fallback use
        writePersistedCache(updatedStats);

        return json(updatedStats);
    } catch (err) {
        const fallbackStats = {
            youtubeSubscribers: overrides.stat_youtube_subscribers || cache?.youtubeSubscribers || diskCache.youtubeSubscribers || '57,4 B',
            youtubeVideos: overrides.stat_youtube_videos || cache?.youtubeVideos || diskCache.youtubeVideos || '776',
            steamGroupMembers: overrides.stat_steam_members || cache?.steamGroupMembers || diskCache.steamGroupMembers || '1.101',
            steamGroupOnline: overrides.stat_steam_online || cache?.steamGroupOnline || diskCache.steamGroupOnline || '380',
            steamLevel: overrides.stat_steam_level || cache?.steamLevel || diskCache.steamLevel || '45',
            steamFriends: overrides.stat_steam_friends || cache?.steamFriends || diskCache.steamFriends || '294',
            xCommunityMembers: overrides.stat_x_members || cache?.xCommunityMembers || diskCache.xCommunityMembers || '4,7 B'
        };
        return json(fallbackStats);
    }
};
