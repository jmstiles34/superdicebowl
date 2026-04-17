<script lang="ts">
// ── HitResult.svelte ──────────────────────────────────────────────────────────
// Flat overlay text that flashes the hit result (SINGLE!, HOME RUN!, etc.).
// Lives in #gs space (outside #stadium perspective) so it renders without tilt.
//
// Exposed: show(label) — triggers the pop-and-fade animation

  let label  = $state('');
  let active = $state(false);

  export function show(text: string): void {
    label  = text;
    active = false;
    // One microtask gap so toggling false→true restarts the animation
    requestAnimationFrame(() => { active = true; });
  }
</script>

{#if active}
  <div
    class="hit-result"
    onanimationend={() => { active = false; }}
  >
    {label}
  </div>
{/if}

<style>
  .hit-result {
    position: absolute;
    top: 430px; left: 450px;
    transform: translateX(-50%);
    z-index: 700;
    font-size: 22px;
    color: var(--color-text-gold);
    text-shadow:
       3px  3px 0 oklch(0 0 0),
      -1px -1px 0 oklch(0 0 0),
       1px -1px 0 oklch(0 0 0),
      -1px  1px 0 oklch(0 0 0),
       0    0  18px oklch(0.8272 0.1711 80.53 / 0.9);
    white-space: nowrap;
    pointer-events: none;
    animation: result-pop .9s ease-out forwards;
  }

  @keyframes result-pop {
    0%  { opacity:1; transform: translateX(-50%) scale(.65); }
    22% { opacity:1; transform: translateX(-50%) scale(1.12); }
    60% { opacity:1; transform: translateX(-50%) scale(1.0);  }
    100%{ opacity:0; transform: translateX(-50%) scale(.85);  }
  }
</style>
