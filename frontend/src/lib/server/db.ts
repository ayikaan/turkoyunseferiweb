import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';

const tursoUrl = env.TURSO_DB_URL || process.env.TURSO_DB_URL;
const tursoToken = env.TURSO_DB_AUTH_TOKEN || process.env.TURSO_DB_AUTH_TOKEN;

let dbUrl = tursoUrl;
let dbToken = tursoToken;

if (!dbUrl) {
    try {
        const dbDir = path.resolve('src/lib/server');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        dbUrl = `file:${path.join(dbDir, 'news.db')}`;
    } catch (e) {
        console.warn("Local database directory is not writable, falling back to in-memory database:", e);
        dbUrl = "file::memory:";
    }
}

export const db = createClient({
    url: dbUrl,
    authToken: dbToken || undefined,
});

// Initialize database table and seed data if empty
async function initDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS news (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                cta_url TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                cta TEXT NOT NULL
            )
        `);

        // Add support fields if they do not exist
        await db.execute("ALTER TABLE news ADD COLUMN support_url TEXT").catch(() => {});
        await db.execute("ALTER TABLE news ADD COLUMN support_btn TEXT").catch(() => {});

        // Check if table is empty
        const result = await db.execute("SELECT COUNT(*) as count FROM news");
        const count = Number(result.rows[0]?.count || 0);

        if (count === 0) {
            // Seed from dynamic-news.json if exists
            const jsonPath = path.resolve('src/lib/dynamic-news.json');
            if (fs.existsSync(jsonPath)) {
                console.log("Seeding SQLite database from dynamic-news.json...");
                const jsonData = fs.readFileSync(jsonPath, 'utf8');
                const newsItems = JSON.parse(jsonData);

                const defaultCta = {
                    tr: 'Detaylar', en: 'Details', de: 'Details', zh: '详情',
                    fr: 'Détails', uk: 'Деталі', es: 'Detalles', ja: '詳細',
                    ko: '상세 정보', it: 'Dettagli', ru: 'Подробности', pt: 'Detalhes'
                };

                for (const item of newsItems) {
                    await db.execute({
                        sql: "INSERT INTO news (id, date, cta_url, category, title, content, cta) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        args: [
                            item.id,
                            item.date,
                            item.cta_url || 'https://youtube.com/MstafaKadir',
                            JSON.stringify(item.category),
                            JSON.stringify(item.title),
                            JSON.stringify(item.content),
                            JSON.stringify(item.cta || defaultCta)
                        ]
                    });
                }
                console.log("Database seeding completed.");
            }
        }
    } catch (e) {
        console.error("Failed to initialize database:", e);
    }
}

// Trigger initialization
initDb();
