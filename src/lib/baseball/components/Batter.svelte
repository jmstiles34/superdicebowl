<script lang="ts">
// ── Batter.svelte ─────────────────────────────────────────────────────────────
// Pixel-art batter sprite. 10×12 grid at 3px/pixel = 30×36px SVG.
// Side-profile facing home plate; LH batter is scaleX(-1) mirror.
//
// Prop:    hand: BatterHand ('rh' | 'lh')
// Exposes: swing() — plays the bat swing animation once

  import type { BatterHand } from '$lib/baseball/types';
  let { hand = 'rh' }: { hand?: BatterHand } = $props();

  let swinging = $state(false);

  export function swing(): void {
    swinging = false;
    // Force reflow so the animation restarts if called twice quickly
    void document.querySelector('.batter')?.getBoundingClientRect();
    swinging = true;
    setTimeout(() => { swinging = false; }, 300);
  }
</script>

<div class="batter" class:lh={hand === 'lh'}>
  <svg
    class="batter-svg"
    width="30" height="36" viewBox="0 0 30 36"
    aria-label="Batter"
  >
    <!-- Bat -->
    <g class="b-bat" class:swinging>
      <rect x="24" y="0" width="3" height="3" fill="#a06820"/>
      <rect x="27" y="0" width="3" height="3" fill="#7a4810"/>
      <rect x="27" y="3" width="3" height="3" fill="#7a4810"/>
      <rect x="27" y="6" width="3" height="3" fill="#7a4810"/>
      <rect x="24" y="9" width="3" height="3" fill="#7a4810"/>
      <rect x="18" y="9" width="3" height="3" fill="#1a1a1a"/>
      <rect x="21" y="9" width="3" height="3" fill="#1a1a1a"/>
    </g>
    <!-- Body -->
    <g class="b-body">
      <!-- Helmet -->
      <rect x="3"  y="0"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="6"  y="0"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="9"  y="0"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="12" y="0"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="0"  y="3"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="3"  y="3"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="6"  y="3"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="9"  y="3"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="12" y="3"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="15" y="3"  width="3" height="3" fill="#2547b0"/>
      <!-- Face -->
      <rect x="3"  y="6"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="6"  y="6"  width="3" height="3" fill="#1a3a8a"/>
      <rect x="9"  y="6"  width="3" height="3" fill="#d4956a"/>
      <rect x="12" y="6"  width="3" height="3" fill="#d4956a"/>
      <rect x="9"  y="9"  width="3" height="3" fill="#d4956a"/>
      <rect x="12" y="9"  width="3" height="3" fill="#d4956a"/>
      <!-- Jersey -->
      <rect x="0"  y="12" width="3" height="3" fill="#eeeeee"/>
      <rect x="3"  y="12" width="3" height="3" fill="#eeeeee"/>
      <rect x="6"  y="12" width="3" height="3" fill="#eeeeee"/>
      <rect x="9"  y="12" width="3" height="3" fill="#eeeeee"/>
      <rect x="12" y="12" width="3" height="3" fill="#eeeeee"/>
      <rect x="3"  y="15" width="3" height="3" fill="#cccccc"/>
      <rect x="6"  y="15" width="3" height="3" fill="#eeeeee"/>
      <rect x="9"  y="15" width="3" height="3" fill="#eeeeee"/>
      <rect x="12" y="15" width="3" height="3" fill="#eeeeee"/>
      <rect x="6"  y="18" width="3" height="3" fill="#eeeeee"/>
      <rect x="9"  y="18" width="3" height="3" fill="#eeeeee"/>
      <!-- Pants -->
      <rect x="6"  y="21" width="3" height="3" fill="#1a2060"/>
      <rect x="9"  y="21" width="3" height="3" fill="#1a2060"/>
      <rect x="3"  y="24" width="3" height="3" fill="#1a2060"/>
      <rect x="6"  y="24" width="3" height="3" fill="#1a2060"/>
      <rect x="15" y="24" width="3" height="3" fill="#1a2060"/>
      <rect x="3"  y="27" width="3" height="3" fill="#1a2060"/>
      <rect x="6"  y="27" width="3" height="3" fill="#1a2060"/>
      <rect x="15" y="27" width="3" height="3" fill="#1a2060"/>
      <!-- Shoes -->
      <rect x="3"  y="30" width="3" height="3" fill="#111111"/>
      <rect x="15" y="30" width="3" height="3" fill="#111111"/>
      <rect x="3"  y="33" width="3" height="3" fill="#111111"/>
      <rect x="15" y="33" width="3" height="3" fill="#111111"/>
    </g>
  </svg>
</div>

<style>
  .batter {
    position: absolute;
    top: 664px; left: 460px;
    z-index: 150;
  }
  .batter.lh {
    left: 490px;
    transform: scaleX(-1);
  }

  .batter-svg {
    overflow: visible;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,.8));
    animation: batter-idle 2s ease-in-out infinite;
  }
  @keyframes batter-idle {
    0%,100%{ transform: translateX(0); }
    33%    { transform: translateX(-1px) translateY(-1px); }
    66%    { transform: translateX(.5px); }
  }

  /* Bat: idle waggle */
  .b-bat {
    transform-origin: 21px 10px;
    animation: bat-waggle 1.5s ease-in-out infinite;
  }
  @keyframes bat-waggle {
    0%,100%{ transform: rotate(-9deg); }
    50%    { transform: rotate(8deg);  }
  }

  /* Bat: override with swing when .swinging is applied */
  .b-bat.swinging {
    animation: bat-swing .22s ease-in forwards;
  }
  @keyframes bat-swing {
    0%  { transform: rotate(-9deg); }
    100%{ transform: rotate(-80deg) translateX(-6px); }
  }
</style>
