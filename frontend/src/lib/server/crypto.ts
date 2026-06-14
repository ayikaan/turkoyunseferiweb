import { db } from './db';

async function getEncryptionKey(): Promise<string> {
    try {
        const result = await db.execute("SELECT value FROM settings WHERE key = 'db_encryption_key'");
        if (result.rows.length > 0) {
            return result.rows[0].value as string;
        }
    } catch (e) {
        console.error('Error fetching db_encryption_key:', e);
    }
    
    // Generate a new key if not exists
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    try {
        await db.execute({
            sql: "INSERT OR IGNORE INTO settings (key, value) VALUES ('db_encryption_key', ?)",
            args: [newKey]
        });
    } catch (e) {
        console.error('Error saving new db_encryption_key:', e);
    }
    return newKey;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptText(text: string): Promise<string> {
    const secret = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getCryptoKey(secret);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(text)
    );
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decryptText(encryptedBase64: string): Promise<string> {
    const secret = await getEncryptionKey();
    const combined = new Uint8Array(
        atob(encryptedBase64)
            .split('')
            .map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const key = await getCryptoKey(secret);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    );
    return new TextDecoder().decode(decrypted);
}

export async function hashValue(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
