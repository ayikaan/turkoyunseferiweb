<script lang="ts">
    import { t } from '$lib/i18n.svelte';
</script>

<!-- Hero Section -->
<section id="hero" class="container" style="min-height: 50vh; padding-top: 120px; padding-bottom: 40px;">
    <div class="hero-content">
        <span class="badge">{t.home.badge}</span>
        <h1 class="resp-title" style="margin-bottom: 20px;">
            {t.home.title_start}<span class="gradient-text">{t.home.title_gradient}</span>
        </h1>
        <p class="resp-subtitle" style="margin-bottom: 32px; max-width: 750px;">
            {t.home.subtitle}
        </p>
        <div class="hero-actions">
            <a href="/games" class="btn-primary" style="text-decoration: none; display: inline-block;">{t.home.cta_explore}</a>
            <a href="/about" class="btn-secondary" style="text-decoration: none; display: inline-block;">{t.home.cta_learn}</a>
        </div>
    </div>
</section>

<!-- Stats Section -->
<section class="container" style="padding: 60px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); margin-bottom: 80px;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 30px; text-align: center;">
        <div>
            <div class="resp-stats-num" style="color: var(--accent-color); margin-bottom: 8px;">{t.home.stats.stat1_value}</div>
            <div style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{t.home.stats.stat1_label}</div>
        </div>
        <div>
            <div class="resp-stats-num" style="color: var(--text-primary); margin-bottom: 8px;">{t.home.stats.stat2_value}</div>
            <div style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{t.home.stats.stat2_label}</div>
        </div>
        <div>
            <div class="resp-stats-num" style="color: var(--accent-color); margin-bottom: 8px;">{t.home.stats.stat3_value}</div>
            <div style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{t.home.stats.stat3_label}</div>
        </div>
    </div>
</section>

<!-- Partners & Consultation Section (Görüştüğümüz & Çalıştığımız Markalar) -->
<section class="container" style="margin-bottom: 80px;">
    <div style="text-align: center; margin-bottom: 48px;">
        <span class="badge">{t.home.badge_partners}</span>
        <h2 class="resp-section-title" style="margin-top: 8px; margin-bottom: 16px; letter-spacing: -0.5px;">
            {t.home.partners_title}
        </h2>
        <p class="resp-subtitle" style="max-width: 700px; margin: 0 auto;">
            {t.home.partners_subtitle}
        </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px;">
        {#each t.home.partners as partner}
            <div class="visual-card" style="width: 100%; padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 120px;">
                <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 6px;">
                    {partner.name}
                </div>
                <div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    {partner.role}
                </div>
            </div>
        {/each}
    </div>
</section>

<!-- How We Work & Pillars Section -->
<section class="container" style="margin-bottom: 80px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 40px;">
        <div style="border-left: 3px solid var(--accent-color); padding-left: 24px; max-width: 800px;">
            <span class="badge" style="margin-bottom: 10px;">{t.home.badge_methodology}</span>
            <h2 class="resp-section-title" style="margin-bottom: 16px; letter-spacing: -0.5px;">
                {t.home.methodology_title}
            </h2>
            <p class="resp-subtitle">
                {t.home.methodology_desc}
            </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 20px;">
            {#each t.home.pillars as pillar}
                <div class="visual-card" style="width: 100%;">
                    <div class="card-content">
                        <h3 style="margin-bottom: 10px; color: var(--text-primary); font-size: 0.9rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                            {pillar.title}
                        </h3>
                        <p style="color: var(--text-secondary); font-size: 0.82rem; line-height: 1.5;">
                            {pillar.desc}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- Macroeconomic and Cultural Impact Section (New Content Block) -->
<section class="container" style="margin-bottom: 80px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
        <div class="visual-card visual-card-large" style="width: 100%;">
            <div class="card-content">
                <span class="badge" style="margin-bottom: 10px;">{t.home.badge_impact}</span>
                <h2 class="resp-section-title" style="margin-bottom: 16px; color: var(--text-primary);">
                    {t.home.impact_title}
                </h2>
                <p class="resp-subtitle" style="max-width: 950px;">
                    {t.home.impact_desc}
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Asia Publisher Focus Section -->
<section class="container" style="margin-bottom: 80px;">
    <div class="visual-card visual-card-large" style="width: 100%;">
        <div class="card-content">
            <span class="badge" style="margin-bottom: 10px;">{t.home.badge_asia}</span>
            <h2 class="resp-section-title" style="margin-bottom: 16px; color: var(--text-primary);">
                {t.home.asia_title}
            </h2>
            <p class="resp-subtitle" style="max-width: 900px;">
                {t.home.asia_desc}
            </p>
        </div>
    </div>
</section>

<!-- Case Studies Section -->
<section class="container" style="padding-bottom: 40px;">
    <h2 class="resp-section-title" style="margin-bottom: 32px; letter-spacing: -0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        {t.home.cases_title}
    </h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px;">
        {#each t.home.cases as caseStudy}
            <div class="visual-card" style="width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="card-content">
                    <h3 style="margin-bottom: 12px; color: var(--accent-color); font-size: 0.95rem; line-height: 1.4; border-bottom: none; padding-bottom: 0;">
                        {caseStudy.title}
                    </h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6;">
                        {caseStudy.desc}
                    </p>
                </div>
            </div>
        {/each}
    </div>
</section>

<style>
    .visual-card-large {
        padding: 40px;
    }
    @media (max-width: 768px) {
        .visual-card-large {
            padding: 24px !important;
        }
    }
</style>
