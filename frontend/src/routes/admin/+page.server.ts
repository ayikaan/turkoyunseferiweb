import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';
import { encryptText, decryptText, hashValue } from '$lib/server/crypto';

function getDeviceId(cookies: any) {
    let deviceId = cookies.get('device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        cookies.set('device_id', deviceId, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 365 * 10 // 10 years
        });
    }
    return deviceId;
}

async function checkRateLimit(ip: string) {
    try {
        const result = await db.execute({
            sql: "SELECT attempts, last_attempt FROM login_attempts WHERE ip_address = ?",
            args: [ip]
        });
        if (result.rows.length > 0) {
            const attempts = Number(result.rows[0].attempts);
            const lastAttemptStr = result.rows[0].last_attempt as string;
            const lastAttempt = new Date(lastAttemptStr).getTime();
            const now = Date.now();
            const diffMin = (now - lastAttempt) / (1000 * 60);

            if (attempts >= 5) {
                if (diffMin < 15) {
                    return { blocked: true, remainingTime: Math.ceil(15 - diffMin) };
                } else {
                    await db.execute({
                        sql: "DELETE FROM login_attempts WHERE ip_address = ?",
                        args: [ip]
                    });
                }
            }
        }
    } catch (e) {
        console.error('Rate limit error:', e);
    }
    return { blocked: false };
}

async function recordFailedAttempt(ip: string) {
    try {
        const result = await db.execute({
            sql: "SELECT attempts FROM login_attempts WHERE ip_address = ?",
            args: [ip]
        });
        const now = new Date().toISOString();
        if (result.rows.length > 0) {
            const newAttempts = Number(result.rows[0].attempts) + 1;
            await db.execute({
                sql: "UPDATE login_attempts SET attempts = ?, last_attempt = ? WHERE ip_address = ?",
                args: [newAttempts, now, ip]
            });
        } else {
            await db.execute({
                sql: "INSERT INTO login_attempts (ip_address, attempts, last_attempt) VALUES (?, 1, ?)",
                args: [ip, now]
            });
        }
    } catch (e) {
        console.error('Record failed attempt error:', e);
    }
}

async function resetFailedAttempts(ip: string) {
    try {
        await db.execute({
            sql: "DELETE FROM login_attempts WHERE ip_address = ?",
            args: [ip]
        });
    } catch (e) {
        console.error('Reset failed attempts error:', e);
    }
}

async function checkAuth(cookies: any) {
    const sessionCookie = cookies.get('admin_session');
    if (!sessionCookie) return { authenticated: false };

    try {
        const decrypted = await decryptText(sessionCookie);
        const [userId, deviceId] = decrypted.split(':');
        if (!userId || !deviceId) return { authenticated: false };

        const userResult = await db.execute({
            sql: "SELECT id, username_encrypted, is_owner FROM admin_users WHERE id = ?",
            args: [userId]
        });
        if (userResult.rows.length === 0) return { authenticated: false };

        const deviceResult = await db.execute({
            sql: "SELECT is_approved FROM approved_devices WHERE device_id = ?",
            args: [deviceId]
        });
        if (deviceResult.rows.length === 0 || deviceResult.rows[0].is_approved !== 1) {
            return { authenticated: false };
        }

        const username = await decryptText(userResult.rows[0].username_encrypted as string);

        return {
            authenticated: true,
            user: {
                id: userResult.rows[0].id,
                username,
                isOwner: userResult.rows[0].is_owner === 1
            }
        };
    } catch (e) {
        console.error('Auth check error:', e);
        return { authenticated: false };
    }
}

function getScrapedStats() {
    try {
        const cacheFilePath = path.resolve('src/lib/stats-cache.json');
        if (fs.existsSync(cacheFilePath)) {
            return JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading stats cache in admin server:', e);
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

export const load: PageServerLoad = async ({ cookies, getClientAddress }) => {
    const deviceId = getDeviceId(cookies);
    
    const userCheck = await db.execute("SELECT COUNT(*) as count FROM admin_users");
    const hasPassword = Number(userCheck.rows[0]?.count || 0) > 0;

    if (!hasPassword) {
        return {
            hasPassword: false,
            authenticated: false,
            deviceId
        };
    }

    const auth = await checkAuth(cookies);
    if (!auth.authenticated) {
        return {
            hasPassword: true,
            authenticated: false,
            deviceId
        };
    }

    // Authenticated! Fetch news list and settings
    try {
        const newsResult = await db.execute("SELECT * FROM news ORDER BY rowid DESC");
        const newsItems = newsResult.rows.map((row: any) => ({
            id: row.id,
            date: row.date,
            cta_url: row.cta_url,
            support_url: row.support_url || '',
            support_btn: row.support_btn ? JSON.parse(row.support_btn) : null,
            category: JSON.parse(row.category),
            title: JSON.parse(row.title),
            content: JSON.parse(row.content),
            cta: JSON.parse(row.cta)
        }));

        const settingsResult = await db.execute("SELECT key, value FROM settings");
        const settings: Record<string, string> = {};
        for (const row of settingsResult.rows) {
            settings[row.key as string] = row.value as string;
        }

        // If current user is owner, fetch admins and devices
        let admins: any[] = [];
        let devices: any[] = [];
        if (auth.user?.isOwner) {
            const adminsResult = await db.execute("SELECT id, username_encrypted, is_owner, created_at FROM admin_users ORDER BY created_at DESC");
            for (const row of adminsResult.rows) {
                try {
                    const username = await decryptText(row.username_encrypted as string);
                    admins.push({
                        id: row.id,
                        username,
                        is_owner: row.is_owner === 1,
                        created_at: row.created_at
                      });
                } catch (err) {
                    console.error('Error decrypting username:', err);
                }
            }

            const devicesResult = await db.execute("SELECT * FROM approved_devices ORDER BY created_at DESC");
            devices = devicesResult.rows.map((row: any) => ({
                device_id: row.device_id,
                user_agent: row.user_agent,
                ip_address: row.ip_address,
                is_approved: row.is_approved === 1,
                created_at: row.created_at,
                approved_at: row.approved_at,
                name: row.name
            }));
        }

        return {
            hasPassword: true,
            authenticated: true,
            currentUser: auth.user,
            news: newsItems,
            settings,
            admins,
            devices,
            scrapedStats: getScrapedStats()
        };
    } catch (e) {
        console.error('Error loading admin page data:', e);
        return {
            hasPassword: true,
            authenticated: true,
            currentUser: auth.user,
            news: [],
            settings: {},
            admins: [],
            devices: [],
            scrapedStats: getScrapedStats()
        };
    }
};

export const actions: Actions = {
    setPassword: async ({ request, cookies, getClientAddress }) => {
        const userCheck = await db.execute("SELECT COUNT(*) as count FROM admin_users");
        if (Number(userCheck.rows[0]?.count || 0) > 0) {
            return fail(400, { error: 'Kurulum zaten tamamlanmış.' });
        }

        const data = await request.formData();
        const username = data.get('username')?.toString();
        const password = data.get('password')?.toString();

        if (!username || username.length < 3) {
            return fail(400, { error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
        }
        if (!password || password.length < 6) {
            return fail(400, { error: 'Şifre en az 6 karakter olmalıdır.' });
        }

        const deviceId = getDeviceId(cookies);
        const clientIp = getClientAddress();
        const userAgent = request.headers.get('user-agent') || 'Bilinmeyen Cihaz';

        try {
            const usernameHash = await hashValue(username.toLowerCase());
            const usernameEnc = await encryptText(username);
            const passwordHash = await hashValue(password);
            const userId = crypto.randomUUID();

            await db.execute({
                sql: "INSERT INTO admin_users (id, username_encrypted, username_hash, password_hash, is_owner, created_at) VALUES (?, ?, ?, ?, 1, ?)",
                args: [userId, usernameEnc, usernameHash, passwordHash, new Date().toISOString()]
            });

            // Automatically approve the initial setup device
            await db.execute({
                sql: "INSERT OR REPLACE INTO approved_devices (device_id, user_agent, ip_address, is_approved, created_at, approved_at, name) VALUES (?, ?, ?, 1, ?, ?, ?)",
                args: [deviceId, userAgent, clientIp, new Date().toISOString(), new Date().toISOString(), 'Kurucu Cihaz']
            });

            const sessionValue = await encryptText(`${userId}:${deviceId}`);
            cookies.set('admin_session', sessionValue, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Kurulum başarısız oldu.' });
        }
    },

    checkUsername: async ({ request, cookies, getClientAddress }) => {
        const clientIp = getClientAddress();
        const rateLimit = await checkRateLimit(clientIp);
        if (rateLimit.blocked) {
            return fail(429, { error: `Çok fazla başarısız deneme. Lütfen ${rateLimit.remainingTime} dakika sonra tekrar deneyin.` });
        }

        const data = await request.formData();
        const username = data.get('username')?.toString();
        if (!username) {
            return fail(400, { error: 'Kullanıcı adı gereklidir.' });
        }

        const usernameHash = await hashValue(username.toLowerCase());
        const userResult = await db.execute({
            sql: "SELECT id FROM admin_users WHERE username_hash = ?",
            args: [usernameHash]
        });

        if (userResult.rows.length === 0) {
            await recordFailedAttempt(clientIp);
            return fail(400, { error: 'Kullanıcı adı bulunamadı.' });
        }

        // Register the device if it's new
        const deviceId = getDeviceId(cookies);
        const deviceCheck = await db.execute({
            sql: "SELECT is_approved FROM approved_devices WHERE device_id = ?",
            args: [deviceId]
        });

        let isApproved = false;
        if (deviceCheck.rows.length > 0) {
            isApproved = deviceCheck.rows[0].is_approved === 1;
        } else {
            const userAgent = request.headers.get('user-agent') || 'Bilinmeyen Cihaz';
            let deviceName = 'Tarayıcı';
            if (userAgent.includes('Windows')) deviceName = 'Windows Cihaz';
            else if (userAgent.includes('Macintosh')) deviceName = 'Mac Cihaz';
            else if (userAgent.includes('Android')) deviceName = 'Android Cihaz';
            else if (userAgent.includes('iPhone')) deviceName = 'iPhone Cihaz';

            await db.execute({
                sql: "INSERT INTO approved_devices (device_id, user_agent, ip_address, is_approved, created_at, name) VALUES (?, ?, ?, 0, ?, ?)",
                args: [deviceId, userAgent, clientIp, new Date().toISOString(), deviceName]
            });
        }

        return { success: true, username, isApproved };
    },

    login: async ({ request, cookies, getClientAddress }) => {
        const clientIp = getClientAddress();
        const rateLimit = await checkRateLimit(clientIp);
        if (rateLimit.blocked) {
            return fail(429, { error: `Çok fazla başarısız deneme. Lütfen ${rateLimit.remainingTime} dakika sonra tekrar deneyin.` });
        }

        const data = await request.formData();
        const username = data.get('username')?.toString();
        const password = data.get('password')?.toString();

        if (!username || !password) {
            return fail(400, { error: 'Kullanıcı adı ve şifre gereklidir.' });
        }

        const usernameHash = await hashValue(username.toLowerCase());
        const passwordHash = await hashValue(password);

        const userResult = await db.execute({
            sql: "SELECT id, is_owner FROM admin_users WHERE username_hash = ? AND password_hash = ?",
            args: [usernameHash, passwordHash]
        });

        if (userResult.rows.length === 0) {
            await recordFailedAttempt(clientIp);
            return fail(400, { error: 'Hatalı kullanıcı adı veya şifre.' });
        }

        const userId = userResult.rows[0].id as string;
        const deviceId = getDeviceId(cookies);

        // Reset rate limits on success
        await resetFailedAttempts(clientIp);

        // Check device approval
        const deviceCheck = await db.execute({
            sql: "SELECT is_approved FROM approved_devices WHERE device_id = ?",
            args: [deviceId]
        });

        const isApproved = deviceCheck.rows.length > 0 && deviceCheck.rows[0].is_approved === 1;
        if (!isApproved) {
            return { success: false, devicePending: true, username, deviceId };
        }

        // Generate session
        const sessionValue = await encryptText(`${userId}:${deviceId}`);
        cookies.set('admin_session', sessionValue, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return { success: true };
    },

    logout: async ({ cookies }) => {
        cookies.delete('admin_session', { path: '/' });
        throw redirect(303, '/admin');
    },

    addAdminUser: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated || !auth.user?.isOwner) {
            return fail(403, { error: 'Bu işlem için yetkiniz yok.' });
        }

        const data = await request.formData();
        const username = data.get('username')?.toString();
        const password = data.get('password')?.toString();

        if (!username || username.length < 3) {
            return fail(400, { error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
        }
        if (!password || password.length < 6) {
            return fail(400, { error: 'Şifre en az 6 karakter olmalıdır.' });
        }

        try {
            const usernameHash = await hashValue(username.toLowerCase());
            
            // Check if user already exists
            const userCheck = await db.execute({
                sql: "SELECT COUNT(*) as count FROM admin_users WHERE username_hash = ?",
                args: [usernameHash]
            });
            if (Number(userCheck.rows[0]?.count || 0) > 0) {
                return fail(400, { error: 'Bu kullanıcı adı zaten kullanımda.' });
            }

            const usernameEnc = await encryptText(username);
            const passwordHash = await hashValue(password);
            const userId = crypto.randomUUID();

            await db.execute({
                sql: "INSERT INTO admin_users (id, username_encrypted, username_hash, password_hash, is_owner, created_at) VALUES (?, ?, ?, ?, 0, ?)",
                args: [userId, usernameEnc, usernameHash, passwordHash, new Date().toISOString()]
            });

            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Kullanıcı eklenemedi.' });
        }
    },

    deleteAdminUser: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated || !auth.user?.isOwner) {
            return fail(403, { error: 'Bu işlem için yetkiniz yok.' });
        }

        const data = await request.formData();
        const targetUserId = data.get('id')?.toString();
        if (!targetUserId) {
            return fail(400, { error: 'Kullanıcı ID gereklidir.' });
        }

        // Check if target is owner (cannot delete owner)
        const targetCheck = await db.execute({
            sql: "SELECT is_owner FROM admin_users WHERE id = ?",
            args: [targetUserId]
        });
        
        if (targetCheck.rows.length === 0) {
            return fail(400, { error: 'Kullanıcı bulunamadı.' });
        }
        
        if (targetCheck.rows[0].is_owner === 1) {
            return fail(400, { error: 'Kurucu yöneticinin yetkileri değiştirilemez veya silinemez.' });
        }

        try {
            await db.execute({
                sql: "DELETE FROM admin_users WHERE id = ?",
                args: [targetUserId]
            });
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Kullanıcı silinemedi.' });
        }
    },

    approveDevice: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated || !auth.user?.isOwner) {
            return fail(403, { error: 'Bu işlem için yetkiniz yok.' });
        }

        const data = await request.formData();
        const deviceId = data.get('device_id')?.toString();
        if (!deviceId) {
            return fail(400, { error: 'Cihaz ID gereklidir.' });
        }

        try {
            await db.execute({
                sql: "UPDATE approved_devices SET is_approved = 1, approved_at = ? WHERE device_id = ?",
                args: [new Date().toISOString(), deviceId]
            });
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Cihaz onaylanamadı.' });
        }
    },

    revokeDevice: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated || !auth.user?.isOwner) {
            return fail(403, { error: 'Bu işlem için yetkiniz yok.' });
        }

        const data = await request.formData();
        const deviceId = data.get('device_id')?.toString();
        if (!deviceId) {
            return fail(400, { error: 'Cihaz ID gereklidir.' });
        }

        try {
            await db.execute({
                sql: "UPDATE approved_devices SET is_approved = 0 WHERE device_id = ?",
                args: [deviceId]
            });
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Cihaz yetkisi kaldırılamadı.' });
        }
    },

    saveSettings: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated) {
            return fail(403, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const fields = [
            'social_youtube', 'social_youtube_join', 'social_instagram',
            'social_discord', 'social_discord_play', 'social_steam',
            'agent_enabled',
            'stat_youtube_subscribers', 'stat_youtube_videos',
            'stat_steam_members', 'stat_steam_online',
            'stat_steam_level', 'stat_steam_friends',
            'stat_x_members'
        ];

        try {
            for (const field of fields) {
                const val = data.get(field)?.toString();
                if (val !== undefined) {
                    await db.execute({
                        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                        args: [field, val]
                    });
                }
            }
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Failed to save settings.' });
        }
    },

    saveAgentStatus: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated) {
            return fail(403, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const agent_enabled = data.get('agent_enabled')?.toString();

        if (agent_enabled !== undefined) {
            try {
                await db.execute({
                    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('agent_enabled', ?)",
                    args: [agent_enabled]
                });
                return { success: true };
            } catch (e: any) {
                return fail(500, { error: e.message || 'Failed to save agent status.' });
            }
        }
        return fail(400, { error: 'Invalid data.' });
    },

    triggerAgent: async ({ fetch, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated) {
            return fail(403, { error: 'Unauthorized' });
        }

        const apiToken = env.NEWS_API_TOKEN || process.env.NEWS_API_TOKEN || 'local-agent-token-123';

        try {
            const res = await fetch('/api/cron-agent?manual=true', {
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                }
            });
            const data = await res.json();
            if (!res.ok) {
                return fail(res.status, { error: data.error || 'Failed to trigger agent.' });
            }
            return { success: true, agentResult: data };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Network error triggering agent.' });
        }
    },

    deleteNews: async ({ request, cookies }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated) {
            return fail(403, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const id = data.get('id')?.toString();

        if (!id) {
            return fail(400, { error: 'News ID is required.' });
        }

        try {
            await db.execute({
                sql: "DELETE FROM news WHERE id = ?",
                args: [id]
            });
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Failed to delete news item.' });
        }
    },

    saveNews: async ({ request, cookies, fetch }) => {
        const auth = await checkAuth(cookies);
        if (!auth.authenticated) {
            return fail(403, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const editId = data.get('edit_id')?.toString() || null;
        const title = data.get('title')?.toString();
        const content = data.get('content')?.toString();
        const category = data.get('category')?.toString();
        const ctaUrl = data.get('cta_url')?.toString();
        const supportUrl = data.get('support_url')?.toString() || null;
        const supportBtnText = data.get('support_btn_text')?.toString() || null;

        if (!title || !content || !category || !ctaUrl) {
            return fail(400, { error: 'Title, Content, Category, and Details URL are required.' });
        }

        const rawKey = env.GROQ_API_KEYS || process.env.GROQ_API_KEYS || env.GROQ_API_KEY || process.env.GROQ_API_KEY || "";
        const apiKeys = rawKey.split(',').map(k => k.trim()).filter(Boolean);
        if (apiKeys.length === 0) {
            return fail(500, { error: 'GROQ_API_KEYS is not configured on the server.' });
        }

        const modelName = env.GROQ_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

        try {
            // Translate using Groq
            const systemPrompt = `You are a professional multilingual translator. Translate the given news article's title, content, category, and support button text from Turkish to the following 12 languages: tr (Turkish), en (English), de (German), zh (Chinese), fr (French), uk (Ukrainian), es (Spanish), ja (Japanese), ko (Korean), it (Italian), ru (Russian), pt (Portuguese).

Ensure the translations are natural, accurate, and flow like professional gaming news.
Output ONLY a valid JSON object matching this exact schema:
{
  "title": { "tr": "...", "en": "...", "de": "...", "zh": "...", "fr": "...", "uk": "...", "es": "...", "ja": "...", "ko": "...", "it": "...", "ru": "...", "pt": "..." },
  "content": { "tr": "...", "en": "...", "de": "...", "zh": "...", "fr": "...", "uk": "...", "es": "...", "ja": "...", "ko": "...", "it": "...", "ru": "...", "pt": "..." },
  "category": { "tr": "...", "en": "...", "de": "...", "zh": "...", "fr": "...", "uk": "...", "es": "...", "ja": "...", "ko": "...", "it": "...", "ru": "...", "pt": "..." },
  "support_btn": { "tr": "...", "en": "...", "de": "...", "zh": "...", "fr": "...", "uk": "...", "es": "...", "ja": "...", "ko": "...", "it": "...", "ru": "...", "pt": "..." }
}`;

            const userPrompt = `Translate this news:
Category: ${category}
Title: ${title}
Content: ${content}
${supportBtnText ? `Support Button Text: ${supportBtnText}` : ''}`;

            let translations: any = null;
            let lastError = "";

            for (let i = 0; i < apiKeys.length; i++) {
                const currentKey = apiKeys[i];
                console.log(`Calling Groq API for translation with key index ${i}...`);
                try {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${currentKey}`
                        },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            temperature: 0.1,
                            response_format: { type: "json_object" }
                        })
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        lastError = `Groq API status ${response.status}: ${errText}`;
                        console.warn(`Groq API key index ${i} failed: ${lastError}`);
                        continue;
                    }

                    const resData = await response.json();
                    translations = JSON.parse(resData.choices[0].message.content);
                    break; // Success!
                } catch (err: any) {
                    lastError = err.message || "Unknown fetch error";
                    console.warn(`Groq API key index ${i} failed: ${lastError}`);
                }
            }

            if (!translations) {
                return fail(500, { error: `Groq translation request failed for all keys. Last error: ${lastError}` });
            }

            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' };
            const formattedDate = new Intl.DateTimeFormat('tr-TR', options).format(new Date());

            const defaultCta = {
                tr: 'Detaylar', en: 'Details', de: 'Details', zh: '详情',
                fr: 'Détails', uk: 'Деталі', es: 'Detalles', ja: '詳細',
                ko: '상세 정보', it: 'Dettagli', ru: 'Подробности', pt: 'Detalhes'
            };

            const supportBtnObject = supportBtnText ? translations.support_btn : null;

            if (editId) {
                // UPDATE existing item
                await db.execute({
                    sql: "UPDATE news SET title = ?, content = ?, category = ?, cta_url = ?, support_url = ?, support_btn = ? WHERE id = ?",
                    args: [
                        JSON.stringify(translations.title),
                        JSON.stringify(translations.content),
                        JSON.stringify(translations.category),
                        ctaUrl,
                        supportUrl,
                        supportBtnObject ? JSON.stringify(supportBtnObject) : null,
                        editId
                    ]
                });
            } else {
                // INSERT new item
                const slug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                const uniqueId = `${slug}-${Date.now().toString().slice(-4)}`;

                await db.execute({
                    sql: "INSERT INTO news (id, date, cta_url, support_url, support_btn, category, title, content, cta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [
                        uniqueId,
                        formattedDate,
                        ctaUrl,
                        supportUrl,
                        supportBtnObject ? JSON.stringify(supportBtnObject) : null,
                        JSON.stringify(translations.category),
                        JSON.stringify(translations.title),
                        JSON.stringify(translations.content),
                        JSON.stringify(defaultCta)
                    ]
                });

                // Enforce top 8 news items limit
                await db.execute(`
                    DELETE FROM news 
                    WHERE rowid NOT IN (
                        SELECT rowid FROM news 
                        ORDER BY rowid DESC LIMIT 8
                    )
                `);
            }

            return { success: true };
        } catch (e: any) {
            console.error('Error saving news item:', e);
            return fail(500, { error: e.message || 'Failed to translate and save news item.' });
        }
    }
};
