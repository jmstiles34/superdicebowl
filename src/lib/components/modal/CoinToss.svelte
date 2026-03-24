<script lang="ts">
	import { randomNumber, sleep } from '$lib/utils/common';
	import { NOOP, TEAM } from '$lib/constants/constants';
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

<h3>Coin Toss for Possession</h3>

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
					class="helmetLogo"
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
					class="helmetLogo"
					src={`/logos/${awayTeam.fieldLogo}.webp`}
				/>
			</picture>
		</div>
	</div>
</div>

<style>
	#coin {
		position: relative;
		margin: 0 auto;
		width: 7rem;
		height: 7rem;
		cursor: pointer;
	}
	#coin div {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		box-shadow:
			inset 0 0 45px rgba(255, 255, 255, 0.3),
			0 12px 20px -10px rgba(0, 0, 0, 0.4);
	}
	h3 {
		color: var(--color-offblack);
		text-align: center;
	}
	.helmetLogo {
		height: 5.5rem;
		width: 5.5rem;
	}
	#coin {
		transition: transform 1s ease-in;
		transform-style: preserve-3d;
	}
	#coin div {
		position: absolute;
		backface-visibility: hidden;
	}
	.side-home {
		z-index: 100;
	}
	.side-away {
		transform: rotateY(-180deg);
	}

	#coin.Home {
		animation: flipHeads 3.3s ease-out forwards;
	}
	#coin.Away {
		animation: flipTails 3.3s ease-out forwards;
	}

	@keyframes flipHeads {
		from {
			transform: rotateY(0);
		}
		to {
			transform: rotateY(1800deg);
		}
	}
	@keyframes flipTails {
		from {
			transform: rotateY(0);
		}
		to {
			transform: rotateY(1980deg);
		}
	}
</style>
