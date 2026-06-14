<script lang="ts">
	import { t } from '$lib/i18n.svelte';
</script>

<div class="support-page-container">
	<div class="support-modal-like-card">
		<a href="/" class="modal-close-btn-like" aria-label="Close">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</a>
		<h3 class="support-modal-title">
			{t.footer.creator_support_title}
		</h3>
		<p class="support-modal-desc">
			{t.footer.creator_support_desc}
		</p>
		<a href="https://buymeacoffee.com/ayiikan" target="_blank" rel="noopener noreferrer" class="btn-coffee-premium" style="width: 100%; justify-content: center; text-align: center;">
			☕ {@html t.footer.creator_support_cta.replace('ayiikan', '<span class="signature-text">ayiikan</span>')}
		</a>
	</div>
</div>

<style>
	.support-page-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 120px);
		padding: 40px 20px;
	}

	.support-modal-like-card {
		background: var(--bg-surface);
		border: 1px solid var(--accent-color);
		border-radius: 16px;
		padding: 40px;
		max-width: 450px;
		width: 100%;
		position: relative;
		box-shadow: var(--card-shadow), 0 0 50px var(--accent-glow);
		text-align: left;
	}

	.modal-close-btn-like {
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
		text-decoration: none;
	}

	.modal-close-btn-like:hover {
		color: var(--text-primary);
		background: var(--accent-glow);
		transform: rotate(90deg);
	}

	.support-modal-title {
		font-size: 1.25rem;
		margin-top: 5px;
		margin-bottom: 16px;
		color: var(--accent-color);
		font-weight: 800;
		border: none;
		padding-bottom: 0;
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.support-modal-desc {
		color: var(--text-secondary);
		font-size: 0.88rem;
		line-height: 1.6;
		margin-bottom: 24px;
		text-align: left;
	}

	.btn-coffee-premium {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: #ffdd00;
		color: #000000;
		font-weight: 700;
		padding: 12px 24px;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.btn-coffee-premium:hover {
		background: #f1c40f;
		transform: translateY(-1px);
	}

	:global(.signature-text) {
		font-family: 'Satisfy', cursive;
		color: #d35400;
		font-size: 1.2rem;
		margin-left: 4px;
	}
</style>
