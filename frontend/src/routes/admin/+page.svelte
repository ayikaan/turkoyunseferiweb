<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    let { data, form } = $props();

    // Active tab
    let activeTab = $state('news'); // 'news', 'settings', 'trigger'

    // Form inputs for news item
    let editId = $state<string | null>(null);
    let newsTitle = $state('');
    let newsContent = $state('');
    let newsCategory = $state('');
    let newsCtaUrl = $state('');
    let newsSupportUrl = $state('');
    let newsSupportBtnText = $state('');

    // Loading states
    let isTranslating = $state(false);
    let isSavingSettings = $state(false);
    let isTriggeringAgent = $state(false);

    // Agent execution log/result
    let agentResult = $state<any>(null);

    // Notifications
    let notification = $state<{ type: 'success' | 'error'; message: string } | null>(null);

    function showNotification(type: 'success' | 'error', message: string) {
        notification = { type, message };
        setTimeout(() => {
            notification = null;
        }, 5000);
    }

    // Handle form actions responses manually or via enhance
    function handleNewsSubmit() {
        isTranslating = true;
        return async ({ result }: any) => {
            isTranslating = false;
            if (result.type === 'success') {
                showNotification('success', editId ? 'Haber başarıyla güncellendi!' : 'Haber başarıyla eklendi ve tüm dillere çevrildi!');
                resetNewsForm();
                // Reload page data
                location.reload();
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Haber kaydedilirken bir hata oluştu.');
            }
        };
    }

    function handleSettingsSubmit() {
        isSavingSettings = true;
        return async ({ result }: any) => {
            isSavingSettings = false;
            if (result.type === 'success') {
                showNotification('success', 'Ayarlar başarıyla kaydedildi!');
                location.reload();
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Ayarlar kaydedilirken bir hata oluştu.');
            }
        };
    }

    function handleTriggerSubmit() {
        isTriggeringAgent = true;
        agentResult = null;
        return async ({ result }: any) => {
            isTriggeringAgent = false;
            if (result.type === 'success') {
                agentResult = result.data?.agentResult;
                showNotification('success', 'Otonom ajan çalıştırıldı!');
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Ajan çalıştırılırken bir hata oluştu.');
            }
        };
    }

    function startEdit(item: any) {
        editId = item.id;
        newsTitle = item.title.tr || '';
        newsContent = item.content.tr || '';
        newsCategory = item.category.tr || '';
        newsCtaUrl = item.cta_url || '';
        newsSupportUrl = item.support_url || '';
        newsSupportBtnText = item.support_btn?.tr || '';
        // Scroll to form
        const formEl = document.getElementById('news-form-container');
        if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function resetNewsForm() {
        editId = null;
        newsTitle = '';
        newsContent = '';
        newsCategory = '';
        newsCtaUrl = '';
        newsSupportUrl = '';
        newsSupportBtnText = '';
    }

    // Default settings fallback
    const settings = $derived(data?.settings || {});
</script>

<svelte:head>
    <title>Yönetim Paneli - Türkçe Oyun Seferi</title>
</svelte:head>

<section class="container admin-section" style="padding-top: 130px; padding-bottom: 80px;">
    
    <!-- Notification Toast -->
    {#if notification}
        <div class="notification-toast {notification.type}" transition:fade>
            <span class="icon">{notification.type === 'success' ? '⚡' : '⚠️'}</span>
            <span class="message">{notification.message}</span>
        </div>
    {/if}

    <!-- 1. Password Setup (Register) Screen -->
    {#if !data.hasPassword}
        <div class="auth-wrapper" transition:fade>
            <div class="visual-card auth-card">
                <div class="card-content">
                    <span class="badge">İlk Kurulum</span>
                    <h2 style="margin-bottom: 12px; color: var(--text-primary);">Yönetici Şifresi Belirleyin</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">
                        Kontrol paneline erişmek için yeni bir şifre tanımlayın. Bu şifre sistem tablosunda güvenli şekilde saklanacaktır.
                    </p>

                    <form method="POST" action="?/setPassword" use:enhance>
                        <div class="input-group">
                            <label for="reg-password">Şifre (En az 6 karakter)</label>
                            <input type="password" id="reg-password" name="password" required minlength="6" placeholder="••••••••" />
                        </div>
                        
                        {#if form?.error}
                            <p class="form-error-msg">{form.error}</p>
                        {/if}

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 16px;">Şifreyi Kaydet ve Giriş Yap</button>
                    </form>
                </div>
            </div>
        </div>

    <!-- 2. Login Screen -->
    {:else if !data.authenticated}
        <div class="auth-wrapper" transition:fade>
            <div class="visual-card auth-card">
                <div class="card-content">
                    <span class="badge">Giriş Gerekli</span>
                    <h2 style="margin-bottom: 12px; color: var(--text-primary);">Yönetici Girişi</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">
                        Kontrol paneline devam etmek için şifrenizi girin.
                    </p>

                    <form method="POST" action="?/login" use:enhance>
                        <div class="input-group">
                            <label for="login-password">Yönetici Şifresi</label>
                            <input type="password" id="login-password" name="password" required placeholder="••••••••" />
                        </div>
                        
                        {#if form?.error}
                            <p class="form-error-msg">{form.error}</p>
                        {/if}

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 16px;">Giriş Yap</button>
                    </form>
                </div>
            </div>
        </div>

    <!-- 3. Authenticated Dashboard Screen -->
    {:else}
        <div class="dashboard-header">
            <div>
                <span class="badge">Yönetim Paneli</span>
                <h1 class="resp-title" style="margin-bottom: 12px;">Site <span class="gradient-text">Kontrol Paneli</span></h1>
            </div>
            <form method="POST" action="?/logout" use:enhance>
                <button type="submit" class="btn-secondary logout-btn">Oturumu Kapat</button>
            </form>
        </div>

        <!-- Dashboard Navigation Tabs -->
        <div class="admin-tabs">
            <button class="tab-btn" class:active={activeTab === 'news'} onclick={() => activeTab = 'news'}>
                📰 Haberleri Yönet
            </button>
            <button class="tab-btn" class:active={activeTab === 'settings'} onclick={() => activeTab = 'settings'}>
                ⚙️ Sistem Ayarları
            </button>
            <button class="tab-btn" class:active={activeTab === 'trigger'} onclick={() => activeTab = 'trigger'}>
                🤖 Otonom Ajan
            </button>
        </div>

        <!-- Tab 1: News Management -->
        {#if activeTab === 'news'}
            <div class="tab-content" transition:fade>
                
                <!-- Add/Edit News Form Container -->
                <div class="visual-card" id="news-form-container" style="margin-bottom: 40px;">
                    <div class="card-content">
                        <h3>{editId ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Haberi Türkçe olarak girin. Yayınla tuşuna bastığınızda, <strong>Groq LLM</strong> haberi otomatik olarak sitenin desteklediği tüm 12 dile doğal biçimde çevirecek ve yayınlayacaktır.
                        </p>

                        <form method="POST" action="?/saveNews" use:enhance={handleNewsSubmit} class="news-form">
                            {#if editId}
                                <input type="hidden" name="edit_id" value={editId} />
                            {/if}

                            <div class="form-grid">
                                <div class="input-group">
                                    <label for="news-title">Başlık (TR)</label>
                                    <input type="text" id="news-title" name="title" bind:value={newsTitle} required placeholder="Haber başlığı girin..." disabled={isTranslating} />
                                </div>

                                <div class="input-group">
                                    <label for="news-category">Kategori / Etiket (TR)</label>
                                    <input type="text" id="news-category" name="category" bind:value={newsCategory} required placeholder="Örn: Türkçe Yama, Duyuru, Güncelleme" disabled={isTranslating} />
                                </div>

                                <div class="input-group full-width">
                                    <label for="news-content">İçerik Açıklaması (TR)</label>
                                    <textarea id="news-content" name="content" rows="4" bind:value={newsContent} required placeholder="Haber metnini yazın (3-4 cümle olmalıdır)..." disabled={isTranslating}></textarea>
                                </div>

                                <div class="input-group">
                                    <label for="news-cta">Post Detay Linki (cta_url)</label>
                                    <input type="url" id="news-cta" name="cta_url" bind:value={newsCtaUrl} required placeholder="https://youtube.com/... veya https://x.com/..." disabled={isTranslating} />
                                </div>

                                <div class="input-group">
                                    <label for="news-support-url">Destek/Kampanya Linki (support_url - İsteğe bağlı)</label>
                                    <input type="url" id="news-support-url" name="support_url" bind:value={newsSupportUrl} placeholder="https://steamcommunity.com/... veya https://change.org/..." disabled={isTranslating} />
                                </div>

                                <div class="input-group">
                                    <label for="news-support-btn">Destek Buton Metni (İsteğe bağlı)</label>
                                    <input type="text" id="news-support-btn" name="support_btn_text" bind:value={newsSupportBtnText} placeholder="Örn: Destek Ver, İmza At" disabled={isTranslating} />
                                </div>
                            </div>

                            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px;">
                                <button type="submit" class="btn-primary" disabled={isTranslating}>
                                    {#if isTranslating}
                                        🌀 Çevriliyor ve Yayınlanıyor...
                                    {:else}
                                        {editId ? 'Değişiklikleri Kaydet' : 'Haberi Çevir ve Yayınla'}
                                    {/if}
                                </button>
                                {#if editId}
                                    <button type="button" class="btn-secondary" onclick={resetNewsForm} disabled={isTranslating}>Vazgeç</button>
                                {/if}
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Existing News List -->
                <div class="table-container">
                    <h3 style="padding: 20px 24px 8px 24px; color: var(--accent-color); font-size: 1.1rem; border-bottom: 1px solid var(--border-color);">
                        Sitedeki Mevcut 8 Haber
                    </h3>
                    <div style="overflow-x: auto;">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Başlık (TR)</th>
                                    <th>Kategori</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if data.news && data.news.length > 0}
                                    {#each data.news as item}
                                        <tr>
                                            <td>{item.date}</td>
                                            <td class="highlight">{item.title.tr || 'Başlıksız'}</td>
                                            <td><span class="badge-scale">{item.category.tr || 'Genel'}</span></td>
                                            <td>
                                                <div style="display: flex; gap: 8px;">
                                                    <button class="action-btn edit" onclick={() => startEdit(item)}>Düzenle</button>
                                                    <form method="POST" action="?/deleteNews" use:enhance={() => {
                                                        return async ({ result }) => {
                                                            if (result.type === 'success') {
                                                                showNotification('success', 'Haber silindi.');
                                                                location.reload();
                                                            } else {
                                                                showNotification('error', 'Haber silinemedi.');
                                                            }
                                                        };
                                                    }}>
                                                        <input type="hidden" name="id" value={item.id} />
                                                        <button type="submit" class="action-btn delete" onclick={(e) => { if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) e.preventDefault(); }}>Sil</button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                {:else}
                                    <tr>
                                        <td colspan="4" style="text-align: center; padding: 40px;">Kayıtlı haber bulunamadı.</td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        {/if}

        <!-- Tab 2: System Settings -->
        {#if activeTab === 'settings'}
            <div class="tab-content" transition:fade>
                <div class="visual-card">
                    <div class="card-content">
                        <h3>Sistem Bağlantı & İstatistik Ayarları</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Sitedeki sosyal medya linklerini ve istatistik panosundaki rakamları buradan güncelleyebilirsiniz. İstatistik alanlarını boş bırakırsanız sistem arka planda otomatik taramaya devam eder; veri girerseniz girdiğiniz değerler sabit olarak gösterilir.
                        </p>

                        <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="settings-form">
                            <!-- Autonomous Agent Toggle -->
                            <div class="toggle-group" style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="flex: 1;">
                                    <h4 style="color: var(--text-primary); margin-bottom: 4px;">Otonom Ajan Modu</h4>
                                    <p style="color: var(--text-secondary); font-size: 0.82rem;">Ajanı kapatırsanız arka planda yeni YouTube/X gönderilerinden otomatik haber oluşturulmaz.</p>
                                </div>
                                <select name="agent_enabled" class="admin-select" value={settings.agent_enabled || '1'}>
                                    <option value="1">Aktif (Otomatik Tara & Yayınla)</option>
                                    <option value="0">Pasif (Yalnızca Manuel Yönetim)</option>
                                </select>
                            </div>

                            <div class="settings-grid">
                                <!-- Social Media Links -->
                                <div class="settings-col">
                                    <h4 class="col-title">Sosyal Medya Linkleri</h4>
                                    
                                    <div class="input-group">
                                        <label for="s-youtube">YouTube Kanalı</label>
                                        <input type="url" id="s-youtube" name="social_youtube" value={settings.social_youtube || ''} />
                                    </div>
                                    <div class="input-group">
                                        <label for="s-youtube-join">YouTube Katıl</label>
                                        <input type="url" id="s-youtube-join" name="social_youtube_join" value={settings.social_youtube_join || ''} />
                                    </div>
                                    <div class="input-group">
                                        <label for="s-instagram">Instagram</label>
                                        <input type="url" id="s-instagram" name="social_instagram" value={settings.social_instagram || ''} />
                                    </div>
                                    <div class="input-group">
                                        <label for="s-discord">Discord Sunucusu</label>
                                        <input type="url" id="s-discord" name="social_discord" value={settings.social_discord || ''} />
                                    </div>
                                    <div class="input-group">
                                        <label for="s-discord-play">Discord Play Çeviri</label>
                                        <input type="url" id="s-discord-play" name="social_discord_play" value={settings.social_discord_play || ''} />
                                    </div>
                                    <div class="input-group">
                                        <label for="s-steam">Steam Grubu</label>
                                        <input type="url" id="s-steam" name="social_steam" value={settings.social_steam || ''} />
                                    </div>
                                </div>

                                <!-- Statistics Overrides -->
                                <div class="settings-col">
                                    <h4 class="col-title">İstatistik Manuel Ayarları (Opsiyonel)</h4>
                                    
                                    <div class="input-group">
                                        <label for="stat-yt-subs">YouTube Abone Sayısı (Örn: 57,4 B)</label>
                                        <input type="text" id="stat-yt-subs" name="stat_youtube_subscribers" value={settings.stat_youtube_subscribers || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-yt-vids">YouTube Video Sayısı (Örn: 776)</label>
                                        <input type="text" id="stat-yt-vids" name="stat_youtube_videos" value={settings.stat_youtube_videos || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-steam-mem">Steam Grup Üye Sayısı (Örn: 1.101)</label>
                                        <input type="text" id="stat-steam-mem" name="stat_steam_members" value={settings.stat_steam_members || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-steam-online">Steam Çevrimiçi Üye (Örn: 380)</label>
                                        <input type="text" id="stat-steam-online" name="stat_steam_online" value={settings.stat_steam_online || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-steam-lvl">Mustafa Kadir Steam Seviyesi (Örn: 45)</label>
                                        <input type="text" id="stat-steam-lvl" name="stat_steam_level" value={settings.stat_steam_level || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-steam-fr">Mustafa Kadir Arkadaş Sayısı (Örn: 294)</label>
                                        <input type="text" id="stat-steam-fr" name="stat_steam_friends" value={settings.stat_steam_friends || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                    <div class="input-group">
                                        <label for="stat-x-mem">X Topluluk Üye Sayısı (Örn: 4,7 B)</label>
                                        <input type="text" id="stat-x-mem" name="stat_x_members" value={settings.stat_x_members || ''} placeholder="Otomatik taranıyor..." />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="btn-primary" style="margin-top: 32px;" disabled={isSavingSettings}>
                                {isSavingSettings ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Tab 3: Manual Trigger Agent -->
        {#if activeTab === 'trigger'}
            <div class="tab-content" transition:fade>
                <div class="visual-card">
                    <div class="card-content">
                        <h3>Otonom Ajan Manuel Tetikleme</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Otonom AI Haber Ajanını anında çalışmaya zorlayabilirsiniz. Ajan son YouTube gönderilerini ve X topluluk paylaşımlarını çekecek, mükerrer kontrolü yapacak ve yeni bir gelişme bulursa tüm dillere çevirerek en üste ekleyecektir.
                        </p>

                        <form method="POST" action="?/triggerAgent" use:enhance={handleTriggerSubmit}>
                            <button type="submit" class="btn-primary" disabled={isTriggeringAgent}>
                                {isTriggeringAgent ? '🌀 Ajan Çalışıyor, Tarama ve Çeviriler Yapılıyor...' : 'Ajanı Şimdi Çalıştır'}
                            </button>
                        </form>

                        {#if isTriggeringAgent}
                            <div class="agent-loading-panel" transition:slide>
                                <div class="spinner"></div>
                                <p>YouTube ve X taranıyor, LLM içerikleri inceliyor ve yeni haberler yazılıyor...</p>
                            </div>
                        {/if}

                        {#if agentResult}
                            <div class="agent-result-panel" transition:slide>
                                <h4>Ajan Çalışma Sonucu</h4>
                                <div class="log-output">
                                    <p><strong>Durum:</strong> Başarılı</p>
                                    <p><strong>Eklenen Yeni Haber Sayısı:</strong> {agentResult.inserted || 0}</p>
                                    <p><strong>Mesaj:</strong> {agentResult.message || ''}</p>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</section>

<style>
    .admin-section {
        min-height: 80vh;
    }

    .auth-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px 0;
    }

    .auth-card {
        max-width: 450px;
        width: 100%;
        border-color: rgba(223, 177, 91, 0.25);
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
        flex-wrap: wrap;
        gap: 20px;
    }

    .logout-btn {
        padding: 10px 20px !important;
        font-size: 0.88rem !important;
    }

    .admin-tabs {
        display: flex;
        gap: 12px;
        margin-bottom: 32px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 12px;
        overflow-x: auto;
        white-space: nowrap;
    }

    .tab-btn {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.3s ease;
    }

    .tab-btn:hover {
        color: var(--text-primary);
        background-color: rgba(255, 255, 255, 0.02);
    }

    .tab-btn.active {
        color: var(--accent-color);
        border-color: rgba(223, 177, 91, 0.2);
        background-color: rgba(223, 177, 91, 0.04);
    }

    /* Form Styles */
    .news-form, .settings-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
    }

    .full-width {
        grid-column: span 2;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .input-group label {
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .input-group input, .input-group textarea, .admin-select {
        background-color: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 12px 16px;
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 0.95rem;
        transition: all 0.3s ease;
        width: 100%;
    }

    .input-group input:focus, .input-group textarea:focus, .admin-select:focus {
        border-color: var(--accent-color);
        outline: none;
        box-shadow: 0 0 10px rgba(223, 177, 91, 0.1);
    }

    .form-error-msg {
        color: #ff4d4d;
        font-size: 0.85rem;
        margin-top: 8px;
    }

    /* Settings Styles */
    .toggle-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }

    .admin-select {
        width: auto;
        min-width: 250px;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 40px;
    }

    .settings-col {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .col-title {
        color: var(--accent-color);
        font-size: 1.05rem;
        margin-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 8px;
    }

    /* Actions buttons */
    .action-btn {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        background: transparent;
    }

    .action-btn.edit {
        color: var(--accent-color);
        border-color: rgba(223, 177, 91, 0.2);
        background-color: rgba(223, 177, 91, 0.03);
    }

    .action-btn.edit:hover {
        background-color: var(--accent-color);
        color: #000000;
    }

    .action-btn.delete {
        color: #ff4d4d;
        border-color: rgba(255, 77, 77, 0.2);
        background-color: rgba(255, 77, 77, 0.03);
    }

    .action-btn.delete:hover {
        background-color: #ff4d4d;
        color: #ffffff;
    }

    /* Loading and Logs Panels */
    .agent-loading-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-top: 24px;
        padding: 24px;
        background-color: rgba(223, 177, 91, 0.02);
        border: 1px dashed rgba(223, 177, 91, 0.15);
        border-radius: 8px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(223, 177, 91, 0.1);
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s infinite linear;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .agent-result-panel {
        margin-top: 24px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
    }

    .agent-result-panel h4 {
        background-color: rgba(255, 255, 255, 0.02);
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.9rem;
        color: var(--accent-color);
    }

    .log-output {
        padding: 16px;
        background-color: rgba(0, 0, 0, 0.3);
        font-family: monospace;
        font-size: 0.85rem;
        color: #a0c0a0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    /* Notification Toast */
    .notification-toast {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        max-width: 400px;
    }

    .notification-toast.success {
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: #34d399;
    }

    .notification-toast.error {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #f87171;
    }

    @media (max-width: 768px) {
        .form-grid, .settings-grid {
            grid-template-columns: 1fr;
        }
        .full-width {
            grid-column: span 1;
        }
        .toggle-group {
            flex-direction: column;
            align-items: flex-start;
        }
        .admin-select {
            width: 100%;
        }
    }
</style>
