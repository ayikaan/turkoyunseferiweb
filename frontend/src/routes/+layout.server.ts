import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async () => {
    try {
        const result = await db.execute("SELECT key, value FROM settings");
        const settings: Record<string, string> = {};
        for (const row of result.rows) {
            settings[row.key as string] = row.value as string;
        }
        
        // Define default settings in case they are missing
        const defaults: Record<string, string> = {
            social_youtube: 'https://youtube.com/MstafaKadir',
            social_youtube_join: 'https://youtube.com/MstafaKadir/join',
            social_instagram: 'https://instagram.com/mustafakadirce',
            social_discord: 'https://discord.gg/CVdrTPUYMQ',
            social_discord_play: 'https://discord.com/servers/play-ceviri-126103152098399360',
            social_steam: 'https://steamcommunity.com/groups/mstafakadir',
            agent_enabled: '1'
        };

        const finalSettings = { ...defaults, ...settings };

        return {
            settings: finalSettings
        };
    } catch (e) {
        console.error('Error loading settings in layout:', e);
        return {
            settings: {
                social_youtube: 'https://youtube.com/MstafaKadir',
                social_youtube_join: 'https://youtube.com/MstafaKadir/join',
                social_instagram: 'https://instagram.com/mustafakadirce',
                social_discord: 'https://discord.gg/CVdrTPUYMQ',
                social_discord_play: 'https://discord.com/servers/play-ceviri-126103152098399360',
                social_steam: 'https://steamcommunity.com/groups/mstafakadir',
                agent_enabled: '1'
            }
        };
    }
};
