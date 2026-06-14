<script lang="ts">
    import { t } from '$lib/i18n.svelte';
</script>

<section id="about" class="container" style="padding-top: 120px; padding-bottom: 80px;">
    <span class="badge">{t.about.badge}</span>
    <h1 class="resp-title" style="margin-bottom: 24px;">
        {t.about.title_start}<span class="gradient-text">{t.about.title_gradient}</span>
    </h1>
    <p class="resp-subtitle" style="margin-bottom: 48px; max-width: 800px;">
        {t.about.subtitle}
    </p>

    <!-- Bio & History Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; margin-bottom: 60px;">
        <div class="visual-card" style="width: 100%;">
            <div class="card-content">
                <h3 style="margin-bottom: 16px; color: var(--accent-color); font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                    {t.about.leader_title}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">
                    {t.about.bio_text}
                </p>
            </div>
        </div>

        <div class="visual-card" style="width: 100%;">
            <div class="card-content">
                <h3 style="margin-bottom: 16px; color: var(--accent-color); font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                    {t.about.youtube_title}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">
                    {t.about.youtube_desc}
                </p>
            </div>
        </div>
    </div>

    <!-- B2B Section -->
    <div class="visual-card b2b-card" style="width: 100%;">
        <div class="card-content">
            <h2 class="resp-section-title" style="margin-bottom: 16px; color: var(--text-primary);">
                {t.about.b2b_title}
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; max-width: 900px;">
                {t.about.b2b_desc}
            </p>
        </div>
    </div>
</section>

<style>
    .b2b-card {
        padding: 32px;
    }
    @media (max-width: 768px) {
        .b2b-card {
            padding: 20px !important;
        }
    }
</style>
