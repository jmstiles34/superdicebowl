<script lang="ts">
// ── Controls.svelte ───────────────────────────────────────────────────────────
// Bottom control strip: MOW pattern | HIT type | PITCH button | BATTER hand | runners

  import { game } from '$lib/baseball/state/game.svelte';
  import type { BatterHand, MowPattern, SelectedHitType } from '$lib/baseball/types';

  let {
    hitType      = 'random',
    batterHand   = 'rh',
    mowPattern   = '',
    isPitching   = false,
    onPitch,
    onHitTypeChange,
    onBatterHandChange,
    onMowPatternChange,
    onAdvance,
    onClear,
  }: {
    hitType?:           SelectedHitType;
    batterHand?:        BatterHand;
    mowPattern?:        MowPattern;
    isPitching?:        boolean;
    onPitch?:           () => void;
    onHitTypeChange?:   (t: SelectedHitType) => void;
    onBatterHandChange?:(h: BatterHand)       => void;
    onMowPatternChange?:(p: MowPattern)       => void;
    onAdvance?:         () => void;
    onClear?:           () => void;
  } = $props();

  const MOW_OPTIONS: { value: MowPattern; label: string }[] = [
    { value: '',                 label: 'STRIPES' },
    { value: 'pat-wide-stripes', label: 'WIDE'    },
    { value: 'pat-cross-cut',    label: 'CROSS'   },
    { value: 'pat-radial',       label: 'RADIAL'  },
    { value: 'pat-diamond',      label: 'DIAMOND' },
    { value: 'pat-fan',          label: 'FAN'     },
  ];

  const HIT_OPTIONS: { value: SelectedHitType; label: string }[] = [
    { value: 'random',   label: '?'    },
    { value: 'grounder', label: 'GND'  },
    { value: 'liner',    label: 'LINE' },
    { value: 'flyball',  label: 'FLY'  },
    { value: 'homerun',  label: 'HR'   },
  ];
</script>

<div class="cp">

  <!-- MOW pattern -->
  <div class="cp-g">
    <span class="cp-lbl">MOW</span>
    <select
      class="snes-sel"
      value={mowPattern}
      onchange={e => onMowPatternChange?.(e.currentTarget.value as MowPattern)}
    >
      {#each MOW_OPTIONS as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>

  <!-- HIT type selector -->
  <div class="cp-g">
    <span class="cp-lbl">HIT</span>
    {#each HIT_OPTIONS as opt}
      <button
        class="snes-btn"
        class:active={hitType === opt.value}
        onclick={() => onHitTypeChange?.(opt.value)}
      >{opt.label}</button>
    {/each}
  </div>

  <!-- PITCH button -->
  <button
    class="pitch-btn"
    disabled={isPitching}
    onclick={onPitch}
  >PITCH</button>

  <!-- BATTER handedness -->
  <div class="cp-g">
    <span class="cp-lbl">BATTER</span>
    <button
      class="snes-btn"
      class:active={batterHand === 'rh'}
      onclick={() => onBatterHandChange?.('rh')}
    >RH</button>
    <button
      class="snes-btn"
      class:active={batterHand === 'lh'}
      onclick={() => onBatterHandChange?.('lh')}
    >LH</button>
  </div>

  <!-- Mini base diamond + runner controls -->
  <div class="cp-g">
    <div class="mini-d">
      <div class="mb" class:on={game.bases.second}></div>
      <div class="mini-row">
        <div class="mb" class:on={game.bases.third}></div>
        <div class="mb" class:on={game.bases.first}></div>
      </div>
    </div>
    <button class="snes-btn" onclick={onAdvance}>ADV</button>
    <button class="snes-btn" onclick={onClear}>CLR</button>
  </div>

</div>

<style>
  .cp {
    position: absolute;
    top: 980px; left: 4px; right: 4px; bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: var(--sdb-panel);
    border-top: 3px solid var(--sdb-bdr);
    z-index: 100;
    gap: 10px;
  }

  .cp-g   { display: flex; align-items: center; gap: 7px; }
  .cp-lbl { font-size: 6px; color: var(--sdb-gold); letter-spacing: 2px; white-space: nowrap; }

  .snes-sel {
    font-family: inherit;
    font-size: 7px;
    background: var(--sdb-dk);
    color: var(--sdb-wht);
    border: 2px solid var(--sdb-bdr);
    padding: 4px 7px;
    cursor: pointer;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .snes-btn {
    font-family: inherit;
    font-size: 6px;
    background: var(--sdb-dk);
    color: var(--sdb-dim);
    border: 2px solid var(--sdb-dim);
    padding: 4px 7px;
    cursor: pointer;
    outline: none;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .snes-btn.active { background: var(--sdb-bdr); color: var(--sdb-wht); border-color: var(--sdb-gold); }
  .snes-btn:hover:not(:disabled) { color: var(--sdb-wht); border-color: var(--sdb-bdr); }

  .pitch-btn {
    font-family: inherit;
    font-size: 9px;
    background: #0a1840;
    color: var(--sdb-gold);
    border: 2px solid var(--sdb-gold);
    padding: 7px 18px;
    cursor: pointer;
    outline: none;
    letter-spacing: 2px;
    box-shadow: 0 0 8px rgba(245,197,24,.25);
    transition: background .1s, box-shadow .1s;
  }
  .pitch-btn:hover:not(:disabled) { background: #1a3a8a; box-shadow: 0 0 14px rgba(245,197,24,.5); }
  .pitch-btn:disabled              { opacity: .4; cursor: not-allowed; box-shadow: none; }

  .mini-d     { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .mini-row   { display: flex; gap: 12px; }
  .mb {
    width: 9px; height: 9px;
    border: 2px solid var(--sdb-dim);
    transform: rotate(45deg);
    background: transparent;
    transition: background .15s, border-color .15s;
  }
  .mb.on { background: var(--sdb-gold); border-color: var(--sdb-gold); }
</style>
