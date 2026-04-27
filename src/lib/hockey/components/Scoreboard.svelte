<script lang="ts">
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { game } from '$lib/hockey/state/game.svelte';

	let { toolbar }: { toolbar?: Snippet } = $props();
</script>

<div class="scoreboard">
	<div class="teams">
		<div class="team-row" class:active={game.possession === 'Away'}>
			<span class="possession-dot" class:visible={game.possession === 'Away'}></span>
			<span class="team-name" style:color={settings.awayTeam.colors.primary}>
				{settings.awayTeam.city} {settings.awayTeam.name}
			</span>
			{#if game.powerPlay && game.possession === 'Away'}
				<span class="power-play">PP</span>
			{/if}
			<span class="shots">SOG: {game.shotsOnGoal.away}</span>
			<span class="score">{game.scores.away}</span>
		</div>

		<div class="team-row" class:active={game.possession === 'Home'}>
			<span class="possession-dot" class:visible={game.possession === 'Home'}></span>
			<span class="team-name" style:color={settings.homeTeam.colors.primary}>
				{settings.homeTeam.city} {settings.homeTeam.name}
			</span>
			{#if game.powerPlay && game.possession === 'Home'}
				<span class="power-play">PP</span>
			{/if}
			<span class="shots">SOG: {game.shotsOnGoal.home}</span>
			<span class="score">{game.scores.home}</span>
		</div>
	</div>

	{#if toolbar}
		<div class="toolbar">
			{@render toolbar()}
		</div>
	{/if}
</div>

<style>
	.scoreboard { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) var(--space-5); background-color: var(--color-bg-elevated); border-bottom: 2px solid var(--color-border-default); }
	.teams { display: flex; flex-direction: column; gap: var(--space-2); }
	.team-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); transition: background-color var(--dur-fast) var(--ease-snes); }
	.team-row.active { background-color: var(--nav-bg-active); }
	.possession-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: transparent; flex-shrink: 0; transition: background-color var(--dur-fast) var(--ease-snes); }
	.possession-dot.visible { background-color: var(--color-text-gold); }
	.team-name { font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--weight-bold); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.power-play { font-family: var(--font-body); font-size: var(--text-xs); font-weight: var(--weight-bold); color: var(--color-text-gold); letter-spacing: var(--tracking-wider); text-transform: uppercase; padding: var(--space-1) var(--space-2); background-color: oklch(0.4 0.1 85); border-radius: var(--radius-sm); }
	.shots { font-family: var(--font-body); font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-tertiary); letter-spacing: var(--tracking-wider); text-transform: uppercase; white-space: nowrap; }
	.score { font-family: var(--font-numeric); font-size: var(--text-display-sm); font-weight: var(--weight-black); color: var(--color-text-primary); min-width: 2.5rem; text-align: right; }
	.toolbar { display: flex; justify-content: center; gap: var(--space-3); }
	@media (max-width: 780px) { .scoreboard { padding: var(--space-3) var(--space-3); } .team-name { font-size: var(--text-sm); } }
</style>
