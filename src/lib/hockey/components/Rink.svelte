<script module lang="ts">
  /**
   * Convert rink-relative percentages (0–100) to CSS position values for overlay children.
   * Center ice is rinkCoords(50, 50). Top of rink is y=0, bottom is y=100.
   *
   * The full component viewBox is 1060×720, with the rink occupying y=110..710.
   */
  export function rinkCoords(xPct: number, yPct: number) {
    return {
      left: `${xPct}%`,
      top: `${((110 + (yPct / 100) * 600) / 720) * 100}%`
    };
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    awayTeam?: string;
    homeTeam?: string;
    awayColor?: string;
    homeColor?: string;
    homeLogo?: string;
    awayBox?: Snippet;
    homeBox?: Snippet;
    children?: Snippet;
  }

  let {
    awayTeam = 'AWAY',
    homeTeam = 'HOME',
    awayColor = 'var(--team-away, #dc2626)',
    homeColor = 'var(--team-home, #1e40af)',
    homeLogo,
    awayBox,
    homeBox,
    children
  }: Props = $props();

  const endZoneFaceoffs = [
    { cx: 180, cy: 150 },
    { cx: 180, cy: 450 },
    { cx: 880, cy: 150 },
    { cx: 880, cy: 450 }
  ];

  const neutralDots = [
    { cx: 342, cy: 150 },
    { cx: 342, cy: 450 },
    { cx: 718, cy: 150 },
    { cx: 718, cy: 450 }
  ];
</script>

<div class="hockey-rink">
  <svg
    class="rink-svg"
    viewBox="0 0 1060 720"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Hockey rink"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <pattern id="netMesh" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" class="mesh-bg" />
        <path d="M 0 0 L 4 0 M 0 0 L 0 4" class="mesh-line" />
      </pattern>
    </defs>

    <!-- Penalty box frames -->
    <g class="pb-shapes">
      <rect class="pb-frame" x="350" y="12" width="170" height="92" rx="3" />
      <rect class="pb-inner-fill" x="357" y="19" width="156" height="78" rx="1" />
      <rect x="357" y="19" width="156" height="14" fill={awayColor} />

      <rect class="pb-frame" x="540" y="12" width="170" height="92" rx="3" />
      <rect class="pb-inner-fill" x="547" y="19" width="156" height="78" rx="1" />
      <rect x="547" y="19" width="156" height="14" fill={homeColor} />
    </g>

    <!-- Rink (translated below penalty boxes) -->
    <g transform="translate(0, 110)">
      <rect class="boards" x="0" y="0" width="1060" height="600" rx="150" />
      <rect class="ice" x="8" y="8" width="1044" height="584" rx="144" />

      <!-- Goal lines -->
      <line class="goal-line" x1="82" y1="18" x2="82" y2="582" />
      <line class="goal-line" x1="978" y1="18" x2="978" y2="582" />

      <!-- Blue lines -->
      <line class="blue-line" x1="307" y1="8" x2="307" y2="592" />
      <line class="blue-line" x1="753" y1="8" x2="753" y2="592" />

      <!-- Center line (dashed, NHL modern style) -->
      <line class="center-line" x1="530" y1="8" x2="530" y2="592" stroke-dasharray="28 14" />

      <!-- Goal creases -->
      <path class="crease" d="M 82 265 A 35 35 0 0 1 82 335 Z" />
      <path class="crease" d="M 978 265 A 35 35 0 0 0 978 335 Z" />

      <!-- Center faceoff -->
      <circle class="ring-blue" cx="530" cy="300" r="100" />

      <!-- Center ice logo -->
      {#if homeLogo}
        <image
          href={homeLogo}
          x="440" y="210"
          width="180" height="180"
          opacity="0.25"
          preserveAspectRatio="xMidYMid meet"
        />
      {/if}

      <circle class="dot-blue" cx="530" cy="300" r="6" />

      <!-- End-zone faceoff circles + hashmarks -->
      {#each endZoneFaceoffs as { cx, cy } (`${cx}-${cy}`)}
        <circle class="ring-red" {cx} {cy} r="80" />
        <circle class="dot-red" {cx} {cy} r="5" />
        <g class="hashmarks">
          <line x1={cx - 22} y1={cy - 80} x2={cx - 22} y2={cy - 95} />
          <line x1={cx + 22} y1={cy - 80} x2={cx + 22} y2={cy - 95} />
          <line x1={cx - 22} y1={cy + 80} x2={cx - 22} y2={cy + 95} />
          <line x1={cx + 22} y1={cy + 80} x2={cx + 22} y2={cy + 95} />
        </g>
      {/each}

      <!-- Neutral-zone dots -->
      {#each neutralDots as { cx, cy } (`${cx}-${cy}`)}
        <circle class="dot-red" {cx} {cy} r="7" />
      {/each}

      <!-- Goalie trapezoids (behind each net) -->
      <g class="trapezoid-group">
        <line class="trapezoid" x1="82" y1="272" x2="10" y2="237" />
        <line class="trapezoid" x1="82" y1="328" x2="10" y2="363" />
        <line class="trapezoid" x1="978" y1="272" x2="1050" y2="237" />
        <line class="trapezoid" x1="978" y1="328" x2="1050" y2="363" />
      </g>

      <!-- Nets: trapezoidal from above, with mesh fill -->
      <polyline class="net" points="82,275 60,285 60,315 82,325" />
      <polyline class="net" points="978,275 1000,285 1000,315 978,325" />
    </g>
  </svg>

  <!-- Overlay: penalty box labels, content slots, and user-provided children -->
  <div class="rink-overlay">
    <div class="pb-inner pb-inner--away">
      <div class="pb-team-label">{awayTeam}</div>
      <div class="pb-content">
        {#if awayBox}
          {@render awayBox()}
        {:else}
          <span class="pb-placeholder">PENALTY BOX</span>
        {/if}
      </div>
    </div>

    <div class="pb-inner pb-inner--home">
      <div class="pb-team-label">{homeTeam}</div>
      <div class="pb-content">
        {#if homeBox}
          {@render homeBox()}
        {:else}
          <span class="pb-placeholder">PENALTY BOX</span>
        {/if}
      </div>
    </div>

    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .hockey-rink {
    /* All tokens are fall-through defaults — override from a parent or :root */
    --rink-boards: var(--snes-boards, #1e293b);
    --rink-ice: var(--snes-ice, #e8f0f5);
    --rink-red: var(--snes-red, #dc2626);
    --rink-blue: var(--snes-blue, #1e40af);
    --rink-crease: var(--snes-crease, #93c5fd);
    --rink-accent: var(--snes-accent, #fbbf24);

    container-type: inline-size;
    position: relative;
    width: 100%;
    max-width: var(--rink-max-width, 1200px);
    aspect-ratio: 1060 / 720;
    margin: 0 auto;
    font-family: var(--font-retro, 'Courier New', ui-monospace, monospace);
  }

  .rink-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .rink-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .rink-overlay > :global(*) {
    pointer-events: auto;
  }

  /* ===== Penalty box SVG fills ===== */
  .pb-frame {
    fill: var(--rink-boards);
    stroke: var(--rink-accent);
    stroke-width: 3;
  }
  .pb-inner-fill { fill: var(--rink-ice); }

  /* ===== Rink SVG fills / strokes ===== */
  .boards { fill: var(--rink-boards); }
  .ice { fill: var(--rink-ice); }

  .goal-line { stroke: var(--rink-red); stroke-width: 2; }
  .blue-line { stroke: var(--rink-blue); stroke-width: 10; }
  .center-line { stroke: var(--rink-red); stroke-width: 10; }

  .crease {
    fill: var(--rink-crease);
    stroke: var(--rink-red);
    stroke-width: 2;
  }

  .ring-blue { fill: none; stroke: var(--rink-blue); stroke-width: 2; }
  .ring-red  { fill: none; stroke: var(--rink-red);  stroke-width: 2; }
  .dot-blue  { fill: var(--rink-blue); }
  .dot-red   { fill: var(--rink-red);  }
  .hashmarks line { stroke: var(--rink-red); stroke-width: 2; }

  .trapezoid {
    stroke: var(--rink-red);
    stroke-width: 2;
    fill: none;
  }

  .net {
    fill: url(#netMesh);
    stroke: var(--rink-red);
    stroke-width: 3;
    stroke-linejoin: miter;
  }

  .mesh-bg {
    fill: var(--rink-ice);
    fill-opacity: 0.55;
  }
  .mesh-line {
    fill: none;
    stroke: var(--rink-red);
    stroke-opacity: 0.5;
    stroke-width: 0.6;
  }

  /* ===== Penalty box HTML overlay ===== */
  .pb-inner {
    position: absolute;
    top: calc(19 / 720 * 100%);
    height: calc(78 / 720 * 100%);
    width: calc(156 / 1060 * 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .pb-inner--away { left: calc(357 / 1060 * 100%); }
  .pb-inner--home { left: calc(547 / 1060 * 100%); }

  .pb-team-label {
    flex: 0 0 18%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 900;
    font-size: clamp(9px, 1.3cqw, 16px);
    letter-spacing: 0.2em;
  }

  .pb-content {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 3px 4px;
  }

  .pb-placeholder {
    color: var(--rink-boards);
    opacity: 0.45;
    font-weight: 700;
    font-size: clamp(7px, 0.95cqw, 11px);
    letter-spacing: 0.2em;
  }
</style>
