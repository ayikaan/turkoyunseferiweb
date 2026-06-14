import os
import json
import urllib.request

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

api_url = os.environ.get("NEWS_API_URL", "https://turkoyunseferi.pages.dev/api/news")
api_token = os.environ.get("NEWS_API_TOKEN", "")

# Fetch current news items
print(f"Fetching current news from {api_url}...")
req_get = urllib.request.Request(api_url, headers={"Authorization": f"Bearer {api_token}"})
try:
    with urllib.request.urlopen(req_get) as resp:
        news_items = json.loads(resp.read().decode('utf-8'))
except Exception as e:
    print(f"Error fetching news: {e}")
    news_items = []

# Identifiers of duplicate items we want to clean
# Looking at the image: 
# - Duplicate 1: "Clutch Oyunu Türkçe Dil Desteğine Kavuştu" vs "Clutch Oyununa Türkçe Dil Desteği Geldi!" (both are Clutch/13 June)
# - Duplicate 2: "Alien Isolation 2 için Türkçe Dil Desteği Talebi" vs "Alien Isolation 2 Oyununa Türkçe Dil Desteği Talebi"
# Let's inspect what items we have and their IDs.
print("Current DB News Items:")
for item in news_items:
    title_tr = item.get("title", {}).get("tr", "")
    print(f"ID: {item.get('id')} | Date: {item.get('date')} | Title: {title_tr}")

# List of target duplicates to remove:
# We'll write a script that deletes specific keys or we can connect directly to Turso DB.
# Wait, let's look at how the API lets us delete?
# The +server.ts API doesn't support DELETE route! Only GET and POST.
# However, we can connect directly to the Turso database using python and '@libsql/client' (or simple sqlite3 if local, but since it's Turso cloud we should use libsql).
