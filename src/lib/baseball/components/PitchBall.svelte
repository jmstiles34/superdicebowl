<script lang="ts">
// ── PitchBall.svelte ──────────────────────────────────────────────────────────
// Baseball that travels from the pitcher's plate to home plate.
// Positioned in #stadium local space so the existing perspective tilt
// automatically handles the visual foreshortening.
//
// Start:  pitcher's plate centre → (490, 461) in #stadium space
//         ball 10×10 → top:456 left:485
// End:    home plate centre      → (492, 682) in #stadium space
//         translate(2px, 221px)
//
// Exposed: throwPitch(onArrive?) — guard prevents re-entry while in flight

  let ballEl: HTMLDivElement;

  export function throwPitch(onArrive?: () => void): void {
    if (ballEl.dataset.flying === '1') return;
    ballEl.dataset.flying = '1';

    // Restart animation cleanly: remove class → force reflow → re-add
    ballEl.classList.remove('pitching');
    void ballEl.offsetWidth;
    ballEl.classList.add('pitching');

    ballEl.addEventListener('animationend', () => {
      ballEl.classList.remove('pitching');
      ballEl.dataset.flying = '0';
      onArrive?.();
    }, { once: true });
  }
</script>

<div class="pitch-ball" bind:this={ballEl}>
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <circle cx="5" cy="5" r="4.5" fill="#f5f0e5" stroke="#c8c0a8" stroke-width=".6"/>
    <path d="M 2.5 1.5 Q 1.5 5 2.5 8.5" stroke="#c03838" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M 7.5 1.5 Q 8.5 5 7.5 8.5" stroke="#c03838" stroke-width="1" fill="none" stroke-linecap="round"/>
  </svg>
</div>

<style>
  /* ── Pitch ball ──
     z:500 — above runners (160) and batter (150), below UI chrome (700+).
     opacity:0 at rest; animation sets it to 1 and fades at the plate. */
  .pitch-ball {
    position: absolute;
    top: 456px; left: 485px;
    width: 10px; height: 10px;
    z-index: 500;
    pointer-events: none;
    opacity: 0;
    filter: drop-shadow(0 0 5px rgba(255,255,255,.85));
  }

  :global(.pitch-ball.pitching) {
    animation: pitch-fly .65s cubic-bezier(.2,0,.9,1) forwards;
  }

  /* Five stops shape the acceleration feel:
     0%  — slow off the rubber
     18% — accelerating through the mound cone
     65% — peak velocity crossing the infield
     90% — arriving in the zone, slightly larger (closer to viewer)
    100% — at the plate, fades out                                        */
  @keyframes pitch-fly {
    0%  { opacity:1; transform: translate(0,0)       scale(.85); }
    18% { opacity:1; transform: translate(0,40px)    scale(.9);  }
    65% { opacity:1; transform: translate(1px,144px) scale(1.0); }
    90% { opacity:1; transform: translate(2px,199px) scale(1.08);}
    100%{ opacity:0; transform: translate(2px,221px) scale(1.1); }
  }
</style>
