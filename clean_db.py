import os
from libsql_client import create_client

# Load env variables from frontend/.env
env_path = 'frontend/.env'
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                parts = line.split('=', 1)
                if len(parts) == 2:
                    key, val = parts[0].strip(), parts[1].strip()
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    os.environ[key] = val

turso_url = os.environ.get("TURSO_DB_URL")
turso_token = os.environ.get("TURSO_DB_AUTH_TOKEN")

print(f"Connecting to Turso: {turso_url}")
client = create_client(turso_url, auth_token=turso_token)

# We want to delete duplicate entries:
# 1. 'clutch-oyununa-turkce-dil-destegi' (Duplicate of clutch-oyunu-turkce-destegi)
# 2. 'alien-isolation-2-oyununa-turkce-dil-destegi' (Duplicate of alien-isolation-2-turkce-dil-destegi)

duplicates = [
    'clutch-oyununa-turkce-dil-destegi',
    'alien-isolation-2-oyununa-turkce-dil-destegi'
]

try:
    for dup_id in duplicates:
        print(f"Deleting duplicate with ID: {dup_id}...")
        client.execute("DELETE FROM news WHERE id = ?", [dup_id])
    print("Database cleanup completed successfully.")
finally:
    client.close()
