import json
import urllib.request
import urllib.error
import sys
import os
import re
import datetime
import difflib

# Force UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def load_env_file():
    for p in [".env", "frontend/.env"]:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key, val = parts[0].strip(), parts[1].strip()
                            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                  val = val[1:-1]
                            if key not in os.environ:
                                os.environ[key] = val

load_env_file()

GROQ_API_KEY       = os.environ.get("GROQ_API_KEY", "")
API_URL            = os.environ.get("NEWS_API_URL", "https://turkoyunseferi.pages.dev/api/news")
API_TOKEN          = os.environ.get("NEWS_API_TOKEN", "")
MODEL_NAME        = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
DISCORD_WEBHOOK    = os.environ.get("DISCORD_WEBHOOK_URL", "")
WHATSAPP_PHONE     = os.environ.get("WHATSAPP_PHONE", "")
WHATSAPP_API_KEY   = os.environ.get("WHATSAPP_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.environ.get("TELEGRAM_CHAT_ID", "")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Global flag: set True when X cookie is detected as expired/invalid
X_COOKIE_EXPIRED = False

SYSTEM_PROMPT = """You are an autonomous news writer AI agent for the "Türkçe Oyun Seferi" (Turkish Game Campaign) community.
Your task is to analyze new social media posts (from YouTube and X/Twitter), compare them against the "Existing News" already in the database, and produce only genuinely new, non-duplicate news articles.

## DEDUPLICATION RULES (read carefully)
1. Compare every new candidate post (YouTube or X) against ALL items in "existing_news".
2. A candidate is a DUPLICATE if it reports the SAME real-world development as an existing news item — even if the wording, title, or phrasing is different. The decisive factor is the real-world event outcome:
   - "Turkish language support confirmed for Game X" == "Game X will ship with Turkish" → DUPLICATE
   - "Developer contacted about Turkish support for Game X" vs "Turkish support officially added to Game X" → DIFFERENT events, NOT duplicates
   - If a post talks about an event or game that has already been published/updated in the existing news (e.g. Alien Isolation 2, Clutch, Fable) with the same milestone state, mark it as DUPLICATE.
3. Between YouTube and X candidates covering the same event: YouTube ALWAYS takes priority. Mark the X post as duplicate.
4. On system restart, the "existing_news" list is already populated — check every candidate against it before writing anything new.

## SUPPORT LINK RULES (critical)
- ONLY include a "support_url" if the post text explicitly contains or references a direct community/petition/support URL (e.g. a Steam Discussion link, a Change.org link, a community forum URL).
- The "support_url" MUST be a community action/petition link — NEVER use the post URL itself (cta_url) as support_url.
- If no such link appears in the post text, set "support_url": null and "support_btn": null.
- DO NOT invent support URLs. DO NOT use official store pages as support_url.
- Examples of VALID support_url: "https://steamcommunity.com/app/XXXXX/discussions/0/..."
- Examples of INVALID support_url: "https://store.steampowered.com/app/XXXXX/", cta_url value

## OUTPUT STRUCTURE
First output "analysis" with chain-of-thought for every candidate, then "news_items" with only genuinely new articles.

Rules for news_items:
- Rewrite content in professional news bulletin style — do NOT copy the post verbatim. Content must be at least 3–4 complete sentences.
- Every field (title, content, category) MUST be provided in ALL 12 languages: Turkish ('tr'), English ('en'), German ('de'), Chinese ('zh'), French ('fr'), Ukrainian ('uk'), Spanish ('es'), Japanese ('ja'), Korean ('ko'), Italian ('it'), Russian ('ru'), Portuguese ('pt').
- "cta_url": use the exact URL of the original post (YouTube post URL or X/Twitter tweet URL).
- "date": copy exactly from the candidate's "date" field. NEVER invent or use today's date.
- "id": lowercase, hyphenated, unique slug in Turkish describing the news event.

Return ONLY valid JSON matching this exact schema (no extra text, no markdown fences):
{
  "analysis": [
    {
      "source": "youtube or x",
      "url": "post url",
      "text": "post content",
      "is_duplicate": true or false,
      "reasoning": "Detailed English explanation of why this is a duplicate or a new unique event."
    }
  ],
  "news_items": [
    {
      "id": "unique-news-slug-lowercase-hyphens",
      "date": "Date copied exactly from candidate payload (e.g. '8 Haziran 2026')",
      "title": {
        "tr": "Turkish Title", "en": "English Title", "de": "German Title", "zh": "Chinese Title",
        "fr": "French Title", "uk": "Ukrainian Title", "es": "Spanish Title",
        "ja": "Japanese Title", "ko": "Korean Title", "it": "Italian Title",
        "ru": "Russian Title", "pt": "Portuguese Title"
      },
      "content": {
        "tr": "Turkish content", "en": "English content", "de": "German content", "zh": "Chinese content",
        "fr": "French content", "uk": "Ukrainian content", "es": "Spanish content",
        "ja": "Japanese content", "ko": "Korean content", "it": "Italian content",
        "ru": "Russian content", "pt": "Portuguese content"
      },
      "category": {
        "tr": "Kategori", "en": "Category", "de": "Kategorie", "zh": "类别",
        "fr": "Catégorie", "uk": "Категорія", "es": "Categoría",
        "ja": "カテゴリ", "ko": "카테고리", "it": "Categoria",
        "ru": "Категория", "pt": "Categoria"
      },
      "cta": {
        "tr": "Detaylar", "en": "Details", "de": "Details", "zh": "详情",
        "fr": "Détails", "uk": "Деталі", "es": "Detalles",
        "ja": "詳細", "ko": "상세 정보", "it": "Dettagli",
        "ru": "Подробности", "pt": "Detalhes"
      },
      "cta_url": "Exact URL of the original post",
      "support_url": null,
      "support_btn": null
    }
  ]
}"""


def parse_relative_date(rel_str):
    now = datetime.datetime.now()
    if not rel_str:
        return format_date_tr(now)
    rel_str = rel_str.lower().strip()
    target = now
    if "dün" in rel_str or "yesterday" in rel_str:
        target = now - datetime.timedelta(days=1)
    elif any(x in rel_str for x in ["saat", "dakika", "şimdi", "sn", "hour", "minute", "now"]):
        target = now
    elif "gün" in rel_str or "day" in rel_str:
        m = re.search(r'(\d+)', rel_str)
        target = now - datetime.timedelta(days=int(m.group(1)) if m else 1)
    elif "hafta" in rel_str or "week" in rel_str:
        m = re.search(r'(\d+)', rel_str)
        target = now - datetime.timedelta(days=(int(m.group(1)) if m else 1) * 7)
    elif "ay" in rel_str or "month" in rel_str:
        m = re.search(r'(\d+)', rel_str)
        target = now - datetime.timedelta(days=(int(m.group(1)) if m else 1) * 30)
    elif "yıl" in rel_str or "year" in rel_str:
        m = re.search(r'(\d+)', rel_str)
        target = now - datetime.timedelta(days=(int(m.group(1)) if m else 1) * 365)
    return format_date_tr(target)


def format_date_tr(dt):
    months = {1:"Ocak",2:"Şubat",3:"Mart",4:"Nisan",5:"Mayıs",6:"Haziran",
              7:"Temmuz",8:"Ağustos",9:"Eylül",10:"Ekim",11:"Kasım",12:"Aralık"}
    return f"{dt.day} {months[dt.month]} {dt.year}"


def parse_x_date(created_at_str):
    if not created_at_str:
        return format_date_tr(datetime.datetime.now())
    try:
        dt = datetime.datetime.strptime(created_at_str, "%a %b %d %H:%M:%S %z %Y")
        return format_date_tr(dt)
    except Exception:
        return format_date_tr(datetime.datetime.now())


def scrape_youtube_posts(limit=5):
    print("Scraping YouTube Community posts...")
    try:
        cookie_str = os.environ.get("YOUTUBE_COOKIE", "")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        if cookie_str:
            headers['Cookie'] = cookie_str
        req = urllib.request.Request("https://www.youtube.com/@MstafaKadir/posts", headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode("utf-8")
            if "consent.youtube.com" in html:
                print("ERROR: YouTube consent page. YOUTUBE_COOKIE missing or expired.", file=sys.stderr)
                return []
            json_match = re.search(r'var ytInitialData\s*=\s*(\{.*?\});', html)
            if json_match:
                yt_data = json.loads(json_match.group(1))
                posts = []
                def find_posts_recursive(obj):
                    if isinstance(obj, dict):
                        if 'backstagePostRenderer' in obj:
                            post = obj['backstagePostRenderer']
                            post_id = post.get('postId', '')
                            post_url = f"https://www.youtube.com/post/{post_id}" if post_id else "https://www.youtube.com/@MstafaKadir/posts"
                            rel_time = ""
                            if 'publishedTimeText' in post and 'runs' in post['publishedTimeText']:
                                runs = post['publishedTimeText']['runs']
                                if runs:
                                    rel_time = runs[0].get('text', '')
                            if 'contentText' in post and 'runs' in post['contentText']:
                                text = "".join([r.get('text', '') for r in post['contentText']['runs']])
                                posts.append({'text': text, 'url': post_url, 'date': parse_relative_date(rel_time)})
                        for v in obj.values():
                            find_posts_recursive(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            find_posts_recursive(item)
                find_posts_recursive(yt_data)
                return posts[:limit]
    except Exception as e:
        print(f"YouTube scrape error: {e}", file=sys.stderr)
    return []


def scrape_x_community(limit=5):
    global X_COOKIE_EXPIRED
    x_cookie = os.environ.get("X_COOKIE", "")
    if not x_cookie:
        print("X_COOKIE not set, skipping X scrape.", file=sys.stderr)
        return []
    if x_cookie.startswith('"') and x_cookie.endswith('"'):
        x_cookie = x_cookie[1:-1]

    # Quick pre-check: ct0 (CSRF token) must exist in a valid session cookie
    if not re.search(r'ct0=([^;]+)', x_cookie) or not re.search(r'auth_token=([^;]+)', x_cookie):
        print("X_COOKIE missing ct0 or auth_token — cookie is invalid or malformed.", file=sys.stderr)
        print("::warning::X_COOKIE is invalid (missing ct0/auth_token). Please update the secret.", flush=True)
        X_COOKIE_EXPIRED = True
        return []

    import urllib.parse
    variables = {"communityId": "1888733402792128619", "count": 20, "withTweetQuoteCount": True,
                 "includePromotedContent": False, "withQuickPromoteEligibilitySheets": True,
                 "withVoice": True, "withVibe": True}
    features = {"rweb_tipjar_consumption_enabled": True, "responsive_web_graphql_exclude_directive_enabled": True,
                "verified_phone_label_enabled": False, "creator_subscriptions_tweet_preview_api_enabled": True,
                "responsive_web_graphql_timeline_navigation_enabled": True,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
                "communities_web_enable_tweet_association": True, "tweetypie_unmention_optimization_enabled": True,
                "responsive_web_edit_tweet_api_enabled": True,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
                "view_counts_everywhere_api_enabled": True, "longform_notetweets_consumption_enabled": True,
                "responsive_web_twitter_article_tweet_consumption_enabled": True,
                "tweet_awards_web_tipping_enabled": False, "creator_subscriptions_quote_tweet_preview_enabled": False,
                "freedom_of_speech_not_reach_fetch_enabled": True, "standardized_nudges_misinfo": True,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
                "rweb_video_timestamps_enabled": True, "longform_notetweets_rich_text_read_enabled": True,
                "longform_notetweets_inline_expand_super_tweet_enabled": True,
                "responsive_web_enhance_cards_enabled": False}

    csrf = re.search(r'ct0=([^;]+)', x_cookie).group(1)
    query_url = (f"https://x.com/i/api/graphql/mO0T1BvIee2Q5Hk7547_rQ/CommunityTweetsTimeline"
                 f"?variables={urllib.parse.quote(json.dumps(variables))}"
                 f"&features={urllib.parse.quote(json.dumps(features))}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*', 'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejfCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'Cookie': x_cookie, 'x-twitter-active-user': 'yes', 'x-twitter-client-language': 'tr',
        'x-csrf-token': csrf
    }
    print("Scraping X Community posts (GraphQL API)...")
    try:
        req = urllib.request.Request(query_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            tweets = []
            def find_tweets_recursive(obj):
                if isinstance(obj, dict):
                    if 'tweet_results' in obj and 'result' in obj['tweet_results']:
                        tr = obj['tweet_results']['result']
                        legacy = tr.get('legacy', {})
                        text = legacy.get('full_text', '')
                        tweet_id = legacy.get('id_str', '')
                        created_at = legacy.get('created_at', '')
                        screen_name = tr.get('core', {}).get('user_results', {}).get('result', {}).get('legacy', {}).get('screen_name', '')
                        url = f"https://x.com/{screen_name}/status/{tweet_id}" if screen_name and tweet_id else "https://x.com/i/communities/1888733402792128619"
                        if text and not any(t['text'] == text for t in tweets):
                            tweets.append({'text': text, 'url': url, 'date': parse_x_date(created_at)})
                    for v in obj.values():
                        find_tweets_recursive(v)
                elif isinstance(obj, list):
                    for item in obj:
                        find_tweets_recursive(item)
            find_tweets_recursive(res_data)
            return tweets[:limit]
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            # Cookie expired or revoked
            print(f"X scrape failed with HTTP {e.code} — session cookie has expired.", file=sys.stderr)
            # GitHub Actions warning annotation (shows orange banner in Actions UI)
            print("::warning::X_COOKIE has expired (HTTP 401/403). Go to GitHub repo Settings > Secrets and update X_COOKIE.", flush=True)
            X_COOKIE_EXPIRED = True
        else:
            print(f"X scrape HTTP error: {e.code}", file=sys.stderr)
    except Exception as e:
        print(f"X scrape error: {e}", file=sys.stderr)
    return []


def fetch_existing_news():
    print(f"Fetching existing news from {API_URL}...")
    req = urllib.request.Request(API_URL, headers={"Authorization": f"Bearer {API_TOKEN}"})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to fetch existing news: {e}", file=sys.stderr)
        return []


def call_groq(payload):
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set!", file=sys.stderr)
        return None
    print(f"Calling Groq API ({MODEL_NAME})...")
    user_prompt = (
        "Review the existing news and new social media posts, then produce non-duplicate new news items:\n\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )
    data = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    req = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_API_KEY}",
                 "User-Agent": "Mozilla/5.0"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return json.loads(res_data["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as e:
        try:
            print(f"Groq HTTP Error ({e.code}): {e.read().decode()}", file=sys.stderr)
        except Exception:
            print(f"Groq HTTP Error ({e.code})", file=sys.stderr)
    except Exception as e:
        print(f"Groq call error: {e}", file=sys.stderr)
    return None


def publish_news(item):
    nid = item.get("id")
    if not nid or not item.get("title") or not item.get("content") or not item.get("category"):
        print(f"WARN: Skipping item with missing fields. ID: {nid}")
        return False
    print(f"Publishing news item: {nid}")
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(item).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_TOKEN}"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            if res.get("success"):
                print(f"✓ Published: {nid}")
                return True
            else:
                print(f"API error: {res.get('error')}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode("utf-8"))
            print(f"API HTTP {e.code}: {err.get('error')}", file=sys.stderr)
        except Exception:
            print(f"API HTTP {e.code}", file=sys.stderr)
    except Exception as e:
        print(f"Publish error: {e}", file=sys.stderr)
    return False


def send_discord_notification(message: str):
    """Send a Discord webhook message. Only called when DISCORD_WEBHOOK_URL is set."""
    if not DISCORD_WEBHOOK:
        return
    try:
        payload = json.dumps({"content": message, "username": "Türkçe Oyun Seferi Ajan"}).encode("utf-8")
        req = urllib.request.Request(
            DISCORD_WEBHOOK,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        urllib.request.urlopen(req)
        print("Discord notification sent.")
    except Exception as e:
        print(f"Discord notification failed: {e}", file=sys.stderr)


def send_whatsapp_notification(message: str):
    """Send a WhatsApp message via CallMeBot API. Only called when WHATSAPP_PHONE and WHATSAPP_API_KEY are set."""
    if not WHATSAPP_PHONE or not WHATSAPP_API_KEY:
        return
    try:
        import urllib.parse
        # Convert Discord bold markdown (**) to WhatsApp bold markdown (*)
        wa_message = message.replace("**", "*")
        encoded_message = urllib.parse.quote(wa_message)
        url = f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_PHONE}&text={encoded_message}&apikey={WHATSAPP_API_KEY}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        urllib.request.urlopen(req)
        print("WhatsApp notification sent.")
    except Exception as e:
        print(f"WhatsApp notification failed: {e}", file=sys.stderr)


def send_telegram_notification(message: str):
    """Send a Telegram message via Bot API. Only called when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        # Strip Discord-style bold markers (**) — Telegram uses *text* for italic, not bold
        tg_message = message.replace("**", "")
        payload = json.dumps({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": tg_message,
            "parse_mode": "HTML"
        }).encode("utf-8")
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        urllib.request.urlopen(req)
        print("Telegram notification sent.")
    except Exception as e:
        print(f"Telegram notification failed: {e}", file=sys.stderr)


def main():
    import time
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] News agent starting (one-shot mode)...")

    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY is required.", file=sys.stderr)
        sys.exit(1)
    if not API_TOKEN:
        print("ERROR: NEWS_API_TOKEN is required.", file=sys.stderr)
        sys.exit(1)

    existing_news = fetch_existing_news()
    yt_posts = scrape_youtube_posts(limit=5)
    x_tweets = scrape_x_community(limit=5)

    # Cookie expiry notification
    if X_COOKIE_EXPIRED:
        msg = (
            "⚠️ **X (Twitter) Cookie Süresi Doldu!**\n"
            "Haber ajanı yalnızca YouTube ile çalışıyor.\n"
            "Lütfen GitHub repo'nun **Settings → Secrets → X_COOKIE** alanını güncel cookie ile değiştirin.\n"
            "Rehber: x.com'a giriş yap → F12 → Application → Cookies → değerleri kopyala."
        )
        send_discord_notification(msg)
        send_whatsapp_notification(msg)
        send_telegram_notification(msg)

    if not yt_posts and not x_tweets:
        print("No social media data scraped. Exiting.")
        sys.exit(0)

    existing_summaries = [
        {"id": item.get("id"), "title_tr": (item.get("title") or {}).get("tr", ""),
         "content_summary_tr": ((item.get("content") or {}).get("tr", ""))[:120]}
        for item in existing_news
    ]

    # Pre-filter duplicates using fuzzy title comparison (difflib)
    filtered_yt = []
    filtered_x = []

    def clean_text(t):
        if not t:
            return ""
        # Türkçe küçük harfe çevirme ve noktalama işaretlerini, fazla boşlukları temizleme
        t = t.lower().replace('ı', 'i').replace('ö', 'o').replace('ü', 'u').replace('ş', 's').replace('ç', 'c').replace('ğ', 'g')
        return re.sub(r'[^\w\s]', '', t).strip()

    for candidate in yt_posts:
        cand_text = clean_text(candidate.get("text", ""))
        is_dup = False
        for ext in existing_summaries:
            ext_title = clean_text(ext.get("title_tr", ""))
            # Eğer başlık adayın yazısının içinde geçiyorsa ya da benzerlik %65'ten yüksekse eliyoruz
            if len(ext_title) > 5 and (ext_title in cand_text or cand_text in ext_title):
                is_dup = True
                break
            ratio = difflib.SequenceMatcher(None, cand_text[:100], ext_title[:100]).ratio()
            if ratio > 0.65:
                is_dup = True
                break
        if not is_dup:
            filtered_yt.append(candidate)
        else:
            print(f"Skipping YouTube candidate as pre-filtered duplicate: {candidate.get('text', '')[:60]}...")

    for candidate in x_tweets:
        cand_text = clean_text(candidate.get("text", ""))
        is_dup = False
        for ext in existing_summaries:
            ext_title = clean_text(ext.get("title_tr", ""))
            if len(ext_title) > 5 and (ext_title in cand_text or cand_text in ext_title):
                is_dup = True
                break
            ratio = difflib.SequenceMatcher(None, cand_text[:100], ext_title[:100]).ratio()
            if ratio > 0.65:
                is_dup = True
                break
        if not is_dup:
            filtered_x.append(candidate)
        else:
            print(f"Skipping X candidate as pre-filtered duplicate: {candidate.get('text', '')[:60]}...")

    if not filtered_yt and not filtered_x:
        print("All scraped candidates were filtered out as duplicates. Exiting.")
        sys.exit(0)

    payload = {"existing_news": existing_summaries, "youtube_candidates": filtered_yt, "x_candidates": filtered_x}
    news_data = call_groq(payload)

    if news_data and "analysis" in news_data:
        print("\n--- Agent Analysis ---")
        for a in news_data["analysis"]:
            print(f"[{a.get('source','?').upper()}] duplicate={a.get('is_duplicate')} | {a.get('reasoning','')}")
        print("----------------------\n")

    if news_data and "news_items" in news_data:
        items = news_data["news_items"]
        print(f"LLM detected {len(items)} new unique news item(s).")
        published = 0
        for item in items:
            if item.get("id") and item.get("title") and item.get("content") and item.get("category"):
                # Double-check database ID (slug) existence to ensure no duplicate key errors
                db_ids = [x.get("id") for x in existing_news]
                if item.get("id") in db_ids:
                    print(f"WARN: LLM generated an ID ({item.get('id')}) that already exists in DB. Skipping.")
                    continue
                if publish_news(item):
                    published += 1
            else:
                print(f"WARN: Malformed item skipped: {item.get('id')}")
        print(f"\nDone. {published}/{len(items)} item(s) published.")
    else:
        print("No new news items produced by LLM.")

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Agent finished.")


if __name__ == "__main__":
    main()
