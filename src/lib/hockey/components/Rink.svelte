<script module lang="ts">
  /**
   * Convert rink-relative percentages (0–100) to CSS position values for overlay children.
   * Center ice is rinkCoords(50, 50). Top of rink is y=0, bottom is y=100.
   *
   * The full component viewBox is 1060×620, with the rink occupying y=10..610.
   */
  export function rinkCoords(xPct: number, yPct: number) {
    return {
      left: `${xPct}%`,
      top: `${((10 + (yPct / 100) * 600) / 620) * 100}%`
    };
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    homeLogo?: string;
    children?: Snippet;
  }

  let {
    homeLogo,
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
    viewBox="0 0 1060 620"
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

    <!-- Rink -->
    <g>
      <rect class="boards" x="0" y="0" width="1060" height="600" rx="150" />
      <rect class="ring" x="8" y="8" width="1044" height="584" rx="144" />
      <rect class="ice" x="10" y="10" width="1040" height="580" rx="142" />

      <!-- Goal lines -->
      <line class="goal-line" x1="82" y1="26" x2="82" y2="574" />
      <line class="goal-line" x1="978" y1="26" x2="978" y2="574" />

      <!-- Blue lines -->
      <line class="blue-line" x1="307" y1="8" x2="307" y2="592" />
      <line class="blue-line" x1="753" y1="8" x2="753" y2="592" />

      <!-- Center line (dashed, NHL modern style) -->
      <line class="center-line" x1="530" y1="8" x2="530" y2="286" />
      <line class="center-line" x1="530" y1="316" x2="530" y2="592" />

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
          opacity="0.35"
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

          <polyline class="bracket" points="{cx-25},{cy-8} {cx-8},{cy-8} {cx-8},{cy-18}" />
          <polyline class="bracket" points="{cx-25},{cy+8} {cx-8},{cy+8} {cx-8},{cy+18}" />
          <polyline class="bracket" points="{cx+8},{cy-18} {cx+8},{cy-8} {cx+25},{cy-8}" />
          <polyline class="bracket" points="{cx+8},{cy+18} {cx+8},{cy+8} {cx+25},{cy+8}" />
        </g>
      {/each}

      <!-- Neutral-zone dots -->
      {#each neutralDots as { cx, cy } (`${cx}-${cy}`)}
        <circle class="dot-red" {cx} {cy} r="7" />
      {/each}

      <!-- Goalie trapezoids (behind each net) -->
      <g class="trapezoid-group">
        <line class="trapezoid" x1="82" y1="242" x2="10" y2="207" />
        <line class="trapezoid" x1="82" y1="358" x2="10" y2="393" />
        <line class="trapezoid" x1="978" y1="242" x2="1050" y2="207" />
        <line class="trapezoid" x1="978" y1="358" x2="1050" y2="393" />
      </g>

      <!-- Nets: trapezoidal from above, with mesh fill -->
      <polyline class="net" points="82,272 60,282 60,318 82,328" />
      <polyline class="net" points="978,272 1000,282 1000,318 978,328" />
    </g>
  </svg>

  <!-- Overlay for user-provided children -->
  <div class="rink-overlay">
    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .hockey-rink {
    /* All tokens are fall-through defaults — override from a parent or :root */
    --rink-boards: var(--snes-boards, #cbe8f7);
    --rink-ice: var(--snes-ice, #e8f0f5);
    --rink-red: var(--snes-red, #dc2626);
    --rink-blue: var(--snes-blue, #1e40af);
    --rink-crease: var(--snes-crease, #93c5fd);
    --rink-accent: var(--snes-accent, #fbbf24);

    container-type: inline-size;
    position: relative;
    width: 100%;
    max-width: var(--rink-max-width, 1200px);
    aspect-ratio: 1060 / 620;
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

  /* ===== Rink SVG fills / strokes ===== */
  .boards { fill: var(--rink-boards); }
  .ice { fill: var(--rink-ice); }
  .ring { fill: var(--rink-red); }

  .goal-line { stroke: var(--rink-red); stroke-width: 2; }
  .blue-line { stroke: var(--rink-blue); stroke-width: 10; }
  .center-line { stroke: var(--rink-red); stroke-width: 8; }

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
  .bracket { stroke: var(--rink-red); stroke-width: 2; fill:none }

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

</style>
