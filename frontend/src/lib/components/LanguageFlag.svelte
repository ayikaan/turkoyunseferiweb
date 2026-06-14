<script lang="ts">
    let { code, width = 24, height = 16 } = $props<{
        code: string;
        width?: number;
        height?: number;
    }>();
</script>

<span class="flag-wrapper" style="width: {width}px; height: {height}px;">
    {#if code === 'tr'}
        <!-- Turkey -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="TR">
            <rect width="120" height="80" fill="#e30a17"/>
            <circle cx="45" cy="40" r="30" fill="#ffffff"/>
            <circle cx="51" cy="40" r="24" fill="#e30a17"/>
            <g transform="translate(76, 40) rotate(-19)">
                <polygon points="0,-10 3,-3 10,-3 4,1 7,8 0,4 -7,8 -4,1 -10,-3 -3,-3" fill="#ffffff"/>
            </g>
        </svg>
    {:else if code === 'en'}
        <!-- US Flag (simplified) -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="EN">
            <rect width="120" height="80" fill="#ffffff"/>
            <!-- 7 Red stripes -->
            <rect width="120" height="6.15" y="0" fill="#b22234"/>
            <rect width="120" height="6.15" y="12.3" fill="#b22234"/>
            <rect width="120" height="6.15" y="24.6" fill="#b22234"/>
            <rect width="120" height="6.15" y="36.9" fill="#b22234"/>
            <rect width="120" height="6.15" y="49.2" fill="#b22234"/>
            <rect width="120" height="6.15" y="61.5" fill="#b22234"/>
            <rect width="120" height="6.15" y="73.8" fill="#b22234"/>
            <!-- Blue canton -->
            <rect width="48" height="43" fill="#3c3b6e"/>
            <!-- Stars placeholder (simplified pattern) -->
            <circle cx="8" cy="8" r="1.5" fill="#ffffff"/>
            <circle cx="20" cy="8" r="1.5" fill="#ffffff"/>
            <circle cx="32" cy="8" r="1.5" fill="#ffffff"/>
            <circle cx="40" cy="8" r="1.5" fill="#ffffff"/>
            <circle cx="14" cy="16" r="1.5" fill="#ffffff"/>
            <circle cx="26" cy="16" r="1.5" fill="#ffffff"/>
            <circle cx="38" cy="16" r="1.5" fill="#ffffff"/>
            <circle cx="8" cy="24" r="1.5" fill="#ffffff"/>
            <circle cx="20" cy="24" r="1.5" fill="#ffffff"/>
            <circle cx="32" cy="24" r="1.5" fill="#ffffff"/>
            <circle cx="40" cy="24" r="1.5" fill="#ffffff"/>
            <circle cx="14" cy="32" r="1.5" fill="#ffffff"/>
            <circle cx="26" cy="32" r="1.5" fill="#ffffff"/>
            <circle cx="38" cy="32" r="1.5" fill="#ffffff"/>
        </svg>
    {:else if code === 'de'}
        <!-- Germany -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="DE">
            <rect width="120" height="26.6" fill="#000000"/>
            <rect width="120" height="26.6" y="26.6" fill="#dd0000"/>
            <rect width="120" height="26.8" y="53.2" fill="#ffcf00"/>
        </svg>
    {:else if code === 'zh'}
        <!-- China -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="ZH">
            <rect width="120" height="80" fill="#ee1c25"/>
            <!-- Big star -->
            <polygon points="20,8 24,20 36,20 27,28 30,40 20,32 10,40 13,28 4,20 16,20" fill="#ffff00" transform="translate(4,4) scale(0.8)"/>
            <!-- Small stars -->
            <polygon points="10,0 13,7 20,7 15,11 17,18 10,14 3,18 5,11 0,7 7,7" fill="#ffff00" transform="translate(36, 8) rotate(23) scale(0.3)"/>
            <polygon points="10,0 13,7 20,7 15,11 17,18 10,14 3,18 5,11 0,7 7,7" fill="#ffff00" transform="translate(42, 16) rotate(45) scale(0.3)"/>
            <polygon points="10,0 13,7 20,7 15,11 17,18 10,14 3,18 5,11 0,7 7,7" fill="#ffff00" transform="translate(42, 28) rotate(0) scale(0.3)"/>
            <polygon points="10,0 13,7 20,7 15,11 17,18 10,14 3,18 5,11 0,7 7,7" fill="#ffff00" transform="translate(36, 36) rotate(23) scale(0.3)"/>
        </svg>
    {:else if code === 'fr'}
        <!-- France -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="FR">
            <rect width="40" height="80" fill="#002395"/>
            <rect width="40" height="80" x="40" fill="#ffffff"/>
            <rect width="40" height="80" x="80" fill="#ed2939"/>
        </svg>
    {:else if code === 'uk'}
        <!-- Ukraine -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="UK">
            <rect width="120" height="40" fill="#0057b7"/>
            <rect width="120" height="40" y="40" fill="#ffd700"/>
        </svg>
    {:else if code === 'es'}
        <!-- Spain -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="ES">
            <rect width="120" height="20" fill="#c11b17"/>
            <rect width="120" height="40" y="20" fill="#fcd116"/>
            <rect width="120" height="20" y="60" fill="#c11b17"/>
            <!-- Simplified Coat of Arms Circle -->
            <circle cx="30" cy="40" r="8" fill="#c11b17"/>
            <circle cx="30" cy="40" r="6" fill="#fcd116"/>
        </svg>
    {:else if code === 'ja'}
        <!-- Japan -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="JA">
            <rect width="120" height="80" fill="#ffffff"/>
            <circle cx="60" cy="40" r="24" fill="#bc002d"/>
        </svg>
    {:else if code === 'ko'}
        <!-- South Korea -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="KO">
            <rect width="120" height="80" fill="#ffffff"/>
            <!-- Taegeuk Yin-Yang Circle -->
            <g transform="translate(60, 40) rotate(-30)">
                <path d="M 0,-18 A 18,18 0 0,1 0,18 A 9,9 0 0,1 0,0 A 9,9 0 0,0 0,-18" fill="#c60c30"/>
                <path d="M 0,18 A 18,18 0 0,1 0,-18 A 9,9 0 0,0 0,0 A 9,9 0 0,1 0,18" fill="#0047a0"/>
            </g>
            <!-- Simplified black trigrams in corners -->
            <rect width="10" height="2" x="25" y="18" fill="#000000" transform="rotate(33 25 18)"/>
            <rect width="10" height="2" x="25" y="22" fill="#000000" transform="rotate(33 25 22)"/>
            <rect width="10" height="2" x="25" y="26" fill="#000000" transform="rotate(33 25 26)"/>
            
            <rect width="10" height="2" x="85" y="18" fill="#000000" transform="rotate(-33 85 18)"/>
            <rect width="10" height="2" x="85" y="22" fill="#000000" transform="rotate(-33 85 22)"/>
            <rect width="10" height="2" x="85" y="26" fill="#000000" transform="rotate(-33 85 26)"/>
        </svg>
    {:else if code === 'it'}
        <!-- Italy -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="IT">
            <rect width="40" height="80" fill="#009246"/>
            <rect width="40" height="80" x="40" fill="#ffffff"/>
            <rect width="40" height="80" x="80" fill="#ce2b37"/>
        </svg>
    {:else if code === 'ru'}
        <!-- Russia -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="RU">
            <rect width="120" height="26.6" fill="#ffffff"/>
            <rect width="120" height="26.6" y="26.6" fill="#0039a6"/>
            <rect width="120" height="26.8" y="53.2" fill="#d52b1e"/>
        </svg>
    {:else if code === 'pt'}
        <!-- Portugal -->
        <svg {width} {height} viewBox="0 0 120 80" aria-label="PT">
            <rect width="48" height="80" fill="#006600"/>
            <rect width="72" height="80" x="48" fill="#ff0000"/>
            <!-- Simplified Coat of Arms Circle -->
            <circle cx="48" cy="40" r="10" fill="#ffff00"/>
            <rect width="6" height="6" x="45" y="37" fill="#ffffff"/>
            <rect width="4" height="4" x="46" y="38" fill="#0000ff"/>
        </svg>
    {/if}
</span>

<style>
    .flag-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.15);
        flex-shrink: 0;
    }
    svg {
        display: block;
        object-fit: cover;
    }
</style>
