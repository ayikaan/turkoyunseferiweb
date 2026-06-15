<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    let { data, form } = $props();

    // Active tab
    let activeTab = $state('news'); // 'news', 'settings', 'trigger', 'users'

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
    let notification = $state<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

    let showRegPassword = $state(false);
    let showLoginPassword = $state(false);

    let isSelectOpen = $state(false);
    let selectedAgentValue = $state('1');

    // Multi-step login state
    let loginStep = $state<'username' | 'password'>('username');
    let loginUsername = $state('');
    let isDevicePending = $state(false);
    let pendingDeviceId = $state('');

    // User management state
    let newAdminUsername = $state('');
    let newAdminPassword = $state('');
    let isAddingAdmin = $state(false);

    $effect(() => {
        if (settings.agent_enabled !== undefined) {
            selectedAgentValue = settings.agent_enabled;
        }
    });

    function selectAgentOption(val: string) {
        selectedAgentValue = val;
        isSelectOpen = false;
    }

    function showNotification(type: 'success' | 'error' | 'warning', message: string) {
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

    function handleCheckUsername() {
        return async ({ result }: any) => {
            if (result.type === 'success' && result.data?.success) {
                loginUsername = result.data.username;
                loginStep = 'password';
                showNotification('success', 'Kullanıcı adı doğrulandı, şifrenizi girin.');
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Kullanıcı adı bulunamadı.');
            }
        };
    }

    function handleLogin() {
        return async ({ result }: any) => {
            if (result.type === 'success') {
                if (result.data?.devicePending) {
                    isDevicePending = true;
                    pendingDeviceId = result.data.deviceId;
                    showNotification('warning', 'Cihaz onayı bekleniyor!');
                } else {
                    showNotification('success', 'Giriş başarılı!');
                    location.reload();
                }
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Giriş yapılamadı.');
            }
        };
    }

    function handleAddAdminSubmit() {
        isAddingAdmin = true;
        return async ({ result }: any) => {
            isAddingAdmin = false;
            if (result.type === 'success') {
                showNotification('success', 'Yeni yönetici başarıyla eklendi!');
                newAdminUsername = '';
                newAdminPassword = '';
                location.reload();
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Yönetici eklenirken hata oluştu.');
            }
        };
    }

    function handleDeviceAction(actionName: string) {
        return async ({ result }: any) => {
            if (result.type === 'success') {
                let msg = 'Cihazın yetkisi başarıyla kaldırıldı.';
                if (actionName === 'approve') {
                    msg = 'Cihaz başarıyla onaylandı!';
                } else if (actionName === 'logout') {
                    msg = 'Cihaz oturumu başarıyla kapatıldı.';
                }
                showNotification('success', msg);
                location.reload();
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'İşlem gerçekleştirilemedi.');
            }
        };
    }

    function handleDeleteUserSubmit() {
        return async ({ result }: any) => {
            if (result.type === 'success') {
                showNotification('success', 'Yönetici başarıyla silindi.');
                location.reload();
            } else if (result.type === 'failure') {
                showNotification('error', result.data?.error || 'Yönetici silinemedi.');
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
    const scraped = $derived(data?.scrapedStats || {});
</script>

<svelte:window onclick={() => isSelectOpen = false} />

<svelte:head>
    <title>Yönetim Paneli - Türkçe Oyun Seferi</title>
</svelte:head>

<section class="container admin-section" style="padding-top: 60px; padding-bottom: 40px;">
    
    <!-- Notification Toast -->
    {#if notification}
        <div class="notification-toast {notification.type}" transition:fade>
            <span class="icon">
                {#if notification.type === 'success'}
                    ⚡
                {:else if notification.type === 'warning'}
                    🔒
                {:else}
                    ⚠️
                {/if}
            </span>
            <span class="message">{notification.message}</span>
        </div>
    {/if}

    <!-- 1. Password Setup (Register) Screen -->
    {#if !data.hasPassword}
        <div class="auth-wrapper" transition:fade>
            <div class="visual-card auth-card">
                <div class="card-content">
                    <span class="badge">İlk Kurulum</span>
                    <h2 style="margin-bottom: 12px; color: var(--text-primary);">Yönetici Hesabı Belirleyin</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">
                        Kontrol paneline erişmek için yeni bir kullanıcı adı ve şifre tanımlayın. Bu bilgiler veritabanında güvenli şekilde saklanacaktır.
                    </p>

                    <form method="POST" action="?/setPassword" use:enhance>
                        <div class="input-group" style="margin-bottom: 16px;">
                            <label for="reg-username">Kullanıcı Adı</label>
                            <input type="text" id="reg-username" name="username" required minlength="3" placeholder="Yönetici kullanıcı adı girin..." />
                        </div>

                        <div class="input-group">
                            <label for="reg-password">Şifre (En az 6 karakter)</label>
                            <div class="password-wrapper">
                                <input type={showRegPassword ? "text" : "password"} id="reg-password" name="password" required minlength="6" placeholder="••••••••" />
                                <button type="button" class="eye-btn" onclick={() => showRegPassword = !showRegPassword} aria-label="Şifre göster/gizle">
                                    {#if showRegPassword}
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    {:else}
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    {/if}
                                </button>
                            </div>
                        </div>
                        
                        {#if form?.error}
                            <p class="form-error-msg">{form.error}</p>
                        {/if}

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 24px;">Kaydet ve Giriş Yap</button>
                    </form>
                </div>
            </div>
        </div>

    <!-- 2. Login Screen -->
    {:else if !data.authenticated}
        <div class="auth-wrapper" transition:fade>
            {#if isDevicePending}
                <div class="visual-card auth-card" style="border-color: rgba(223, 177, 91, 0.4);" transition:fade>
                    <div class="card-content" style="text-align: center;">
                        <span class="badge" style="background: rgba(223, 177, 91, 0.1); color: var(--accent-color); padding: 6px 14px; font-weight: 700;">🔒 CİHAZ ONAYI BEKLENİYOR</span>
                        <h2 style="margin-top: 16px; margin-bottom: 12px; color: var(--text-primary); font-size: 1.4rem;">Cihaz Yetkilendirilmemiş</h2>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5;">
                            Güvenlik önlemleri gereği, bu cihaza erişim izni verilmesi gerekmektedir. Lütfen kurucu yöneticinin (ilk kurulumu yapan cihazın) onay vermesini bekleyin.
                        </p>
                        <div style="background: rgba(0,0,0,0.4); padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 24px; word-break: break-all;">
                            Cihaz ID: {pendingDeviceId}
                        </div>
                        <button type="button" class="btn-secondary" style="width: 100%;" onclick={() => { isDevicePending = false; loginStep = 'username'; }}>Giriş Sayfasına Dön</button>
                    </div>
                </div>
            {:else}
                <div class="visual-card auth-card">
                    <div class="card-content">
                        <span class="badge">Giriş Gerekli</span>
                        <h2 style="margin-bottom: 12px; color: var(--text-primary);">Yönetici Girişi</h2>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">
                            Kontrol paneline devam etmek için yönetici bilgilerinizi girin.
                        </p>

                        {#if loginStep === 'username'}
                            <form method="POST" action="?/checkUsername" use:enhance={handleCheckUsername}>
                                <div class="input-group">
                                    <label for="login-username">Kullanıcı Adı</label>
                                    <input type="text" id="login-username" name="username" required placeholder="Kullanıcı adınızı girin..." />
                                </div>

                                {#if form?.error}
                                    <p class="form-error-msg">{form.error}</p>
                                {/if}

                                <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">Devam Et</button>
                            </form>
                        {:else}
                            <form method="POST" action="?/login" use:enhance={handleLogin}>
                                <input type="hidden" name="username" value={loginUsername} />
                                
                                <div class="input-group">
                                    <label for="login-password">Şifre ({loginUsername})</label>
                                    <div class="password-wrapper">
                                        <input type={showLoginPassword ? "text" : "password"} id="login-password" name="password" required placeholder="••••••••" />
                                        <button type="button" class="eye-btn" onclick={() => showLoginPassword = !showLoginPassword} aria-label="Şifre göster/gizle">
                                            {#if showLoginPassword}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            {:else}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                                
                                {#if form?.error}
                                    <p class="form-error-msg">{form.error}</p>
                                {/if}

                                <div style="display: flex; gap: 12px; margin-top: 24px;">
                                    <button type="button" class="btn-secondary" style="flex: 1;" onclick={() => loginStep = 'username'}>Geri</button>
                                    <button type="submit" class="btn-primary" style="flex: 2;">Giriş Yap</button>
                                </div>
                            </form>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

    <!-- 3. Authenticated Dashboard Screen -->
    {:else}
        <!-- Top welcome message centered -->
        <div style="display: flex; justify-content: center; margin-bottom: 28px; width: 100%;">
            <div class="welcome-banner" style="font-family: 'Caveat', cursive; font-size: 2.6rem; font-weight: 700; color: var(--accent-color); text-align: center; text-shadow: 0 0 12px rgba(223, 177, 91, 0.3); letter-spacing: 0.5px; border: none; background: none; padding: 0;">
                👋 Hoş geldin, {data.currentUser?.username}
            </div>
        </div>

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
            {#if data.currentUser?.isOwner}
                <button class="tab-btn" class:active={activeTab === 'users'} onclick={() => activeTab = 'users'}>
                    👤 Kullanıcılar & Cihazlar
                </button>
            {/if}
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

                            <div class="settings-grid">
                                <!-- Social Media Links -->
                                <div class="settings-col">
                                    <h4 class="col-title">Sosyal Medya Linkleri</h4>
                                    
                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-youtube">YouTube Kanalı</label>
                                            <input type="url" id="s-youtube" name="social_youtube" value={settings.social_youtube || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-youtube-join">YouTube Katıl</label>
                                            <input type="url" id="s-youtube-join" name="social_youtube_join" value={settings.social_youtube_join || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-instagram">Instagram</label>
                                            <input type="url" id="s-instagram" name="social_instagram" value={settings.social_instagram || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-discord">Discord Sunucusu</label>
                                            <input type="url" id="s-discord" name="social_discord" value={settings.social_discord || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-discord-play">Discord Play Çeviri</label>
                                            <input type="url" id="s-discord-play" name="social_discord_play" value={settings.social_discord_play || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="s-steam">Steam Grubu</label>
                                            <input type="url" id="s-steam" name="social_steam" value={settings.social_steam || ''} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>
                                </div>

                                <!-- Statistics Overrides -->
                                <div class="settings-col">
                                    <h4 class="col-title">İstatistik Manuel Ayarları (Opsiyonel)</h4>
                                    
                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-yt-subs">YouTube Abone Sayısı</label>
                                            <input type="text" id="stat-yt-subs" name="stat_youtube_subscribers" value={settings.stat_youtube_subscribers || ''} placeholder={scraped.youtubeSubscribers ? `Otomatik taranıyor... (Mevcut: ${scraped.youtubeSubscribers})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-yt-vids">YouTube Video Sayısı</label>
                                            <input type="text" id="stat-yt-vids" name="stat_youtube_videos" value={settings.stat_youtube_videos || ''} placeholder={scraped.youtubeVideos ? `Otomatik taranıyor... (Mevcut: ${scraped.youtubeVideos})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-steam-mem">Steam Grup Üye Sayısı</label>
                                            <input type="text" id="stat-steam-mem" name="stat_steam_members" value={settings.stat_steam_members || ''} placeholder={scraped.steamGroupMembers ? `Otomatik taranıyor... (Mevcut: ${scraped.steamGroupMembers})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-steam-online">Steam Çevrimiçi Üye</label>
                                            <input type="text" id="stat-steam-online" name="stat_steam_online" value={settings.stat_steam_online || ''} placeholder={scraped.steamGroupOnline ? `Otomatik taranıyor... (Mevcut: ${scraped.steamGroupOnline})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-steam-lvl">Mustafa Kadir Steam Seviyesi</label>
                                            <input type="text" id="stat-steam-lvl" name="stat_steam_level" value={settings.stat_steam_level || ''} placeholder={scraped.steamLevel ? `Otomatik taranıyor... (Mevcut: ${scraped.steamLevel})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-steam-fr">Mustafa Kadir Arkadaş Sayısı</label>
                                            <input type="text" id="stat-steam-fr" name="stat_steam_friends" value={settings.stat_steam_friends || ''} placeholder={scraped.steamFriends ? `Otomatik taranıyor... (Mevcut: ${scraped.steamFriends})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>

                                    <form method="POST" action="?/saveSettings" use:enhance={handleSettingsSubmit} class="setting-row-form">
                                        <div class="input-group">
                                            <label for="stat-x-mem">X Topluluk Üye Sayısı</label>
                                            <input type="text" id="stat-x-mem" name="stat_x_members" value={settings.stat_x_members || ''} placeholder={scraped.xCommunityMembers ? `Otomatik taranıyor... (Mevcut: ${scraped.xCommunityMembers})` : 'Otomatik taranıyor...'} />
                                        </div>
                                        <button type="submit" class="btn-primary-compact" disabled={isSavingSettings}>Kaydet</button>
                                    </form>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Tab 3: Autonomous Agent -->
        {#if activeTab === 'trigger'}
            <div class="tab-content" transition:fade>
                
                <!-- Card 1: Agent Status (Toggling) -->
                <div class="visual-card" style="margin-bottom: 32px;">
                    <div class="card-content">
                        <h3>Otonom Ajan Modu</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Ajan aktif durumdayken, arka planda belirli aralıklarla yeni YouTube ve X gönderilerini otomatik olarak tarayarak haber oluşturur. Pasif modda yalnızca bu sayfadan manuel tetikleyebilirsiniz.
                        </p>

                        <form method="POST" action="?/saveAgentStatus" use:enhance={() => {
                            return async ({ result }) => {
                                if (result.type === 'success') {
                                    showNotification('success', 'Ajan modu başarıyla güncellendi!');
                                } else {
                                    showNotification('error', 'Ajan modu kaydedilemedi.');
                                }
                            };
                        }} style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
                            <div class="custom-select-container" style="min-width: 320px;">
                                <button type="button" class="custom-select-trigger" onclick={(e) => { e.stopPropagation(); isSelectOpen = !isSelectOpen; }}>
                                    <span>{selectedAgentValue === '1' ? 'Aktif (Otomatik Tara & Yayınla)' : 'Pasif (Yalnızca Manuel Yönetim)'}</span>
                                    <svg class="chevron" class:rotated={isSelectOpen} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {#if isSelectOpen}
                                    <div class="custom-select-options" transition:slide>
                                        <button type="button" class="custom-option" class:active={selectedAgentValue === '1'} onclick={() => selectAgentOption('1')}>
                                            Aktif (Otomatik Tara & Yayınla)
                                        </button>
                                        <button type="button" class="custom-option" class:active={selectedAgentValue === '0'} onclick={() => selectAgentOption('0')}>
                                            Pasif (Yalnızca Manuel Yönetim)
                                        </button>
                                    </div>
                                {/if}
                                <input type="hidden" name="agent_enabled" value={selectedAgentValue} />
                            </div>

                            <button type="submit" class="btn-primary" style="margin: 0; padding: 12px 24px; font-size: 0.95rem;">Durumu Kaydet</button>
                        </form>
                    </div>
                </div>

                <!-- Card 2: Manual Trigger Agent -->
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

        <!-- Tab 4: Users & Devices Management -->
        {#if activeTab === 'users' && data.currentUser?.isOwner}
            <div class="tab-content" transition:fade>
                
                <!-- Users Management Card -->
                <div class="visual-card" style="margin-bottom: 32px;">
                    <div class="card-content">
                        <h3>Yöneticileri Yönet</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Siteyi düzenleyebilecek veya admin paneline girebilecek kişileri yönetin. Yetkisini kaldırabilir, silebilirsiniz. Kimse kurucu yöneticiyi silemez veya yetkilerini değiştiremez.
                        </p>

                        <!-- Add User Form -->
                        <form method="POST" action="?/addAdminUser" use:enhance={handleAddAdminSubmit} style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: flex-end; margin-bottom: 32px;">
                            <div class="input-group">
                                <label for="new-admin-username">Kullanıcı Adı</label>
                                <input type="text" id="new-admin-username" name="username" bind:value={newAdminUsername} required minlength="3" placeholder="Yeni kullanıcı adı..." />
                            </div>
                            <div class="input-group">
                                <label for="new-admin-password">Şifre</label>
                                <input type="password" id="new-admin-password" name="password" bind:value={newAdminPassword} required minlength="6" placeholder="••••••••" />
                            </div>
                            <button type="submit" class="btn-primary" style="margin: 0; padding: 12px 24px;" disabled={isAddingAdmin}>
                                {isAddingAdmin ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                            </button>
                        </form>

                        <!-- Users Table -->
                        <div style="overflow-x: auto;">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı Adı</th>
                                        <th>Rol</th>
                                        <th>Oluşturulma Tarihi</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#if data.admins && data.admins.length > 0}
                                        {#each data.admins as admin}
                                            <tr>
                                                <td class="highlight">{admin.username}</td>
                                                <td>
                                                    {#if admin.is_owner}
                                                        <span class="badge" style="background: rgba(223, 177, 91, 0.15); color: var(--accent-color); font-size: 0.75rem;">Kurucu Yönetici</span>
                                                    {:else}
                                                        <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); font-size: 0.75rem;">Yönetici</span>
                                                    {/if}
                                                </td>
                                                <td>{new Date(admin.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    {#if !admin.is_owner}
                                                        <form method="POST" action="?/deleteAdminUser" use:enhance={handleDeleteUserSubmit}>
                                                            <input type="hidden" name="id" value={admin.id} />
                                                            <button type="submit" class="action-btn delete" onclick={(e) => { if (!confirm('Bu yöneticiyi silmek istediğinize emin misiniz?')) e.preventDefault(); }}>Sil</button>
                                                        </form>
                                                    {:else}
                                                        <span style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">Kurucu (Silinemez)</span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    {:else}
                                        <tr>
                                            <td colspan="4" style="text-align: center; padding: 20px;">Kayıtlı yönetici bulunamadı.</td>
                                        </tr>
                                    {/if}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Approved Devices Card -->
                <div class="visual-card">
                    <div class="card-content">
                        <h3>Cihaz Onaylama & Yetkilendirme</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
                            Yönetim paneline giriş yapmaya çalışan tüm cihazları yetkilendirebilirsiniz. Kurucu yöneticinin onaylamadığı hiçbir yeni cihaz sisteme erişemez.
                        </p>

                        <div style="overflow-x: auto;">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Cihaz Bilgisi</th>
                                        <th>Cihaz ID</th>
                                        <th>Son IP Adresi</th>
                                        <th>Durum</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#if data.devices && data.devices.length > 0}
                                        {#each data.devices as device}
                                            <tr>
                                                <td>
                                                    <div style="font-weight: 600; color: var(--text-primary);">{device.name}</div>
                                                    <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title={device.user_agent}>
                                                        {device.user_agent}
                                                    </div>
                                                </td>
                                                <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-secondary);">{device.device_id.slice(0, 8)}...</td>
                                                <td>{device.ip_address}</td>
                                                <td>
                                                    {#if device.is_approved}
                                                        <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 0.75rem;">Yetkili</span>
                                                    {:else}
                                                        <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 0.75rem;">Onay Bekliyor</span>
                                                    {/if}
                                                </td>
                                                <td>
                                                    {#if device.device_id === data.deviceId}
                                                        <span style="color: var(--accent-color); font-size: 0.85rem; font-weight: 600;">Şu anki Cihaz</span>
                                                    {:else}
                                                        {#if device.name === 'Kurucu Cihaz'}
                                                            {#if device.session_active}
                                                                <form method="POST" action="?/logoutDevice" use:enhance={() => handleDeviceAction('logout')}>
                                                                    <input type="hidden" name="device_id" value={device.device_id} />
                                                                    <button type="submit" class="action-btn edit" style="border-color: rgba(223, 177, 91, 0.2); color: var(--accent-color); background: rgba(223, 177, 91, 0.03);">Oturumu Kapat</button>
                                                                </form>
                                                            {:else}
                                                                <span style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">Oturum Kapalı</span>
                                                            {/if}
                                                        {:else}
                                                            {#if device.is_approved}
                                                                <div style="display: flex; gap: 8px;">
                                                                    {#if device.session_active}
                                                                        <form method="POST" action="?/logoutDevice" use:enhance={() => handleDeviceAction('logout')}>
                                                                            <input type="hidden" name="device_id" value={device.device_id} />
                                                                            <button type="submit" class="action-btn edit" style="border-color: rgba(223, 177, 91, 0.2); color: var(--accent-color); background: rgba(223, 177, 91, 0.03);">Oturumu Kapat</button>
                                                                        </form>
                                                                    {/if}
                                                                    <form method="POST" action="?/revokeDevice" use:enhance={() => handleDeviceAction('revoke')}>
                                                                        <input type="hidden" name="device_id" value={device.device_id} />
                                                                        <button type="submit" class="action-btn delete">Yetkiyi Kaldır</button>
                                                                    </form>
                                                                </div>
                                                            {:else}
                                                                <form method="POST" action="?/approveDevice" use:enhance={() => handleDeviceAction('approve')}>
                                                                    <input type="hidden" name="device_id" value={device.device_id} />
                                                                    <button type="submit" class="action-btn edit" style="border-color: rgba(16, 185, 129, 0.2); color: #34d399; background: rgba(16, 185, 129, 0.03);">Onayla</button>
                                                                </form>
                                                            {/if}
                                                        {/if}
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    {:else}
                                        <tr>
                                            <td colspan="5" style="text-align: center; padding: 20px;">Yetkilendirme bekleyen veya yetkili cihaz bulunamadı.</td>
                                        </tr>
                                    {/if}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        {/if}
    {/if}
</section>

<style>
    .admin-section {
        min-height: 55vh;
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
        width: 100%;
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

    .password-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
    }

    .password-wrapper input {
        padding-right: 48px;
    }

    .eye-btn {
        position: absolute;
        right: 12px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
    }

    .eye-btn:hover {
        color: var(--accent-color);
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

    .custom-select-container {
        position: relative;
        width: 100%;
        min-width: 280px;
    }

    .custom-select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 12px 16px;
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        text-align: left;
    }

    .custom-select-trigger:focus, .custom-select-trigger:hover {
        border-color: var(--accent-color);
        box-shadow: 0 0 10px rgba(223, 177, 91, 0.1);
    }

    .custom-select-trigger .chevron {
        transition: transform 0.2s ease;
        color: var(--accent-color);
    }

    .custom-select-trigger .chevron.rotated {
        transform: rotate(180deg);
    }

    .custom-select-options {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 6px;
        background-color: #161616;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 100;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .custom-option {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 12px 16px;
        cursor: pointer;
        text-align: left;
        font-size: 0.95rem;
        font-family: var(--font-family);
        transition: all 0.2s ease;
        width: 100%;
    }

    .custom-option:hover {
        background-color: rgba(223, 177, 91, 0.08);
        color: var(--accent-color);
    }

    .custom-option.active {
        background-color: rgba(223, 177, 91, 0.15);
        color: var(--accent-color);
        font-weight: 600;
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

    .notification-toast.warning {
        background-color: rgba(223, 177, 91, 0.1);
        border: 1px solid rgba(223, 177, 91, 0.2);
        color: var(--accent-color);
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

    .setting-row-form {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        width: 100%;
    }

    .btn-primary-compact {
        background: linear-gradient(135deg, var(--accent-color), #cbb26a);
        color: #000000;
        border: none;
        padding: 12px 18px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.85rem;
        font-family: var(--font-family);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 15px rgba(223, 177, 91, 0.15);
        height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin: 0;
    }

    .btn-primary-compact:hover {
        transform: translateY(-1px);
        background: linear-gradient(135deg, var(--accent-hover), var(--accent-color));
        box-shadow: 0 6px 18px rgba(223, 177, 91, 0.3);
    }

    .btn-primary-compact:active {
        transform: translateY(0) scale(0.98);
    }
</style>
