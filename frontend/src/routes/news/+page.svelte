<script lang="ts">
    import { t, currentLanguage } from '$lib/i18n.svelte';
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';

    let { data } = $props();
    let newsItems = $state<any[]>([]);

    async function loadNews() {
        try {
            const res = await fetch('/api/news');
            if (res.ok) {
                newsItems = await res.json();
            }
        } catch (e) {
            console.error('Failed to load news:', e);
        }
    }

    onMount(() => {
        newsItems = data.initialNews || [];
        loadNews();
    });

    function getTranslation(field: any, lang: string) {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field['tr'] || field['en'] || '';
    }
</script>

<style>
    .news-page-wrapper {
        padding-top: 110px;
        padding-bottom: 100px;
    }

    .news-header {
        max-width: 760px;
        margin-bottom: 48px;
    }

    /* ── 4-column compact responsive grid ── */
    .news-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        align-items: stretch;
    }

    @media (max-width: 1200px) {
        .news-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 900px) {
        .news-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 600px) {
        .news-grid {
            grid-template-columns: 1fr;
        }
    }

    /* ── Card ── */
    .news-card {
        background: rgba(18, 18, 18, 0.65);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 20px 20px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }

    .news-card::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 14px;
        background: radial-gradient(ellipse at top left, rgba(223,177,91,0.03) 0%, transparent 70%);
        pointer-events: none;
    }

    /* golden left accent */
    .news-card::before {
        content: '';
        position: absolute;
        top: 14px;
        left: 0;
        width: 3px;
        height: calc(100% - 28px);
        background: linear-gradient(180deg, var(--accent-color) 0%, rgba(223,177,91,0.15) 100%);
        border-radius: 0 3px 3px 0;
        opacity: 0.5;
        transition: opacity 0.3s ease, height 0.3s ease, top 0.3s ease;
    }

    .news-card:hover {
        border-color: rgba(223,177,91,0.25);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(223,177,91,0.05);
        transform: translateY(-3px);
    }

    .news-card:hover::before {
        opacity: 1;
        top: 0;
        height: 100%;
    }

    /* ── Meta row ── */
    .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .news-date {
        font-size: 0.72rem;
        color: var(--text-secondary);
        font-weight: 500;
        opacity: 0.75;
    }

    .news-category {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: var(--accent-color);
        background: rgba(223,177,91,0.08);
        border: 1px solid rgba(223,177,91,0.15);
        padding: 3px 8px;
        border-radius: 4px;
        white-space: nowrap;
    }

    /* ── Title ── */
    .news-title {
        font-size: 1.02rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.35;
        margin: 0;
        letter-spacing: -0.1px;
        transition: color 0.25s ease;
    }

    .news-card:hover .news-title {
        color: var(--accent-color);
    }

    /* ── Divider ── */
    .card-divider {
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, rgba(223,177,91,0.12) 0%, transparent 100%);
        border: none;
        margin: 0;
    }

    /* ── Content ── */
    .news-content {
        font-size: 0.82rem;
        color: rgba(220,220,220,0.75);
        line-height: 1.6;
        margin: 0;
        white-space: pre-line;
        word-break: break-word;
        flex-grow: 1;
    }

    /* ── CTA button ── */
    .card-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: auto;
        flex-wrap: wrap;
    }

    .news-cta {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--accent-color);
        font-weight: 700;
        font-size: 0.78rem;
        text-decoration: none;
        transition: all 0.22s ease;
        padding: 4px 0;
        width: fit-content;
    }

    .news-cta:hover {
        gap: 8px;
        color: #fff;
    }

    .support-btn {
        color: var(--accent-color);
        background: rgba(223, 177, 91, 0.08);
        border: 1px solid rgba(223, 177, 91, 0.25);
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 0.75rem;
    }

    .support-btn:hover {
        background: var(--accent-color);
        color: #121212 !important;
        border-color: var(--accent-color);
    }

    .cta-arrow {
        flex-shrink: 0;
        transition: transform 0.22s ease;
    }

    .news-cta:hover .cta-arrow {
        transform: translateX(2px);
    }

    /* ── Empty state ── */
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 24px;
        color: var(--text-secondary);
        opacity: 0.5;
    }

    .empty-state svg {
        margin-bottom: 16px;
        opacity: 0.4;
    }

    .empty-state p {
        font-size: 1rem;
    }
</style>

<section id="news" class="container news-page-wrapper">
    <div class="news-header">
        <span class="badge" in:fade={{ duration: 300 }}>{t.news.badge}</span>
        <h1 class="resp-title" style="margin-bottom: 16px;" in:fade={{ duration: 400 }}>
            {t.news.title_start}<span class="gradient-text">{t.news.title_gradient}</span>
        </h1>
        <p class="resp-subtitle" in:fade={{ duration: 500 }}>
            {t.news.subtitle}
        </p>
    </div>

    <div class="news-grid">
        {#if newsItems.length === 0}
            <div class="empty-state" in:fade={{ duration: 400 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 4h16v16H4z" rx="2"/>
                    <path d="M8 8h8M8 12h5"/>
                </svg>
                <p>{currentLanguage.value === 'tr' ? 'Henüz haber bulunmuyor.' : 'No news yet.'}</p>
            </div>
        {:else}
            {#each newsItems as item, index (item.id)}
                <article
                    class="news-card"
                    in:fly={{ y: 20, duration: 500, delay: index * 50 }}
                >
                    <div class="card-meta">
                        <span class="news-date">{item.date}</span>
                        <span class="news-category">{getTranslation(item.category, currentLanguage.value)}</span>
                    </div>

                    <h2 class="news-title">
                        {getTranslation(item.title, currentLanguage.value)}
                    </h2>

                    <hr class="card-divider" />

                    <p class="news-content">
                        {getTranslation(item.content, currentLanguage.value)}
                    </p>

                    <div class="card-actions">
                        <a
                            href={item.cta_url || 'https://youtube.com/@MstafaKadir'}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="news-cta"
                        >
                            {getTranslation(item.cta, currentLanguage.value)}
                            <svg class="cta-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>

                        {#if item.support_url}
                            <a
                                href={item.support_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-cta support-btn"
                            >
                                {getTranslation(item.support_btn, currentLanguage.value) || (currentLanguage.value === 'tr' ? 'Destek Ver' : 'Give Support')}
                            </a>
                        {/if}
                    </div>
                </article>
            {/each}
        {/if}
    </div>
</section>

