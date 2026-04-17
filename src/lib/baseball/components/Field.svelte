<script lang="ts">
// ── Field.svelte ──────────────────────────────────────────────────────────────
// Renders all static field background elements inside #stadium.
// Dynamic elements (runners, batter, balls) are siblings in SuperDiceBowl.svelte.
//
// Prop: mowPattern — CSS class added to #stadium to select the grass cut pattern.
  import type { MowPattern } from '$lib/baseball/types';
  let { mowPattern = '' }: { mowPattern?: MowPattern } = $props();
</script>

<!-- Outfield / crowd -->
<div class="crowd-area"></div>
<div class="stadium-wall"></div>
<div class="warning-track"></div>
<div class="field mow"></div>

<!-- Infield -->
<div class="in-field"></div>
<div class="in-field-grass mow"></div>
<div class="batting-circle"></div>

<!-- Base lines (must precede home plate so foul lines don't cut through it) -->
<div class="base-lines"></div>

<!-- Pitcher -->
<div class="pitchers-mound"></div>
<div class="pitchers-plate"></div>

<!-- Half-circle dirt arcs at each base -->
<div class="half-circle third-circle"></div>
<div class="half-circle first-circle"></div>
<div class="half-circle second-circle"></div>

<!-- Home plate + batter's boxes -->
<div class="home-plate"></div>
<div class="batters-box batters-box-right"></div>
<div class="batters-box batters-box-left"></div>

<!-- First-base line extension past 1B -->
<div class="first-base-thing"></div>

<style>
  /* ── Field layers (z-index matches original design) ── */
  .crowd-area {
    position: absolute;
    top: -193px; left: 62px;
    height: 866px; width: 866px;
    border-radius: 1% 100% 1% 1%;
    transform: rotate(-45deg);
    background-color: #1c1c2e;
    background-image: radial-gradient(circle, rgba(70,70,150,.45) 1px, transparent 1px);
    background-size: 8px 8px;
    z-index: 10;
  }
  .stadium-wall {
    position: absolute;
    top: -158px; left: 97px;
    height: 796px; width: 796px;
    border-radius: 1% 100% 1% 1%;
    transform: rotate(-45deg);
    background-color: #1e3f7a;
    border: 3px solid #152c57;
    z-index: 20;
  }
  .warning-track {
    position: absolute;
    top: -138px; left: 117px;
    height: 756px; width: 756px;
    border-radius: 1% 100% 1% 1%;
    transform: rotate(-45deg);
    background-color: #b5703a;
    z-index: 30;
  }
  .field {
    position: absolute;
    top: -110px; left: 145px;
    height: 700px; width: 700px;
    border-radius: 1% 100% 1% 1%;
    border: 1px solid #2d7a2d;
    background-color: #3a9a1a;
    transform: rotate(-45deg);
    z-index: 40;
  }
  .in-field {
    position: absolute;
    top: 170px; left: 265px;
    height: 450px; width: 450px;
    border-radius: 1% 50% 1% 1%;
    border: 1px solid #836539;
    background-color: #836539;
    transform: rotate(-45deg);
    z-index: 50;
  }
  .in-field-grass {
    position: absolute;
    top: 330px; left: 359px;
    height: 260px; width: 260px;
    border: 2px solid #2d7a2d;
    background-color: #3a9a1a;
    transform: rotate(-45deg);
    z-index: 50;
  }
  .batting-circle {
    position: absolute;
    top: 634px; left: 440px;
    height: 100px; width: 100px;
    border-radius: 100%;
    transform: rotate(-45deg);
    border: 1px solid #836539;
    background-color: #836539;
    z-index: 100;
  }
  .base-lines {
    position: absolute;
    top: -120px; left: 155px;
    height: 670px; width: 670px;
    border-left: 2px solid rgba(255,255,255,.85);
    border-bottom: 2px solid rgba(255,255,255,.85);
    transform: rotate(-45deg);
    z-index: 100;
  }
  .pitchers-mound {
    position: absolute;
    top: 420px; left: 450px;
    height: 80px; width: 80px;
    border-radius: 100%;
    transform: rotate(-45deg);
    border: 1px solid #836539;
    background-color: #836539;
    z-index: 100;
  }
  .pitchers-plate {
    position: absolute;
    top: 458px; left: 482px;
    height: 5px; width: 16px;
    border: 1px solid white;
    background-color: white;
    z-index: 100;
  }
  .half-circle {
    position: absolute;
    height: 40px; width: 40px;
    transform: rotate(-45deg);
    border: 1px solid #836539;
    background-color: #836539;
    z-index: 100;
  }
  .third-circle  { top: 440px; left: 300px; border-radius: 1% 1% 100% 1%; }
  .first-circle  { top: 440px; left: 642px; border-radius: 100% 1% 1% 1%; }
  .second-circle { top: 275px; left: 470px; border-radius: 1% 1% 1% 100%; }

  .home-plate {
    position: absolute;
    height: 7px; width: 13px;
    top: 678px; left: 485px;
    border: 1.5px solid white;
    background-color: white;
    z-index: 100;
  }
  .home-plate::before {
    top: 100%;
    border: solid transparent;
    content: ' ';
    height: 0; width: 0;
    position: absolute;
    pointer-events: none;
    border-top-color: white;
    border-width: 8px;
    left: 50%;
    margin-left: -9.5px;
  }
  .batters-box {
    position: absolute;
    height: 25px; width: 15px;
    border: 2px solid white;
    background-color: #836539;
    top: 670px;
    z-index: 100;
  }
  .batters-box-right { box-shadow:  6px 0 #836539; left: 461px; }
  .batters-box-left  { box-shadow: -6px 0 #836539; left: 503px; }

  .first-base-thing {
    top: 430px; left: 667px;
    position: absolute;
    height: 170px; width: 13px;
    transform: rotate(45deg);
    border-right: 2px solid rgba(255,255,255,.85);
    border-bottom: 2px solid rgba(255,255,255,.85);
    z-index: 100;
  }

  /* ── Mow patterns (applied via class on parent #stadium) ── */
  :global(#stadium) .mow {
    background-image: linear-gradient(0deg, rgba(0,0,0,.13) 50%, transparent 50%);
    background-size: 130px 130px;
  }
  :global(#stadium.pat-wide-stripes) .mow {
    background-image: linear-gradient(0deg, rgba(0,0,0,.13) 50%, transparent 50%);
    background-size: 260px 260px;
  }
  :global(#stadium.pat-cross-cut) .mow {
    background-image:
      linear-gradient(90deg, rgba(0,0,0,.13) 50%, transparent 50%),
      linear-gradient(0deg,  rgba(0,0,0,.13) 50%, transparent 50%);
    background-size: 130px 130px;
  }
  :global(#stadium.pat-radial) .mow {
    background-image: repeating-radial-gradient(
      circle at 0% 100%,
      transparent 0, transparent 65px,
      rgba(0,0,0,.13) 65px, rgba(0,0,0,.13) 130px
    );
    background-size: 100% 100%;
  }
  :global(#stadium.pat-diamond) .mow {
    background-image:
      repeating-linear-gradient( 70deg, rgba(0,0,0,.14) 0, rgba(0,0,0,.14) 40px, transparent 40px, transparent 80px),
      repeating-linear-gradient(-70deg, rgba(0,0,0,.14) 0, rgba(0,0,0,.14) 40px, transparent 40px, transparent 80px);
  }
  :global(#stadium.pat-fan) .mow {
    background-image: repeating-conic-gradient(
      from 0deg at 0% 100%,
      rgba(0,0,0,.13) 0deg 12deg,
      transparent 12deg 24deg
    );
    background-size: 100% 100%;
  }
</style>
