<script lang="ts">
    import { t } from "$lib/i18n.svelte";
    import { fade, fly } from "svelte/transition";

    // Svelte 5 Rune for tab management
    let activeTab = $state("tab1");
</script>

<section
    id="games"
    class="container"
    style="padding-top: 120px; padding-bottom: 80px;"
>
    <span class="badge">{t.games.badge}</span>
    <h1 class="resp-title" style="margin-bottom: 24px;">
        {t.games.title_start}<span class="gradient-text">{t.games.title_gradient}</span>
    </h1>
    <p class="resp-subtitle" style="max-width: 800px; margin-bottom: 40px;">
        {t.games.subtitle}
    </p>

    <!-- Tab Buttons -->
    <div
        style="display: flex; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; overflow-x: auto;"
    >
        <button
            onclick={() => (activeTab = "tab1")}
            class="btn-secondary"
            style="border-color: {activeTab === 'tab1'
                ? 'var(--accent-color)'
                : 'var(--border-color)'}; color: {activeTab === 'tab1'
                ? 'var(--accent-color)'
                : 'var(--text-secondary)'}; white-space: nowrap;"
        >
            {t.games.tabs.tab1}
        </button>
        <button
            onclick={() => (activeTab = "tab2")}
            class="btn-secondary"
            style="border-color: {activeTab === 'tab2'
                ? 'var(--accent-color)'
                : 'var(--border-color)'}; color: {activeTab === 'tab2'
                ? 'var(--accent-color)'
                : 'var(--text-secondary)'}; white-space: nowrap;"
        >
            {t.games.tabs.tab2}
        </button>
        <button
            onclick={() => (activeTab = "tab3")}
            class="btn-secondary"
            style="border-color: {activeTab === 'tab3'
                ? 'var(--accent-color)'
                : 'var(--border-color)'}; color: {activeTab === 'tab3'
                ? 'var(--accent-color)'
                : 'var(--text-secondary)'}; white-space: nowrap;"
        >
            {t.games.tabs.tab3}
        </button>
    </div>

    <!-- Tab Content -->
    <div class="tabs-content-wrapper">
        {#if activeTab === "tab1"}
            <div
                class="tab-pane table-container"
                in:fly={{ y: 20, duration: 400, delay: 150 }}
                out:fade={{ duration: 150 }}
            >
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>{t.games.headers.game_name}</th>
                            <th>{t.games.headers.scale}</th>
                            <th>{t.games.headers.status_detail}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each t.games.table1 as row}
                            <tr>
                                <td class="highlight">{row.name}</td>
                                <td
                                    ><span class="badge-scale">{row.scale}</span
                                    ></td
                                >
                                <td>{row.status}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else if activeTab === "tab2"}
            <div
                class="tab-pane table-container"
                in:fly={{ y: 20, duration: 400, delay: 150 }}
                out:fade={{ duration: 150 }}
            >
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>{t.games.headers.game_name}</th>
                            <th>{t.games.headers.publisher_dev}</th>
                            <th>{t.games.headers.expectation_importance}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each t.games.table2 as row}
                            <tr>
                                <td class="highlight">{row.name}</td>
                                <td
                                    ><span class="badge-scale">{row.dev}</span
                                    ></td
                                >
                                <td>{row.note}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else if activeTab === "tab3"}
            <div
                class="tab-pane table-container"
                in:fly={{ y: 20, duration: 400, delay: 150 }}
                out:fade={{ duration: 150 }}
            >
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>{t.games.headers.game_name}</th>
                            <th>{t.games.headers.publisher_dev}</th>
                            <th>{t.games.headers.lobby_status}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each t.games.table3 as row}
                            <tr>
                                <td class="highlight">{row.name}</td>
                                <td
                                    ><span class="badge-scale">{row.dev}</span
                                    ></td
                                >
                                <td>{row.lobi}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</section>

<style>
    .tabs-content-wrapper {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        position: relative;
        width: 100%;
    }

    .tab-pane {
        grid-area: 1 / 1 / 2 / 2;
        width: 100%;
    }

    @media (max-width: 768px) {
        :global(.custom-table th), :global(.custom-table td) {
            padding: 12px 14px !important;
            font-size: 0.8rem !important;
        }
    }
</style>
