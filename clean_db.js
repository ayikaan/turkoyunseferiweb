import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
if (fs.existsSync('frontend/.env')) {
    const envConfig = dotenv.parse(fs.readFileSync('frontend/.env'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const url = process.env.TURSO_DB_URL;
const authToken = process.env.TURSO_DB_AUTH_TOKEN;

console.log("Connecting to Turso:", url);
const db = createClient({ url, authToken });

async function clean() {
    try {
        const duplicates = [
            'clutch-oyununa-turkce-dil-destegi',
            'alien-isolation-2-oyununa-turkce-dil-destegi'
        ];

        for (const id of duplicates) {
            console.log(`Deleting: ${id}`);
            await db.execute({
                sql: "DELETE FROM news WHERE id = ?",
                args: [id]
            });
        }
        console.log("Cleanup finished!");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

clean();
