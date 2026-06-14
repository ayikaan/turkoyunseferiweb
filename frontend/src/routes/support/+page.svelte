<script lang="ts">
	import { currentLanguage, t } from '$lib/i18n';
	import { onMount } from 'svelte';

	let title = $state('');

	$effect(() => {
		title = $currentLanguage.value === 'tr' ? 'Destek Ol | Türkçe Oyun Seferi' : 'Support | Turkish Game Initiative';
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="support-page-container">
	<div class="support-card">
		<h1 class="support-title">{t.footer.creator_support_title}</h1>
		<p class="support-desc">{t.footer.creator_support_desc}</p>
		
		<a href="https://buymeacoffee.com/ayiikan" target="_blank" rel="noopener noreferrer" class="btn-coffee-premium">
			☕ {t.footer.creator_support_cta}
		</a>
	</div>
</div>

<style>
	.support-page-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 80px - 300px); /* header and footer spacing offset */
		padding: 40px 20px;
	}

	.support-card {
		background: rgba(13, 13, 17, 0.4);
		border: 1px solid var(--border-color);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 16px;
		padding: 40px;
		max-width: 480px;
		width: 100%;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.support-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--accent-color);
		margin-bottom: 20px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.support-desc {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 30px;
	}

	.btn-coffee-premium {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background: linear-gradient(135deg, #ffdd00 0%, #f1c40f 100%);
		color: #000000;
		font-weight: 700;
		padding: 14px 28px;
		border-radius: 30px;
		text-decoration: none;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 4px 15px rgba(255, 221, 0, 0.2);
		width: 100%;
	}

	.btn-coffee-premium:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 221, 0, 0.4);
		filter: brightness(1.05);
	}
</style>
