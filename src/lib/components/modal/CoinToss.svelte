<script lang="ts">
	import { randomNumber, sleep } from '$lib/utils/common';
	import { TEAM } from '$lib/constants/constants';
	import coinSpin from '$lib/assets/sfx/coin-spin.mp3';
	import { settings } from '$lib/state/settings.svelte';
	import type { Howl } from 'howler';
	import { createSound, playSound } from '$lib/utils/sound';

	let { saveCoinToss }: { saveCoinToss: (a: string) => void } = $props();

	const { awayTeam, homeTeam, volume } = settings;
	const coinSpinSfx: Howl = createSound(coinSpin);
	let winStyle: string | undefined = $state();

	const handleCoinToss = async () => {
		if (winStyle) return;
		winStyle = randomNumber() === 0 ? TEAM.HOME : TEAM.AWAY;
		playSound(coinSpinSfx, volume);
		await sleep(4000);
		saveCoinToss(winStyle);
	};

	const handleCoinKeydown = (e: KeyboardEvent) => {
		if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
		handleCoinToss();
	};
</script>

<h3>Coin Toss</h3>
<p class="subtitle" class:hidden={!!winStyle}>Tap to flip for possession</p>

<div class="game-mode">
	<div
		id="coin"
		class={winStyle}
		onclick={handleCoinToss}
		onkeydown={handleCoinKeydown}
		role="button"
		tabindex="0"
	>
		<div
			class="side-home"
			style={`
				background-color: ${homeTeam.colors.primary};
				border: 1px solid ${homeTeam.colors.secondary};
			`}
		>
			<picture>
				<source type="image/avif" srcset={`/logos/${homeTeam.fieldLogo}.avif`} />
				<img
					alt={`${homeTeam.city} ${homeTeam.name} Logo`}
					class="helmet-logo"
					src={`/logos/${homeTeam.fieldLogo}.webp`}
				/>
			</picture>
		</div>
		<div
			class="side-away"
			style={`
				background-color: ${awayTeam.colors.primary};
				border: 1px solid ${awayTeam.colors.secondary};
			`}
		>
			<picture>
				<source type="image/avif" srcset={`/logos/${awayTeam.fieldLogo}.avif`} />
				<img
					alt={`${awayTeam.city} ${awayTeam.name} Logo`}
					class="helmet-logo"
					src={`/logos/${awayTeam.fieldLogo}.webp`}
				/>
			</picture>
		</div>
	</div>
</div>

<style>
	/* ── Title ────────────────────────────────────────────────── */
	h3 {
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		text-shadow: var(--text-shadow-display);
		color: var(--modal-header-text);
		text-align: center;
		margin: 0 0 var(--space-1) 0;
	}

	.subtitle {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 0 0 var(--space-5) 0;
		transition: opacity var(--dur-base) var(--ease-snes);
	}

	.subtitle.hidden {
		opacity: 0;
	}

	/* ── Coin container ───────────────────────────────────────── */
	#coin {
		position: relative;
		margin: 0 auto;
		width: 7rem;
		height: 7rem;
		cursor: pointer;
		filter: drop-shadow(4px 4px 0 var(--brand-950));
	}

	#coin:not(.Home):not(.Away):hover {
		filter: drop-shadow(4px 4px 0 var(--brand-900))
		        drop-shadow(0 0 12px rgba(64, 96, 240, 0.5));
	}

	/* ── Coin faces ───────────────────────────────────────────── */
	#coin div {
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		box-shadow:
			inset 0 0 32px rgba(255, 255, 255, 0.25),
			inset 0 -6px 12px rgba(0, 0, 0, 0.3),
			0 8px 16px -6px rgba(0, 0, 0, 0.5);
	}

	.side-away {
		display: none;
	}

	.helmet-logo {
		height: 4rem;
		width: 4rem;
		object-fit: contain;
	}

	/* ── Flip animation ──────────────────────────────────────
	   Uses scaleX to squish the coin at each half-turn.
	   Visibility swaps at the zero-width point so you see
	   alternating logos. No preserve-3d needed.

	   Each "turn" = scaleX goes 1 → 0 → 1.
	   Home visible when scaleX expanding from 0 on even turns.
	   Away visible when scaleX expanding from 0 on odd turns.

	   Heads (home wins) = 8 turns, ends on home face.
	   Tails (away wins) = 9 turns, ends on away face.
	   Turns slow down toward the end for a natural deceleration.
	────────────────────────────────────────────────────────── */

	/* Container scaleX — same for both outcomes, 9 squish points */
	@keyframes coinFlip {
		0%      { transform: scaleX(1); }
		5.5%    { transform: scaleX(0); }  /* 1 */
		11%     { transform: scaleX(1); }
		16.5%   { transform: scaleX(0); }  /* 2 */
		22%     { transform: scaleX(1); }
		27.5%   { transform: scaleX(0); }  /* 3 */
		33%     { transform: scaleX(1); }
		38.5%   { transform: scaleX(0); }  /* 4 */
		44%     { transform: scaleX(1); }
		49.5%   { transform: scaleX(0); }  /* 5 */
		55%     { transform: scaleX(1); }
		61%     { transform: scaleX(0); }  /* 6 */
		68%     { transform: scaleX(1); }
		75%     { transform: scaleX(0); }  /* 7 */
		83%     { transform: scaleX(1); }
		91%     { transform: scaleX(0); }  /* 8 */
		100%    { transform: scaleX(1); }
	}

	#coin.Home,
	#coin.Away {
		animation: coinFlip 3.3s ease-out forwards;
	}

	/* ── Face visibility: home ────────────────────────────── */
	/* Visible at start, hidden at squish 1, visible at 2, etc.
	   8 squishes = ends visible → home wins */
	@keyframes showHome {
		0%      { visibility: visible; }
		5.5%    { visibility: hidden; }
		16.5%   { visibility: visible; }
		27.5%   { visibility: hidden; }
		38.5%   { visibility: visible; }
		49.5%   { visibility: hidden; }
		61%     { visibility: visible; }
		75%     { visibility: hidden; }
		91%     { visibility: visible; }
		100%    { visibility: visible; }
	}

	@keyframes hideHome {
		0%      { visibility: visible; }
		5.5%    { visibility: hidden; }
		16.5%   { visibility: visible; }
		27.5%   { visibility: hidden; }
		38.5%   { visibility: visible; }
		49.5%   { visibility: hidden; }
		61%     { visibility: visible; }
		75%     { visibility: hidden; }
		91%     { visibility: visible; }
		91.01%  { visibility: hidden; }
		100%    { visibility: hidden; }
	}

	/* ── Face visibility: away ────────────────────────────── */
	@keyframes showAway {
		0%      { visibility: hidden; }
		5.5%    { visibility: visible; }
		16.5%   { visibility: hidden; }
		27.5%   { visibility: visible; }
		38.5%   { visibility: hidden; }
		49.5%   { visibility: visible; }
		61%     { visibility: hidden; }
		75%     { visibility: visible; }
		91%     { visibility: hidden; }
		100%    { visibility: hidden; }
	}

	@keyframes revealAway {
		0%      { visibility: hidden; }
		5.5%    { visibility: visible; }
		16.5%   { visibility: hidden; }
		27.5%   { visibility: visible; }
		38.5%   { visibility: hidden; }
		49.5%   { visibility: visible; }
		61%     { visibility: hidden; }
		75%     { visibility: visible; }
		91%     { visibility: hidden; }
		91.01%  { visibility: visible; }
		100%    { visibility: visible; }
	}

	/* Home wins — home face ends visible */
	#coin.Home .side-home { animation: showHome 3.3s step-end forwards; }
	#coin.Home .side-away { display: flex; animation: showAway 3.3s step-end forwards; }

	/* Away wins — away face ends visible */
	#coin.Away .side-home { animation: hideHome 3.3s step-end forwards; }
	#coin.Away .side-away { display: flex; animation: revealAway 3.3s step-end forwards; }
</style>
