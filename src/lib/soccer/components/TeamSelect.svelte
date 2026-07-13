<script lang="ts">
	import { DEFAULT_TEAM, DICE_COLORS } from '$lib/shared/constants';
	import { teamsData } from '$lib/soccer/data/data.json';
	import ballAvif from '$lib/images/balls/soccer-ball-02.avif';
	import ballWebp from '$lib/images/balls/soccer-ball-02.webp';
	import type { SaveTeam, Team } from '$lib/shared/types';
	import type { SoccerNation } from '$lib/soccer/types';
	import { pickRandom } from '$lib/utils/common';
	import { onMount } from 'svelte';

	type TeamSelectProps = {
		opponentId: string;
		saveTeam: SaveTeam;
		team: Team;
		teamType: string;
	};

	let { opponentId, saveTeam, team, teamType }: TeamSelectProps = $props();

	let selected = $derived(team.id);
	let diceColor: string = $state('');
	const nations = teamsData as SoccerNation[];

	// A nation maps onto the shared Team shape used by settings/persistence:
	// country → city, countryKey → cityKey, nickname → name.
	function toTeam(n: SoccerNation): Team {
		return {
			id: n.id,
			city: n.country,
			cityKey: n.countryKey,
			name: n.nickname,
			logo: n.logo,
			colors: n.colors
		};
	}

	onMount(() => {
		diceColor = pickRandom(DICE_COLORS) as string;
	});

	function handleTeamSelect(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		if (!value || value === '') {
			saveTeam(DEFAULT_TEAM);
		} else {
			const found = nations.find((n) => n.id === value);
			saveTeam(found ? toTeam(found) : DEFAULT_TEAM);
		}
	}

	function handleRandom() {
		const available = nations.filter((n) => n.id !== opponentId);
		const pick = available[Math.floor(Math.random() * available.length)];
		if (pick) saveTeam(toTeam(pick));
	}
</script>

<div class="team-select-card">
	<div class="team-type">{teamType}</div>

	<div
		class="logo-area"
		style:border-color={team.id ? (team.colors?.primary ?? 'var(--color-border-default)') : 'var(--color-border-default)'}
	>
		{#if team.id && team.logo}
			<img alt={`${team.city} ${team.name}`} src={`/flags/${team.logo}.svg`} />
		{:else if diceColor}
			<img class="dice-placeholder" alt={`${teamType} Team Placeholder`} src={`/images/dice-${diceColor}.svg`} />
		{/if}
	</div>

	<div class="team-name">
		{#if team.id}
			{team.city}
		{:else}
			Select a nation
		{/if}
	</div>

	<div class="controls">
		<select class="team-dropdown" value={selected} onchange={handleTeamSelect}>
			<option value="">-- Select --</option>
			{#each nations as n (n.id)}
				<option value={n.id} disabled={n.id === opponentId}>
					{n.country}
				</option>
			{/each}
		</select>

		<button class="random-button" onclick={handleRandom} aria-label={`Random ${teamType} Nation`}>
			<picture>
				<source srcset={ballAvif} type="image/avif" />
				<img alt={`Random ${teamType} Nation`} src={ballWebp} />
			</picture>
		</button>
	</div>
</div>

<style>
	.team-select-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); min-width: 14rem; }
	.team-type { font-family: var(--font-display); font-weight: var(--weight-black); font-style: italic; font-size: var(--text-display-sm); letter-spacing: var(--tracking-display); color: var(--color-text-tertiary); text-shadow: var(--text-shadow-display); text-transform: uppercase; }
	.logo-area { display: flex; align-items: center; justify-content: center; width: 12rem; height: 12rem; border-radius: var(--radius-md); border: 3px solid var(--color-border-default); overflow: hidden; background-color: var(--color-bg-surface); transition: border-color var(--dur-base) var(--ease-snes), box-shadow var(--dur-base) var(--ease-snes); }
	.logo-area img { width: 8rem; height: 8rem; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35)); }
	:global([data-theme='dark']) .logo-area { background-color: var(--color-bg-elevated); }
	.dice-placeholder { width: 6rem; height: 6rem; }
	.team-name { font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--weight-bold); color: var(--color-text-primary); text-align: center; min-height: 1.5rem; }
	.controls { display: flex; gap: var(--space-2); align-items: center; }
	.team-dropdown { font-family: var(--font-body); font-size: var(--text-sm); font-weight: var(--weight-medium); background-color: var(--input-bg); border: 2px solid var(--input-border); border-radius: var(--radius-sm); box-shadow: var(--input-shadow); color: var(--color-text-primary); padding: var(--space-2) var(--space-3); cursor: pointer; min-width: 10rem; transition: border-color var(--dur-fast) var(--ease-snes), box-shadow var(--dur-fast) var(--ease-snes); }
	.team-dropdown:hover { border-color: var(--input-border-hover); }
	.team-dropdown:focus-visible { outline: none; border-color: var(--input-border-focus); box-shadow: var(--input-shadow-focus); }
	.team-dropdown option { background-color: var(--color-bg-elevated); color: var(--color-text-primary); font-family: var(--font-body); }
	.random-button { display: flex; align-items: center; justify-content: center; background-color: var(--btn-secondary-bg); border: 2px solid var(--btn-secondary-border); border-radius: var(--radius-sm); box-shadow: var(--btn-secondary-shadow); padding: var(--space-2) var(--space-3); cursor: pointer; transition: background-color var(--dur-fast) var(--ease-snes), box-shadow var(--dur-fast) var(--ease-snes); }
	.random-button:hover { background-color: var(--btn-secondary-bg-hover); box-shadow: var(--btn-secondary-shadow-hover); }
	.random-button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
	.random-button img { height: 1.5rem; width: 1.5rem; display: block; }
</style>
