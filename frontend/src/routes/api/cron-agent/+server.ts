import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an autonomous news writer AI agent for the "Türkçe Oyun Seferi" (Turkish Game Campaign) community.
Your task is to analyze new social media posts (from YouTube and X/Twitter), compare them against the "Existing News" already in the database, and produce only genuinely new, non-duplicate news articles.

## DEDUPLICATION RULES (read carefully)
1. Compare every new candidate post (YouTube or X) against ALL items in "existing_news".
2. A candidate is a DUPLICATE if it reports the SAME real-world development as an existing news item — even if the wording, title, or phrasing is different. The decisive factor is the real-world event outcome:
   - "Turkish language support confirmed for Game X" == "Game X will ship with Turkish" → DUPLICATE
   - "Developer contacted about Turkish support for Game X" vs "Turkish support officially added to Game X" → DIFFERENT events, NOT duplicates
3. Between YouTube and X candidates covering the same event: YouTube ALWAYS takes priority. Mark the X post as duplicate.
4. On system restart, the "existing_news" list is already populated — check every candidate against it before writing anything new.

## SUPPORT LINK RULES (critical)
- ONLY include a "support_url" if the post text explicitly contains or references a direct community/petition/support URL (e.g. a Steam Discussion link, a Change.org link, a community forum URL).
- The "support_url" MUST be a community action/petition link — NEVER use the post URL itself (cta_url) as support_url.
- If no such link appears in the post text, set "support_url": null and "support_btn": null.
- DO NOT invent support URLs. DO NOT use official store pages (Steam store, Xbox store, etc.) as support_url unless the post explicitly says "please wishlist/support here: [link]".
- Examples of VALID support_url: "https://steamcommunity.com/app/XXXXX/discussions/0/...", "https://www.change.org/..."
- Examples of INVALID support_url: "https://store.steampowered.com/app/XXXXX/", "https://x.com/SomeUser", cta_url value

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
}`;

function parseRelativeDate(relStr?: string): string {
    const now = new Date();
    if (!relStr) {
        return formatDateTr(now);
    }
    const cleanStr = relStr.toLowerCase().trim();
    const target = new Date(now);

    if (cleanStr.includes("dün") || cleanStr.includes("yesterday")) {
        target.setDate(now.getDate() - 1);
    } else if (cleanStr.includes("saat") || cleanStr.includes("hour") || cleanStr.includes("dakika") || cleanStr.includes("minute") || cleanStr.includes("şimdi") || cleanStr.includes("now")) {
        // keep current date
    } else if (cleanStr.includes("gün") || cleanStr.includes("day")) {
        const match = cleanStr.match(/(\d+)/);
        const days = match ? parseInt(match[0]) : 1;
        target.setDate(now.getDate() - days);
    } else if (cleanStr.includes("hafta") || cleanStr.includes("week")) {
        const match = cleanStr.match(/(\d+)/);
        const weeks = match ? parseInt(match[0]) : 1;
        target.setDate(now.getDate() - weeks * 7);
    } else if (cleanStr.includes("ay") || cleanStr.includes("month")) {
        const match = cleanStr.match(/(\d+)/);
        const months = match ? parseInt(match[0]) : 1;
        target.setMonth(now.getMonth() - months);
    } else if (cleanStr.includes("yıl") || cleanStr.includes("year")) {
        const match = cleanStr.match(/(\d+)/);
        const years = match ? parseInt(match[0]) : 1;
        target.setFullYear(now.getFullYear() - years);
    }

    return formatDateTr(target);
}

function parseXDate(createdAtStr?: string): string {
    if (!createdAtStr) return formatDateTr(new Date());
    try {
        const date = new Date(createdAtStr);
        if (isNaN(date.getTime())) {
            return formatDateTr(new Date());
        }
        return formatDateTr(date);
    } catch {
        return formatDateTr(new Date());
    }
}

function formatDateTr(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' };
    return new Intl.DateTimeFormat('tr-TR', options).format(date);
}

async function fetchYoutubeCommunity(cookie?: string, limit = 5): Promise<Array<{ text: string; url: string; date: string }>> {
    try {
        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        };
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const response = await fetch("https://www.youtube.com/@MstafaKadir/posts", { headers });
        const html = await response.text();
        
        if (html.includes("consent.youtube.com")) {
            console.error("YouTube redirected to consent page. Cookie is missing or expired.");
            return [];
        }

        const jsonMatch = html.match(/var ytInitialData\s*=\s*(\{.*?\});/);
        if (jsonMatch) {
            const ytData = JSON.parse(jsonMatch[1]);
            const posts: Array<{ text: string; url: string; date: string }> = [];

            const findPosts = (obj: any) => {
                if (obj && typeof obj === 'object') {
                    if ('backstagePostRenderer' in obj) {
                        const post = obj.backstagePostRenderer;
                        const postId = post.postId || '';
                        const postUrl = postId ? `https://www.youtube.com/post/${postId}` : 'https://www.youtube.com/@MstafaKadir/posts';
                        
                        let relTime = "";
                        if (post.publishedTimeText && Array.isArray(post.publishedTimeText.runs) && post.publishedTimeText.runs.length > 0) {
                            relTime = post.publishedTimeText.runs[0].text || '';
                        }
                        
                        if (post.contentText && Array.isArray(post.contentText.runs)) {
                            const text = post.contentText.runs.map((r: any) => r.text || '').join('');
                            const absoluteDate = parseRelativeDate(relTime);
                            posts.push({ text, url: postUrl, date: absoluteDate });
                        }
                    }
                    for (const k in obj) {
                        findPosts(obj[k]);
                    }
                }
            };

            findPosts(ytData);
            return posts.slice(0, limit);
        }
    } catch (e) {
        console.error("YouTube Community fetch error:", e);
    }
    return [];
}

async function fetchXCommunity(cookie?: string, limit = 5): Promise<Array<{ text: string; url: string; date: string }>> {
    if (!cookie) return [];
    try {
        let cleanCookie = cookie;
        if (cleanCookie.startsWith('"') && cleanCookie.endsWith('"')) {
            cleanCookie = cleanCookie.slice(1, -1);
        }

        const auth = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejfCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
        let csrf = "";
        const csrfMatch = cleanCookie.match(/ct0=([^;]+)/);
        if (csrfMatch) {
            csrf = csrfMatch[1];
        }

        const variables = {
            "communityId": "1888733402792128619",
            "count": 20,
            "withTweetQuoteCount": true,
            "includePromotedContent": false,
            "withQuickPromoteEligibilitySheets": true,
            "withVoice": true,
            "withVibe": true
        };
        const features = {
            "rweb_tipjar_consumption_enabled": true,
            "responsive_web_graphql_exclude_directive_enabled": true,
            "verified_phone_label_enabled": false,
            "creator_subscriptions_tweet_preview_api_enabled": true,
            "responsive_web_graphql_timeline_navigation_enabled": true,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
            "communities_web_enable_tweet_association": true,
            "tweetypie_unmention_optimization_enabled": true,
            "responsive_web_edit_tweet_api_enabled": true,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
            "view_counts_everywhere_api_enabled": true,
            "longform_notetweets_consumption_enabled": true,
            "responsive_web_twitter_article_tweet_consumption_enabled": true,
            "tweet_awards_web_tipping_enabled": false,
            "creator_subscriptions_quote_tweet_preview_enabled": false,
            "freedom_of_speech_not_reach_fetch_enabled": true,
            "standardized_nudges_misinfo": true,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
            "rweb_video_timestamps_enabled": true,
            "longform_notetweets_rich_text_read_enabled": true,
            "longform_notetweets_inline_expand_super_tweet_enabled": true,
            "responsive_web_enhance_cards_enabled": false
        };

        const queryUrl = `https://x.com/i/api/graphql/mO0T1BvIee2Q5Hk7547_rQ/CommunityTweetsTimeline?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;

        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Authorization': auth,
            'Cookie': cleanCookie,
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': 'tr'
        };
        if (csrf) {
            headers['x-csrf-token'] = csrf;
        }

        const response = await fetch(queryUrl, { headers });
        if (!response.ok) return [];

        const resData = await response.json();
        const tweets: Array<{ text: string; url: string; date: string }> = [];

        const findTweets = (obj: any) => {
            if (obj && typeof obj === 'object') {
                if ('tweet_results' in obj && obj.tweet_results && obj.tweet_results.result) {
                    const tweetRes = obj.tweet_results.result;
                    const legacy = tweetRes.legacy || {};
                    const text = legacy.full_text || '';
                    const tweetId = legacy.id_str || '';
                    const createdAt = legacy.created_at || '';
                    const screenName = tweetRes.core?.user_results?.result?.legacy?.screen_name || '';
                    const tweetUrl = (screenName && tweetId) ? `https://x.com/${screenName}/status/${tweetId}` : 'https://x.com/i/communities/1888733402792128619';
                    
                    if (text && !tweets.some(t => t.text === text)) {
                        const absoluteDate = parseXDate(createdAt);
                        tweets.push({ text, url: tweetUrl, date: absoluteDate });
                    }
                }
                for (const k in obj) {
                    findTweets(obj[k]);
                }
            }
        };

        findTweets(resData);
        return tweets.slice(0, limit);
    } catch (e) {
        console.error("X Community fetch error:", e);
    }
    return [];
}

export const GET: RequestHandler = async ({ request, url }) => {
    // Auth Check — accepts NEWS_API_TOKEN (Python agent) or CRON_SECRET (Vercel cron)
    const apiToken = env.NEWS_API_TOKEN || process.env.NEWS_API_TOKEN;
    const cronSecret = env.CRON_SECRET || process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization');

    const isValidApiToken = apiToken && authHeader === `Bearer ${apiToken}`;
    const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isValidApiToken && !isValidCron) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if agent is enabled (allow bypass for manual triggers)
    const isManual = url.searchParams.get('manual') === 'true';
    if (!isManual) {
        try {
            const agentEnabledRes = await db.execute("SELECT value FROM settings WHERE key = 'agent_enabled'");
            const isAgentEnabled = agentEnabledRes.rows[0]?.value !== '0';
            if (!isAgentEnabled) {
                return json({ success: true, message: 'Autonomous agent is disabled in settings.' });
            }
        } catch (e) {
            console.error('Failed to check agent_enabled setting:', e);
        }
    }

    const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqKey) {
        return json({ error: 'Groq API Key is not configured on server' }, { status: 500 });
    }

    const ytCookie = env.YOUTUBE_COOKIE || process.env.YOUTUBE_COOKIE;
    const xCookie = env.X_COOKIE || process.env.X_COOKIE;

    try {
        // 1. Fetch existing news from DB
        const dbResult = await db.execute("SELECT * FROM news");
        const existingNews = dbResult.rows.map((row: any) => {
            const titleObj = JSON.parse(row.title);
            const contentObj = JSON.parse(row.content);
            return {
                id: row.id,
                title_tr: titleObj.tr || '',
                content_summary_tr: (contentObj.tr || '').substring(0, 120)
            };
        });

        // 2. Scrape candidates
        const ytPosts = await fetchYoutubeCommunity(ytCookie, 5);
        const xTweets = await fetchXCommunity(xCookie, 5);

        if (ytPosts.length === 0 && xTweets.length === 0) {
            return json({ success: true, message: 'No candidate posts scraped.' });
        }

        const payload = {
            existing_news: existingNews,
            youtube_candidates: ytPosts,
            x_candidates: xTweets
        };

        // 3. Call Groq
        const modelName = env.GROQ_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        const groqResponse = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Mevcut haberleri ve yeni sosyal medya gönderilerini inceleyerek mükerrer olmayan yeni haberleri üret:\n\n${JSON.stringify(payload, null, 2)}` }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        const resData = await groqResponse.json();
        if (!resData.choices || resData.choices.length === 0) {
            return json({ error: 'Groq API returned empty choices' }, { status: 500 });
        }

        const content = JSON.parse(resData.choices[0].message.content);
        const newItems = content.news_items || [];

        if (newItems.length === 0) {
            return json({ success: true, message: 'No new unique news items detected by LLM.' });
        }

        const defaultCta = {
            tr: 'Detaylar', en: 'Details', de: 'Details', zh: '详情',
            fr: 'Détails', uk: 'Деталі', es: 'Detalles', ja: '詳細',
            ko: '상세 bilgi', it: 'Dettagli', ru: 'Подробности', pt: 'Detalhes'
        };

        let insertedCount = 0;
        for (const item of newItems) {
            const { id, title, content: newsContent, category, cta, cta_url, date, support_url, support_btn } = item;
            if (!id || !title || !newsContent || !category) continue;

            // Final safety duplicate check
            const dupCheck = await db.execute({
                sql: "SELECT id FROM news WHERE id = ?",
                args: [id]
            });
            if (dupCheck.rows.length > 0) continue;

            await db.execute({
                sql: "INSERT INTO news (id, date, cta_url, support_url, support_btn, category, title, content, cta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [
                    id,
                    date || formatDateTr(new Date()),
                    cta_url || 'https://youtube.com/@MstafaKadir',
                    support_url || null,
                    support_btn ? JSON.stringify(support_btn) : null,
                    JSON.stringify(category),
                    JSON.stringify(title),
                    JSON.stringify(newsContent),
                    JSON.stringify(cta || defaultCta)
                ]
            });
            insertedCount++;
        }

        if (insertedCount > 0) {
            // Keep only top 8 latest news items
            await db.execute(`
                DELETE FROM news 
                WHERE rowid NOT IN (
                    SELECT rowid FROM news 
                    ORDER BY rowid DESC LIMIT 8
                )
            `);
        }

        return json({ success: true, inserted: insertedCount, message: `Successfully inserted ${insertedCount} new news items.` });
    } catch (e: any) {
        console.error("Cron agent execution error:", e);
        return json({ error: e.message || 'Cron execution failed' }, { status: 500 });
    }
};
