<script lang="ts">
	import { DEFAULT_TEAM, DICE_COLORS } from '$lib/shared/constants';
	import { teamsData } from '$lib/baseball/data/data.json';
	import type { SaveTeam, Team } from '$lib/types';
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
	const teams = teamsData as Team[];

	onMount(() => {
		diceColor = pickRandom(DICE_COLORS) as string;
	});

	function handleTeamSelect(e: Event) {
		const { value } = e.currentTarget as HTMLSelectElement;
		if (!value || value === '') {
			saveTeam(DEFAULT_TEAM);
		} else {
			const found = teams.find((t) => t.id === value);
			saveTeam(found ?? DEFAULT_TEAM);
		}
	}

	function handleRandom() {
		const available = teams.filter((t) => t.id !== opponentId);
		const pick = available[Math.floor(Math.random() * available.length)];
		if (pick) saveTeam(pick);
	}
</script>

<div class="team-select-card">
	<div class="team-type">{teamType}</div>

	<div class="logo-area" style:background-color={team.colors?.primary ?? 'var(--color-bg-surface)'}>
		{#if team.logo}
			<picture>
				<source type="image/avif" srcset={`/logos/${team.logo}.avif`} />
				<img alt={`${team.city} ${team.name}`} src={`/logos/${team.logo}.webp`} />
			</picture>
		{/if}
	</div>

	<div class="team-name">
		{#if team.id}
			{team.city} {team.name}
		{:else}
			Select a team
		{/if}
	</div>

	<div class="controls">
		<select class="team-dropdown" value={selected} onchange={handleTeamSelect}>
			<option value="">-- Select --</option>
			{#each teams as t}
				<option value={t.id} disabled={t.id === opponentId}>
					{t.city} {t.name}
				</option>
			{/each}
		</select>

		<button
			class="random-button"
			onclick={handleRandom}
			title="Random Team"
			style:background-color={diceColor}
		>
			?
		</button>
	</div>
</div>

<style>
	.team-select-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		min-width: 14rem;
	}

	.team-type {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		color: var(--color-text-tertiary);
		text-shadow: var(--text-shadow-display);
		text-transform: uppercase;
	}

	.logo-area {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 8rem;
		height: 8rem;
		border-radius: var(--radius-md);
		border: 2px solid var(--color-border-default);
		overflow: hidden;
		transition: background-color var(--dur-base) var(--ease-snes);
	}

	.logo-area img {
		width: 5.5rem;
		height: 5.5rem;
		object-fit: contain;
	}

	.team-name {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		color: var(--color-text-primary);
		text-align: center;
		min-height: 1.5rem;
	}

	.controls {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.team-dropdown {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		color: var(--color-text-primary);
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
		min-width: 10rem;
		transition:
			border-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.team-dropdown:hover {
		border-color: var(--input-border-hover);
	}

	.team-dropdown:focus-visible {
		outline: none;
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	.team-dropdown option {
		background-color: var(--color-bg-elevated);
		color: var(--color-text-primary);
		font-family: var(--font-body);
	}

	.random-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-sm);
		border: 2px solid var(--color-border-default);
		color: var(--color-on-accent);
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-size: var(--text-md);
		cursor: pointer;
		transition:
			filter var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.random-button:hover {
		filter: brightness(1.2);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.random-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}
</style>
