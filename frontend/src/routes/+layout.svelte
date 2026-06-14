<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import '../components.css';
	import '../responsive.css';
	import { t, currentLanguage, languageDetails, setLanguage } from '$lib/i18n.svelte';
	import TurkishFlag from '$lib/components/TurkishFlag.svelte';
	import LanguageFlag from '$lib/components/LanguageFlag.svelte';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	let dropdownOpen = $state(false);
	let themeDropdownOpen = $state(false);
	let currentTheme = $state('dark');
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		dropdownOpen = false;
		themeDropdownOpen = false;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const themes = [
		{ id: 'dark', icon: '🌙' },
		{ id: 'light', icon: '☀️' },
		{ id: 'forest', icon: '🌲' },
		{ id: 'ocean', icon: '🌊' }
	];

	const themeNames: Record<string, Record<string, string>> = {
		tr: { dark: 'Karanlık', light: 'Aydınlık', forest: 'Orman', ocean: 'Okyanus' },
		en: { dark: 'Dark', light: 'Light', forest: 'Forest', ocean: 'Ocean' },
		de: { dark: 'Dunkel', light: 'Hell', forest: 'Wald', ocean: 'Ozean' },
		es: { dark: 'Oscuro', light: 'Claro', forest: 'Bosque', ocean: 'Océano' },
		fr: { dark: 'Sombre', light: 'Clair', forest: 'Forêt', ocean: 'Océan' },
		it: { dark: 'Scuro', light: 'Chiaro', forest: 'Foresta', ocean: 'Oceano' },
		pt: { dark: 'Escuro', light: 'Claro', forest: 'Floresta', ocean: 'Oceano' },
		ru: { dark: 'Тёмный', light: 'Светлый', forest: 'Лесной', ocean: 'Океанский' },
		uk: { dark: 'Темний', light: 'Світлий', forest: 'Лісовий', ocean: 'Океанський' },
		zh: { dark: '暗色', light: '亮色', forest: '森林', ocean: '海洋' },
		ja: { dark: 'ダーク', light: 'ライト', forest: 'フォレスト', ocean: 'オーシャン' },
		ko: { dark: '다크', light: '라이트', forest: '포레스트', ocean: '오션' }
	};

	import { onMount } from 'svelte';
	onMount(() => {
		const savedTheme = localStorage.getItem('preferredTheme');
		if (savedTheme) {
			setTheme(savedTheme);
		}
	});

	function setTheme(themeName: string) {
		currentTheme = themeName;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', themeName);
			localStorage.setItem('preferredTheme', themeName);
		}
		themeDropdownOpen = false;
	}

	function toggleDropdown(e: MouseEvent) {
		e.stopPropagation();
		dropdownOpen = !dropdownOpen;
		themeDropdownOpen = false;
	}

	function toggleThemeDropdown(e: MouseEvent) {
		e.stopPropagation();
		themeDropdownOpen = !themeDropdownOpen;
		dropdownOpen = false;
	}

	function closeDropdowns() {
		dropdownOpen = false;
		themeDropdownOpen = false;
	}

	function selectLang(code: string) {
		setLanguage(code);
		dropdownOpen = false;
	}

	let creatorModalOpen = $state(false);

	function openCreatorModal() {
		creatorModalOpen = true;
	}

	function closeCreatorModal() {
		creatorModalOpen = false;
	}

	const nativeLanguageNames: Record<string, string> = {
		tr: 'Türkçe',
		en: 'English',
		de: 'Deutsch',
		zh: '中文',
		fr: 'Français',
		uk: 'Українська',
		es: 'Español',
		ja: '日本語',
		ko: '한국어',
		it: 'Italiano',
		ru: 'Русский',
		pt: 'Português'
	};

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{#snippet brandName()}
	<div class="brand-signature-logo">
		{#if currentLanguage.value === 'tr'}
			<span class="brand-bold">T├╝rk├ğe</span><span class="brand-light">Oyun Seferi</span>
		{:else if currentLanguage.value === 'en'}
			<span class="brand-bold">TURKISH GAME</span><span class="brand-light"> INITIATIVE</span>
		{:else if currentLanguage.value === 'de'}
			<span class="brand-bold">T├£RKISCHE</span><span class="brand-light"> SPIELEINITIATIVE</span>
		{:else if currentLanguage.value === 'fr'}
			<span class="brand-bold">INITIATIVE DE</span><span class="brand-light"> JEU TURC</span>
		{:else if currentLanguage.value === 'es'}
			<span class="brand-bold">INICIATIVA DEL</span><span class="brand-light"> JUEGO TURCO</span>
		{:else if currentLanguage.value === 'it'}
			<span class="brand-bold">INIZIATIVA DEL</span><span class="brand-light"> GIOCO TURCO</span>
		{:else if currentLanguage.value === 'pt'}
			<span class="brand-bold">INICIATIVA DO</span><span class="brand-light"> JOGO TURCO</span>
		{:else if currentLanguage.value === 'ru'}
			<span class="brand-bold">ºİºØºİºĞºİºÉºóºİºÆºÉ</span><span class="brand-light"> ºóºúºáºòºĞºÜºİºÑ ºİºôºá</span>
		{:else if currentLanguage.value === 'uk'}
			<span class="brand-bold">ºåºØºåºĞºåºÉºóºİºÆºÉ</span><span class="brand-light"> ºóºúºáºòºĞº¼ºÜºİºÑ ºåºôºŞºá</span>
		{:else}
			<span class="brand-bold">{t.brand.name}</span>
		{/if}
	</div>
{/snippet}

<svelte:window onclick={closeDropdowns} />

<svelte:head>
	<title>T├╝rk├ğe Oyun Seferi</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="glass-bg"></div>

<div style="display: flex; flex-direction: column; min-height: 100vh;">
	<header id="main-header">
		<nav class="container">
			<a href="/" class="brand-logo-link" style="text-decoration: none; color: inherit; display: flex; align-items: center;">
				<TurkishFlag />
				{@render brandName()}
			</a>
			<div class="nav-right-container" style="display: flex; align-items: center;">
				<ul class="nav-links">
					<li><a href="/" class:active={$page.url.pathname === '/'}>{t.nav.home}</a></li>
					<li><a href="/about" class:active={$page.url.pathname === '/about'}>{t.nav.about}</a></li>
					<li><a href="/games" class:active={$page.url.pathname === '/games'}>{t.nav.games}</a></li>
					<li><a href="/community" class:active={$page.url.pathname === '/community'}>{t.nav.community}</a></li>
					<li><a href="/news" class:active={$page.url.pathname === '/news'}>{t.nav.news}</a></li>
				</ul>

				<!-- Language Selector Dropdown -->
				<div class="lang-selector-container">
					<button class="lang-trigger-btn" class:active={dropdownOpen} onclick={toggleDropdown}>
						<LanguageFlag code={currentLanguage.value} />
						<span class="active-lang-name">{t.languages[currentLanguage.value]}</span>
						<svg class="dropdown-chevron" class:rotated={dropdownOpen} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>

					<div class="lang-dropdown-menu" class:open={dropdownOpen}>
						{#each languageDetails as lang}
							<button class="lang-item-btn" class:selected={currentLanguage.value === lang.code} onclick={() => selectLang(lang.code)}>
								<LanguageFlag code={lang.code} />
								<span class="lang-item-name">{nativeLanguageNames[lang.code] || lang.code}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Theme Selector Dropdown -->
				<div class="lang-selector-container">
					<button class="lang-trigger-btn" class:active={themeDropdownOpen} onclick={toggleThemeDropdown}>
						<span style="font-size: 1.05rem; display: inline-flex; align-items: center; justify-content: center;">{themes.find(th => th.id === currentTheme)?.icon || '­şîÖ'}</span>
						<span class="active-lang-name">{themeNames[currentLanguage.value]?.[currentTheme] || currentTheme}</span>
						<svg class="dropdown-chevron" class:rotated={themeDropdownOpen} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>

					<div class="lang-dropdown-menu" class:open={themeDropdownOpen}>
						{#each themes as theme}
							<button class="lang-item-btn" class:selected={currentTheme === theme.id} onclick={() => setTheme(theme.id)}>
								<span style="font-size: 1.05rem; display: inline-flex; align-items: center; justify-content: center;">{theme.icon}</span>
								<span class="lang-item-name">{themeNames[currentLanguage.value]?.[theme.id] || theme.id}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Hamburger Menu Button -->
				<button class="hamburger-btn" aria-label="Toggle menu" onclick={toggleMobileMenu}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						{#if mobileMenuOpen}
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						{:else}
							<line x1="3" y1="12" x2="21" y2="12"></line>
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<line x1="3" y1="18" x2="21" y2="18"></line>
						{/if}
					</svg>
				</button>
			</div>
		</nav>
	</header>

	<!-- Mobile Menu Drawer -->
	<div class="mobile-drawer-overlay" class:open={mobileMenuOpen} role="button" tabindex="0" onclick={closeMobileMenu} onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}>
		<div class="mobile-drawer" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
			<ul class="mobile-nav-links">
				<li><a href="/" class:active={$page.url.pathname === '/'} onclick={closeMobileMenu}>{t.nav.home}</a></li>
				<li><a href="/about" class:active={$page.url.pathname === '/about'} onclick={closeMobileMenu}>{t.nav.about}</a></li>
				<li><a href="/games" class:active={$page.url.pathname === '/games'} onclick={closeMobileMenu}>{t.nav.games}</a></li>
				<li><a href="/community" class:active={$page.url.pathname === '/community'} onclick={closeMobileMenu}>{t.nav.community}</a></li>
				<li><a href="/news" class:active={$page.url.pathname === '/news'} onclick={closeMobileMenu}>{t.nav.news}</a></li>
			</ul>
			
			<div class="mobile-selectors">
				<!-- Mobile Language Selector -->
				<div class="lang-selector-container" style="width: 100%;">
					<button class="lang-trigger-btn" style="width: 100%; justify-content: space-between;" class:active={dropdownOpen} onclick={toggleDropdown}>
						<div style="display: flex; align-items: center; gap: 8px;">
							<LanguageFlag code={currentLanguage.value} />
							<span>{t.languages[currentLanguage.value]}</span>
						</div>
						<svg class="dropdown-chevron" class:rotated={dropdownOpen} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
					<div class="lang-dropdown-menu" style="width: 100%;" class:open={dropdownOpen}>
						{#each languageDetails as lang}
							<button class="lang-item-btn" class:selected={currentLanguage.value === lang.code} onclick={() => { selectLang(lang.code); closeMobileMenu(); }}>
								<LanguageFlag code={lang.code} />
								<span class="lang-item-name">{nativeLanguageNames[lang.code] || lang.code}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Mobile Theme Selector -->
				<div class="lang-selector-container" style="width: 100%;">
					<button class="lang-trigger-btn" style="width: 100%; justify-content: space-between;" class:active={themeDropdownOpen} onclick={toggleThemeDropdown}>
						<div style="display: flex; align-items: center; gap: 8px;">
							<span style="font-size: 1.05rem; display: inline-flex; align-items: center; justify-content: center;">{themes.find(th => th.id === currentTheme)?.icon || '­şîÖ'}</span>
							<span>{themeNames[currentLanguage.value]?.[currentTheme] || currentTheme}</span>
						</div>
						<svg class="dropdown-chevron" class:rotated={themeDropdownOpen} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
					<div class="lang-dropdown-menu" style="width: 100%;" class:open={themeDropdownOpen}>
						{#each themes as theme}
							<button class="lang-item-btn" class:selected={currentTheme === theme.id} onclick={() => { setTheme(theme.id); closeMobileMenu(); }}>
								<span style="font-size: 1.05rem; display: inline-flex; align-items: center; justify-content: center;">{theme.icon}</span>
								<span class="lang-item-name">{themeNames[currentLanguage.value]?.[theme.id] || theme.id}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<main style="padding-top: 80px; flex: 1;">
		{@render children()}
	</main>

	<footer class="main-footer" style="padding-top: 60px; padding-bottom: 40px;">
		<div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 40px; text-align: left; padding-bottom: 30px;">
			
			<!-- Left column: Logo, Description, Socials -->
			<div style="display: flex; flex-direction: column; gap: 18px;">
				<div style="display: flex; align-items: center; gap: 10px;">
					<TurkishFlag />
					{@render brandName()}
				</div>
				<p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; max-width: 320px;">
					{t.footer.desc}
				</p>
				<div style="display: flex; gap: 15px; align-items: center; margin-top: 8px;">
					<a href="https://instagram.com/mustafakadirce" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Instagram" style="color: var(--text-secondary);">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
					</a>
					<a href="https://discord.gg/CVdrTPUYMQ" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Discord" style="color: var(--text-secondary);">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,72.9,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.22,123.63,27.34,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/></svg>
					</a>
					<a href="https://youtube.com/MstafaKadir" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="YouTube" style="color: var(--text-secondary);">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
					</a>
				</div>
			</div>
			
			<!-- Middle column: Resources -->
			<div style="display: flex; flex-direction: column; gap: 16px;">
				<h4 style="font-size: 0.85rem; font-weight: 700; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px;">{t.footer.links_title}</h4>
				<div style="display: flex; flex-direction: column; gap: 10px;">
					<a href="https://steamcommunity.com/groups/mstafakadir" target="_blank" rel="noopener noreferrer" class="footer-link" style="font-size: 0.85rem; width: fit-content;">{t.footer.link_steam}</a>
					<a href="https://discord.com/servers/play-ceviri-126103152098399360" target="_blank" rel="noopener noreferrer" class="footer-link" style="font-size: 0.85rem; width: fit-content;">{t.footer.link_discord}</a>
					<a href="mailto:mustafa@mkadir.com" class="footer-link" style="font-size: 0.85rem; width: fit-content;">{t.footer.link_b2b}</a>
				</div>
			</div>
			
			<!-- Right column: Support / Coffee -->
			<div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start;">
				<h4 style="font-size: 0.85rem; font-weight: 700; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px;">{t.footer.support_title}</h4>
				<p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 5px;">
					{t.footer.support_desc}
				</p>
				<a href="https://youtube.com/MstafaKadir/join" target="_blank" rel="noopener noreferrer" class="btn-coffee-premium">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 6px; margin-top: -2px;">
						<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.455 12 20.455 12 20.455s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
					</svg>
					{@html t.footer.support_cta.replace('Mustafa Kadir', '<span class="signature-mustafa">Mustafa Kadir</span>')}
				</a>
			</div>
			
		</div>
		
		<div class="container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
			<div style="width: 100%; height: 1px; background-color: var(--border-color); margin: 10px 0;"></div>
			
			<div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 15px; font-size: 0.75rem; color: var(--text-secondary);">
				<div>&copy; 2026 {t.footer.copyright}</div>
				<div style="display: flex; align-items: center; gap: 5px;">
					{t.footer.designed_by} 
					<button onclick={openCreatorModal} class="signature-btn" style="background: none; border: none; padding: 0; margin: 0; cursor: pointer; display: inline-flex; align-items: center; outline: none;">
						<span class="signature" style="font-size: 1.1rem; line-height: 1;">ayiikan</span>
					</button>
				</div>
			</div>
		</div>
	</footer>
</div>

{#if creatorModalOpen}
	<!-- Modal Overlay -->
	<div role="button" tabindex="0" class="modal-overlay" onclick={closeCreatorModal} onkeydown={(e) => e.key === 'Escape' && closeCreatorModal()}>
		<div role="dialog" aria-modal="true" tabindex="-1" class="modal-content" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close-btn" onclick={closeCreatorModal} aria-label="Close modal">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
			<h3 style="font-size: 1.25rem; margin-top: 5px; margin-bottom: 16px; color: var(--accent-color); font-weight: 800; border: none; padding-bottom: 0; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">
				{t.footer.creator_support_title}
			</h3>
			<p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; margin-bottom: 24px; text-align: left;">
				{t.footer.creator_support_desc}
			</p>
			<a href="https://buymeacoffee.com/ayiikan" target="_blank" rel="noopener noreferrer" class="btn-coffee-premium" onclick={closeCreatorModal} style="width: 100%; justify-content: center; text-align: center;">
				Ôİò {@html t.footer.creator_support_cta.replace('ayiikan', '<span class="signature-text">ayiikan</span>')}
			</a>
		</div>
	</div>
{/if}

<style>
	.lang-selector-container {
		position: relative;
		display: inline-block;
	}

	.lang-trigger-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 8px 14px;
		color: var(--text-secondary);
		font-family: var(--font-family);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		outline: none;
	}

	.lang-trigger-btn:hover {
		background: var(--accent-glow);
		color: var(--text-primary);
		border-color: var(--accent-color);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.lang-trigger-btn.active {
		background: var(--accent-glow);
		color: var(--text-primary);
		border-color: var(--accent-color);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 8px var(--accent-glow);
	}

	.active-lang-name {
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown-chevron {
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.dropdown-chevron.rotated {
		transform: rotate(180deg);
	}

	.lang-dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 8px;
		background: var(--bg-surface);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 6px 0;
		min-width: 170px;
		max-height: 300px;
		overflow-y: auto;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-color);
		z-index: 110;
		
		/* Animations */
		opacity: 0;
		transform: translateY(10px);
		pointer-events: none;
		transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* Custom Scrollbar for Dropdown Menu */
	.lang-dropdown-menu::-webkit-scrollbar {
		width: 4px;
	}
	.lang-dropdown-menu::-webkit-scrollbar-track {
		background: transparent;
	}
	.lang-dropdown-menu::-webkit-scrollbar-thumb {
		background: var(--accent-glow);
		border-radius: 2px;
	}

	.lang-dropdown-menu.open {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.mobile-selectors .lang-dropdown-menu {
		top: auto;
		bottom: 100%;
		margin-top: 0;
		margin-bottom: 8px;
		box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-color);
		transform: translateY(-10px);
	}

	.mobile-selectors .lang-dropdown-menu.open {
		transform: translateY(0);
	}

	.lang-item-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 16px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-family: var(--font-family);
		font-size: 0.85rem;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.lang-item-btn:hover {
		background: var(--accent-glow);
		color: var(--text-primary);
	}

	.lang-item-btn.selected {
		color: var(--accent-color);
		font-weight: 600;
		background: var(--accent-glow);
	}

	.lang-item-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Responsive tweaks */
	@media (max-width: 1300px) {
		.active-lang-name {
			display: none;
		}
		.lang-trigger-btn {
			padding: 8px;
		}
	}

	.signature-btn {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		outline: none;
		position: relative;
	}
	.signature-btn .signature {
		transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		text-shadow: 0 0 0px rgba(223, 177, 91, 0);
		display: inline-block;
	}
	.signature-btn:hover .signature {
		color: var(--accent-hover);
		transform: scale(1.08) rotate(-2deg);
		text-shadow: 0 0 10px var(--accent-glow);
	}
	.signature-btn::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 100%;
		height: 1.5px;
		background: var(--accent-color);
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 0 8px var(--accent-color);
	}
	.signature-btn:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(5, 5, 6, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		animation: fade-in-modal 0.2s ease-out;
		will-change: opacity;
	}
	.modal-content {
		background: var(--bg-surface);
		border: 1px solid var(--accent-color);
		border-radius: 16px;
		padding: 40px;
		max-width: 450px;
		width: 90%;
		position: relative;
		box-shadow: var(--card-shadow), 0 0 50px var(--accent-glow);
		animation: slide-up-modal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform, opacity;
	}
	.modal-close-btn {
		position: absolute;
		top: 18px;
		right: 18px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border-radius: 50%;
		outline: none;
		will-change: transform;
	}
	.modal-close-btn:hover {
		color: var(--text-primary);
		background: var(--accent-glow);
		transform: rotate(90deg);
	}
	@keyframes fade-in-modal {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes slide-up-modal {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>

