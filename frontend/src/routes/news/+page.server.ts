import type { PageServerLoad } from './$types';
import { db, parseTurkishDate } from '$lib/server/db';

export const load: PageServerLoad = async () => {
    try {
        const result = await db.execute("SELECT * FROM news ORDER BY rowid DESC");
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
        newsItems.sort((a, b) => parseTurkishDate(b.date).getTime() - parseTurkishDate(a.date).getTime());
        return {
            initialNews: newsItems
        };
    } catch (e) {
        console.error('Error reading news in server load:', e);
        return {
            initialNews: []
        };
    }
};
