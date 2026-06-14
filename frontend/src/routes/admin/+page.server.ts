import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAdminPassword(): Promise<string | null> {
    try {
        const result = await db.execute("SELECT value FROM settings WHERE key = 'admin_password'");
        if (result.rows.length > 0) {
            return result.rows[0].value as string;
        }
    } catch (e) {
        console.error('Error fetching admin password:', e);
    }
    return null;
}

export const load: PageServerLoad = async ({ cookies }) => {
    const adminPassword = await getAdminPassword();
    const hasPassword = adminPassword !== null;

    if (!hasPassword) {
        return {
            hasPassword: false,
            authenticated: false
        };
    }

    const sessionCookie = cookies.get('admin_session');
    if (!sessionCookie || sessionCookie !== adminPassword) {
        return {
            hasPassword: true,
            authenticated: false
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

        return {
            hasPassword: true,
            authenticated: true,
            news: newsItems,
            settings
        };
    } catch (e) {
        console.error('Error loading admin page data:', e);
        return {
            hasPassword: true,
            authenticated: true,
            news: [],
            settings: {}
        };
    }
};

export const actions: Actions = {
    setPassword: async ({ request, cookies }) => {
        const data = await request.formData();
        const password = data.get('password')?.toString();

        if (!password || password.length < 6) {
            return fail(400, { error: 'Password must be at least 6 characters.' });
        }

        const existingPassword = await getAdminPassword();
        if (existingPassword !== null) {
            return fail(400, { error: 'Password is already set.' });
        }

        const hashedPassword = await hashPassword(password);
        try {
            await db.execute({
                sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', ?)",
                args: [hashedPassword]
            });
            cookies.set('admin_session', hashedPassword, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            return { success: true };
        } catch (e: any) {
            return fail(500, { error: e.message || 'Failed to save password.' });
        }
    },

    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const password = data.get('password')?.toString();

        if (!password) {
            return fail(400, { error: 'Password is required.' });
        }

        const adminPassword = await getAdminPassword();
        if (!adminPassword) {
            return fail(400, { error: 'No admin password set yet.' });
        }

        const hashedPassword = await hashPassword(password);
        if (hashedPassword !== adminPassword) {
            return fail(400, { error: 'Incorrect password.' });
        }

        cookies.set('admin_session', hashedPassword, {
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

    saveSettings: async ({ request, cookies }) => {
        // Auth Check
        const adminPassword = await getAdminPassword();
        const sessionCookie = cookies.get('admin_session');
        if (!sessionCookie || sessionCookie !== adminPassword) {
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

    triggerAgent: async ({ fetch, cookies }) => {
        // Auth Check
        const adminPassword = await getAdminPassword();
        const sessionCookie = cookies.get('admin_session');
        if (!sessionCookie || sessionCookie !== adminPassword) {
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
        // Auth Check
        const adminPassword = await getAdminPassword();
        const sessionCookie = cookies.get('admin_session');
        if (!sessionCookie || sessionCookie !== adminPassword) {
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

    saveNews: async ({ request, cookies }) => {
        // Auth Check
        const adminPassword = await getAdminPassword();
        const sessionCookie = cookies.get('admin_session');
        if (!sessionCookie || sessionCookie !== adminPassword) {
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

        const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
        const modelName = env.GROQ_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

        if (!groqKey) {
            return fail(500, { error: 'GROQ_API_KEY is not configured on the server.' });
        }

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

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${groqKey}`
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
                return fail(500, { error: `Groq translation request failed: ${errText}` });
            }

            const resData = await response.json();
            const translations = JSON.parse(resData.choices[0].message.content);

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
                // Generate a unique hyphenated slug in Turkish from title
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
