<script lang="ts">
    import { t } from '$lib/i18n.svelte';
    import { onMount } from 'svelte';

    let stats = $state<{
        youtubeSubscribers: string;
        youtubeVideos: string;
        steamGroupMembers: string;
        steamGroupOnline: string;
        steamLevel: string;
        steamFriends: string;
        xCommunityMembers: string;
    } | null>(null);

    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            if (res.ok) {
                stats = await res.json();
            }
        } catch (e) {
            console.error('Failed to load stats', e);
        }
    }

    onMount(() => {
        loadStats();
        const interval = setInterval(loadStats, 1000); // 1 second interval
        return () => clearInterval(interval);
    });

    function formatNumberString(numStr: string) {
        if (!numStr) return '';
        const val = parseInt(numStr.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val)) return numStr;
        const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'tr';
        try {
            return new Intl.NumberFormat(lang).format(val);
        } catch (e) {
            return val.toLocaleString();
        }
    }

    function convertYouTubeSubscribers(subStr: string) {
        if (!subStr) return '';
        let clean = subStr.replace(/\s*(abone|subscribers|subscriber|abonnés|abonnenten|Abonnenten|abonnés|подписчиков|订阅|구독자|iscritti|inscritos)/gi, '').trim();
        const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'tr';
        if (lang !== 'tr') {
            clean = clean.replace(/\bB\b/g, 'K').replace(/\bbin\b/g, 'K');
        }
        return clean;
    }

    function getDynamicStats(item: any, currentStats: typeof stats) {
        if (!currentStats) return item.stats;
        
        // YouTube
        if (item.url.includes('youtube.com/MstafaKadir')) {
            const { youtubeSubscribers, youtubeVideos } = currentStats;
            if (!youtubeSubscribers || !youtubeVideos) return item.stats;
            
            const cleanSubs = convertYouTubeSubscribers(youtubeSubscribers);
            const cleanVids = youtubeVideos.replace(/[^0-9]/g, '');
            
            const parts = item.stats.split(',');
            if (parts.length === 2) {
                const subPart = parts[0].replace(/[0-9.,\u00a0]+/i, cleanSubs);
                const vidPart = parts[1].replace(/[0-9]+\s*\+?/i, cleanVids);
                return `${subPart},${vidPart}`;
            }
        }
        
        // Steam Group
        if (item.url.includes('steamcommunity.com/groups/mstafakadir')) {
            const { steamGroupMembers, steamGroupOnline } = currentStats;
            if (!steamGroupMembers || !steamGroupOnline) return item.stats;
            
            const cleanMembers = formatNumberString(steamGroupMembers);
            const cleanOnline = formatNumberString(steamGroupOnline);
            
            const parts = item.stats.split(',');
            if (parts.length === 2) {
                const memPart = parts[0].replace(/[0-9.,\u00a0]+/i, cleanMembers);
                const onlPart = parts[1].replace(/[0-9.,\u00a0]+/i, cleanOnline);
                return `${memPart},${onlPart}`;
            }
        }
        
        // Steam Profile
        if (item.url.includes('steamcommunity.com/id/mustafakadir')) {
            const { steamLevel, steamFriends } = currentStats;
            if (!steamLevel || !steamFriends) return item.stats;
            
            const cleanLevel = formatNumberString(steamLevel);
            const cleanFriends = formatNumberString(steamFriends);
            
            const parts = item.stats.split(',');
            if (parts.length === 2) {
                const lvlPart = parts[0].replace(/[0-9.,\u00a0]+/i, cleanLevel);
                const frPart = parts[1].replace(/[0-9.,\u00a0]+/i, cleanFriends);
                return `${lvlPart},${frPart}`;
            }
        }

        // X Community
        if (item.url.includes('x.com/i/communities/1888733402792128619')) {
            const { xCommunityMembers } = currentStats;
            if (!xCommunityMembers) return item.stats;
            
            const isTr = (typeof document !== 'undefined' && document.documentElement.lang) === 'tr';
            const suffix = isTr ? ' Üye' : ' Members';
            const cleanVal = xCommunityMembers.replace(/\s*(members|üye|member|üyeler)/gi, '').trim();
            
            return `${cleanVal}${suffix}, ${item.stats}`;
        }
        
        return item.stats;
    }
</script>

<section id="community" class="container" style="padding-top: 120px; padding-bottom: 80px;">
    <span class="badge">{t.community.badge}</span>
    <h1 class="resp-title" style="margin-bottom: 24px;">
        {t.community.title_start}<span class="gradient-text">{t.community.title_gradient}</span>
    </h1>
    <p class="resp-subtitle" style="max-width: 800px; margin-bottom: 40px;">
        {t.community.subtitle}
    </p>

    <!-- Digital Inventory Table -->
    <div class="table-container" style="margin-bottom: 60px;">
        <table class="custom-table">
            <thead>
                <tr>
                    <th>{t.community.table_headers.type}</th>
                    <th>{t.community.table_headers.handle}</th>
                    <th>{t.community.table_headers.stats}</th>
                    <th style="text-align: right;">{t.community.table_headers.link}</th>
                </tr>
            </thead>
            <tbody>
                {#each t.community.inventory as item}
                    <tr>
                        <td class="highlight"><span class="badge-scale">{item.type}</span></td>
                        <td>{item.handle}</td>
                        <td>{getDynamicStats(item, stats)}</td>
                        <td style="text-align: right;">
                            <a 
                                href={item.url.startsWith('mailto:') ? item.url : `https://${item.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="btn-secondary" 
                                style="padding: 8px 18px; font-size: 0.8rem; text-decoration: none; display: inline-block;">
                                {t.community.visit_cta}
                            </a>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Action Details Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px;">
        <div class="visual-card" style="width: 100%;">
            <div class="card-content" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                <div>
                    <h3 style="margin-bottom: 12px; font-size: 1.1rem; border-bottom: none; padding-bottom: 0;">{t.community.discord_title}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 24px;">
                        {t.community.discord_desc}
                    </p>
                </div>
                <a href="https://discord.gg/CVdrTPUYMQ" target="_blank" rel="noopener noreferrer" class="btn-primary" style="text-decoration: none; text-align: center;">
                    {t.community.discord_cta}
                </a>
            </div>
        </div>

        <div class="visual-card" style="width: 100%;">
            <div class="card-content" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                <div>
                    <h3 style="margin-bottom: 12px; font-size: 1.1rem; border-bottom: none; padding-bottom: 0;">{t.community.tournament_title}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 24px;">
                        {t.community.tournament_desc}
                    </p>
                </div>
                <a href="https://youtube.com/MstafaKadir" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="text-decoration: none; text-align: center;">
                    {t.community.tournament_cta}
                </a>
            </div>
        </div>
    </div>
</section>

<style>
    @media (max-width: 768px) {
        :global(.custom-table th), :global(.custom-table td) {
            padding: 12px 14px !important;
            font-size: 0.8rem !important;
        }
    }
</style>
