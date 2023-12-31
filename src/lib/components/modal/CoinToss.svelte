<script lang="ts">
	import { randomNumber, sleep } from '$lib/utils/common';
	import { NOOP, TEAM } from '$lib/constants/constants';
	import { Sound } from 'svelte-sound';
	import coinSpin from '$lib/assets/sfx/coin-spin.mp3';
	import { settings } from '$lib/stores/Settings';

	const { awayTeam, homeTeam, volume } = $settings;
	export let saveCoinToss: (a: string) => void;
	let winStyle: string;
	$: coinSpinSfx = new Sound(coinSpin, { volume });

	async function handleCoinToss(num: number) {
		winStyle = num === 0 ? TEAM.HOME : TEAM.AWAY;
		coinSpinSfx.play();
		await sleep(4000);
		saveCoinToss(winStyle);
	}
</script>

<h3>Coin Toss for Possession</h3>

<div class="game-mode">
	<div
		id="coin"
		class={winStyle}
		on:click={winStyle ? NOOP : () => handleCoinToss(randomNumber())}
		on:keydown={winStyle ? NOOP : () => handleCoinToss(randomNumber())}
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
					class={`helmetLogo`}
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
					class={`helmetLogo`}
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
		-webkit-border-radius: 50%;
		-moz-border-radius: 50%;
		border-radius: 50%;
		-webkit-box-shadow: inset 0 0 45px rgba(255, 255, 255, 0.3),
			0 12px 20px -10px rgba(0, 0, 0, 0.4);
		-moz-box-shadow: inset 0 0 45px rgba(255, 255, 255, 0.3), 0 12px 20px -10px rgba(0, 0, 0, 0.4);
		box-shadow: inset 0 0 45px rgba(255, 255, 255, 0.3), 0 12px 20px -10px rgba(0, 0, 0, 0.4);
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
		transition: -webkit-transform 1s ease-in;
		-webkit-transform-style: preserve-3d;
		transform-style: preserve-3d;
	}
	#coin div {
		position: absolute;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}
	.side-home {
		z-index: 100;
	}
	.side-away {
		-webkit-transform: rotateY(-180deg);
		transform: rotateY(-180deg);
	}

	#coin.Home {
		-webkit-animation: flipHeads 3.3s ease-out forwards;
		-moz-animation: flipHeads 3.3s ease-out forwards;
		-o-animation: flipHeads 3.3s ease-out forwards;
		animation: flipHeads 3.3s ease-out forwards;
	}
	#coin.Away {
		-webkit-animation: flipTails 3.3s ease-out forwards;
		-moz-animation: flipTails 3.3s ease-out forwards;
		-o-animation: flipTails 3.3s ease-out forwards;
		animation: flipTails 3.3s ease-out forwards;
	}

	@keyframes flipHeads {
		from {
			-webkit-transform: rotateY(0);
			-moz-transform: rotateY(0);
			transform: rotateY(0);
		}
		to {
			-webkit-transform: rotateY(1800deg);
			-moz-transform: rotateY(1800deg);
			transform: rotateY(1800deg);
		}
	}
	@keyframes flipTails {
		from {
			-webkit-transform: rotateY(0);
			-moz-transform: rotateY(0);
			transform: rotateY(0);
		}
		to {
			-webkit-transform: rotateY(1980deg);
			-moz-transform: rotateY(1980deg);
			transform: rotateY(1980deg);
		}
	}
</style>
