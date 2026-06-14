import { createClient } from '@libsql/client';
import fs from 'fs';

// Simple parser for .env without dotenv dependency
function loadEnv() {
    if (fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf-8');
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                let [key, ...valParts] = line.split('=');
                let val = valParts.join('=').trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                process.env[key.trim()] = val;
            }
        });
    }
}

loadEnv();

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
            console.log(`Deleting duplicate ID: ${id}`);
            await db.execute({
                sql: "DELETE FROM news WHERE id = ?",
                args: [id]
            });
        }
        console.log("Cleanup finished successfully!");
    } catch (e) {
        console.error("Cleanup error:", e);
    } finally {
        process.exit(0);
    }
}

clean();
