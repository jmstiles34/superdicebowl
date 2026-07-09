<script lang="ts">
	import ballAvif from '$lib/images/balls/soccer-ball-02.avif';
	import ballWebp from '$lib/images/balls/soccer-ball-02.webp';
	import cleatAvif from '$lib/images/golden-boot.avif';
	import cleatWebp from '$lib/images/golden-boot.webp';
	import whistleIcon from '$lib/images/whistle.svg';
	import redCardIcon from '$lib/images/red-card.svg';
	import { SOCCER_SYMBOL } from '$lib/soccer/constants';
	import type { SoccerSymbol } from '$lib/soccer/types';

	let { symbol }: { symbol: SoccerSymbol } = $props();

	const ICONS: Record<SoccerSymbol, string> = {
		[SOCCER_SYMBOL.BALL]: ballWebp,
		[SOCCER_SYMBOL.KICK]: cleatWebp,
		[SOCCER_SYMBOL.PENALTY]: whistleIcon,
		[SOCCER_SYMBOL.RED_CARD]: redCardIcon
	};

	const LABELS: Record<SoccerSymbol, string> = {
		[SOCCER_SYMBOL.BALL]: 'Ball Move',
		[SOCCER_SYMBOL.KICK]: 'Kick',
		[SOCCER_SYMBOL.PENALTY]: 'Penalty',
		[SOCCER_SYMBOL.RED_CARD]: 'Red Card'
	};
</script>

{#if symbol === SOCCER_SYMBOL.BALL}
	<picture class="symbol-pic">
		<source srcset={ballAvif} type="image/avif" />
		<img class="symbol-icon" src={ballWebp} alt={LABELS[symbol]} />
	</picture>
{:else if symbol === SOCCER_SYMBOL.KICK}
	<picture class="symbol-pic">
		<source srcset={cleatAvif} type="image/avif" />
		<img class="symbol-icon" src={cleatWebp} alt={LABELS[symbol]} />
	</picture>
{:else}
	<img class="symbol-icon" src={ICONS[symbol]} alt={LABELS[symbol]} />
{/if}

<style>
	.symbol-pic {
		width: 100%;
		height: 100%;
		display: block;
	}

	.symbol-icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}
</style>
