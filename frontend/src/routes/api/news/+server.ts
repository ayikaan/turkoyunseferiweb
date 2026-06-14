import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';

// Get client IP helper
function getClientIp(request: Request, clientAddress: string) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return clientAddress;
}

export const GET: RequestHandler = async () => {
    try {
        const result = await db.execute("SELECT * FROM news");
        const newsItems = result.rows.map((row: any) => ({
            id: row.id,
            date: row.date,
            cta_url: row.cta_url,
            support_url: row.support_url || null,
            support_btn: row.support_btn ? JSON.parse(row.support_btn) : null,
            category: JSON.parse(row.category),
            title: JSON.parse(row.title),
            content: JSON.parse(row.content),
            cta: JSON.parse(row.cta)
        }));
        
        return json(newsItems);
    } catch (e) {
        console.error('Error reading news database:', e);
        return json({ error: 'Failed to load news' }, { status: 500 });
    }
};

export const POST: RequestHandler = async (event) => {
    const { request } = event;
    const clientAddress = (event as any).clientAddress;
    // Basic IP security check: only allow localhost connections for local agent
    const ip = getClientIp(request, clientAddress);
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1';

    // Dynamic Token check from Environment Variables
    const apiToken = env.NEWS_API_TOKEN || process.env.NEWS_API_TOKEN || 'local-agent-token-123';
    const authHeader = request.headers.get('Authorization');
    const isValidToken = authHeader === `Bearer ${apiToken}`;

    if (!isLocal && !isValidToken) {
        return json({ error: 'Unauthorized. Invalid API Token.' }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Validate required fields
        const { id, title, content, category, cta, cta_url, date, support_url, support_btn } = body;
        if (!id || !title || !content || !category) {
            return json({ error: 'Missing required fields. id, title, content, and category are required.' }, { status: 400 });
        }

        // Validate translation structures
        if (typeof title !== 'object' || typeof content !== 'object' || typeof category !== 'object') {
            return json({ error: 'title, content, and category must be multilingual translation maps (e.g. { "tr": "...", "en": "..." }).' }, { status: 400 });
        }

        // Check for duplicate in database
        const dupCheck = await db.execute({
            sql: "SELECT id FROM news WHERE id = ?",
            args: [id]
        });
        
        if (dupCheck.rows.length > 0) {
            return json({ error: `News item with id '${id}' already exists.` }, { status: 409 });
        }

        // Set date to local Turkish time format if not provided
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' };
        const formattedDate = date || new Intl.DateTimeFormat('tr-TR', options).format(new Date());

        const defaultCta = {
            tr: 'Detaylar', en: 'Details', de: 'Details', zh: '详情',
            fr: 'Détails', uk: 'Деталі', es: 'Detalles', ja: '詳細',
            ko: '상세 정보', it: 'Dettagli', ru: 'Подробности', pt: 'Detalhes'
        };

        const newNewsItem = {
            id,
            date: formattedDate,
            cta_url: cta_url || 'https://youtube.com/MstafaKadir',
            support_url: support_url || null,
            support_btn: support_btn || null,
            category,
            title,
            content,
            cta: cta || defaultCta
        };

        // Insert into SQLite database
        await db.execute({
            sql: "INSERT INTO news (id, date, cta_url, support_url, support_btn, category, title, content, cta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            args: [
                newNewsItem.id,
                newNewsItem.date,
                newNewsItem.cta_url,
                newNewsItem.support_url,
                newNewsItem.support_btn ? JSON.stringify(newNewsItem.support_btn) : null,
                JSON.stringify(newNewsItem.category),
                JSON.stringify(newNewsItem.title),
                JSON.stringify(newNewsItem.content),
                JSON.stringify(newNewsItem.cta)
            ]
        });

        // Keep only top 8 latest news items (delete older ones based on rowid order)
        await db.execute(`
            DELETE FROM news 
            WHERE rowid NOT IN (
                SELECT rowid FROM news 
                ORDER BY rowid DESC LIMIT 8
            )
        `);

        return json({ success: true, item: newNewsItem });
    } catch (e) {
        console.error('Error saving news item:', e);
        return json({ error: 'Failed to save news item' }, { status: 500 });
    }
};
