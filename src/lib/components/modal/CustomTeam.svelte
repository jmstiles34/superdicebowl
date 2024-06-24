<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import { logos } from '$lib/data/logos.json';
	import type { Team } from '$lib/types';
	import { DEFAULT_TEAM } from '$lib/constants/constants';
	import '@fontsource/bebas-neue';
	import { hexToHsl, hslToHex } from '$lib/utils/common';

	type CustomTeamProps = {
		close: (id: string) => void;
		customTeamId: string;
	};

	let { close, customTeamId }: CustomTeamProps = $props();

	let faceMask = $state('hsl(0 0% 85% / 1)');
	let helmet = $state('hsl(207 44% 49% / 1)');
	let stripe = $state('hsl(0 100% 100% / 1)');
	let trim = $state('hsl(210 100% 13% / 1)');
	let primary = $state('hsl(210 100% 13% / 1)');
	let secondary = $state('hsl(207 44% 49% / 1)');
	let logo = $state('');
	let logoTransform = $state('');
	let city = $state('');
	let name = $state('');
	let errors: string[] = $state([]);
	let lsTeams = loadTeams();
	const sortedLogos = logos.sort((a, b) => (a.name > b.name ? 1 : -1));

	onMount(() => {
		const team: Team = getTeam();
		faceMask = hslToHex(team.colors.faceMask || faceMask);
		helmet = hslToHex(team.colors.helmet || helmet);
		stripe = hslToHex(team.colors.stripe || stripe);
		trim = hslToHex(team.colors.trim || trim);
		primary = hslToHex(team.colors.primary || primary);
		secondary = hslToHex(team.colors.secondary || secondary);
		logo = team.logo || logo;
		logoTransform = team.logoTransform || '';
		city = team.city;
		name = team.name;
	});

	function getTeam() {
		return lsTeams.find(({ id }) => id === customTeamId) || DEFAULT_TEAM;
	}

	function loadTeams(): Team[] {
		const teamJson = localStorage.getItem('customTeams');
		if (teamJson == null) return [];
		return JSON.parse(teamJson);
	}

	function saveTeams(teams: Team[]) {
		localStorage.setItem('customTeams', JSON.stringify(teams));
	}

	function deleteTeam() {
		let teamsToKeep = lsTeams.filter(({ id }) => id !== customTeamId);
		saveTeams(teamsToKeep);
		close('');
	}

	function saveTeam() {
		errors = [];
		!city.length && errors.push('city');
		!name.length && errors.push('name');
		!logo.length && errors.push('logo');

		if (!errors.length) {
			const newTeamId = customTeamId || uuidv4();
			const newTeam: Team = {
				id: newTeamId,
				city,
				isCustom: true,
				cityKey: city.substring(0, 3).toUpperCase(),
				fieldLogo: logo,
				logo,
				logoTransform,
				name,
				colors: {
					primary: hexToHsl(primary),
					secondary: hexToHsl(secondary),
					helmet: hexToHsl(helmet),
					faceMask: hexToHsl(faceMask),
					stripe: hexToHsl(stripe),
					trim: hexToHsl(trim)
				}
			};
			let teamsToKeep = lsTeams.filter(({ id }) => id !== customTeamId);
			saveTeams([...teamsToKeep, newTeam]);
			close(newTeamId);
		}
	}
</script>

<h3>{customTeamId ? 'Edit' : 'Add'} Custom Team</h3>
<div class="container">
	<div class="form-row">
		<div class="helmet">
			<CustomHelmet
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				{logo}
				logoFixed={false}
				{logoTransform}
				setTransform={(t) => (logoTransform = t)}
				canCustomize={true}
			/>
			{#if logo}
				<div class="notes">
					Click the logo to alter size, shape and position. Double-click when done.
				</div>
			{/if}
		</div>
		<div>
			<div class="form-row">
				<div class="form-label">Location:</div>
				<input
					type="text"
					maxlength="15"
					id="city"
					bind:value={city}
					class:error={errors.includes('city')}
				/>
			</div>
			<div class="form-row">
				<div class="form-label">Name:</div>
				<input
					type="text"
					maxlength="10"
					id="name"
					bind:value={name}
					class:error={errors.includes('name')}
				/>
			</div>

			<div class="divider"></div>

			<div class="form-row">
				<label class="form-label" for="logo">Logo:</label>
				<select id="logo" bind:value={logo} class:error={errors.includes('logo')}>
					<option value="">Choose...</option>
					{#each sortedLogos as logo}
						<option value={logo.file}>{logo.name}</option>
					{/each}
				</select>
			</div>
			<div class="form-row">
				<label class="form-label" for="helmet">Helmet:</label>
				<input type="color" id="helmet" bind:value={helmet} />
				<label class="form-label" for="stripe">Stripe 1:</label>
				<input type="color" id="stripe" bind:value={stripe} />
			</div>
			<div class="form-row">
				<label class="form-label" for="secondaryColor">Mask:</label>
				<input type="color" id="faceMask" bind:value={faceMask} />
				<label class="form-label" for="secondaryColor">Stripe 2:</label>
				<input type="color" id="trim" bind:value={trim} />
			</div>

			<div class="divider"></div>

			<div class="form-row">
				<label class="form-label" for="secondaryColor">Endzone:</label>
				<input type="color" id="primary" bind:value={primary} />
				<label class="form-label" for="secondaryColor">Text:</label>
				<input type="color" id="secondary" bind:value={secondary} />
			</div>

			<div class="button-row">
				{#if customTeamId}
					<button class="delete-button" onclick={deleteTeam} title="Delete"> X </button>
				{/if}
				<button
					class="save-button"
					style={`color: ${secondary}; background-color: ${primary}`}
					onclick={saveTeam}
				>
					Save Custom Team
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	h3 {
		color: var(--color-offblack);
		text-align: center;
	}
	.button-row {
		display: flex;
		justify-content: end;
		padding-top: 16px;
	}
	.container {
		display: flex;
		flex-direction: column;
	}
	.error {
		border-color: var(--urgent);
	}
	.form-label {
		color: var(--color-offblack);
		font-family: inherit;
		width: 5.1rem;
		text-align: right;
		padding-right: 0.3rem;
		white-space: nowrap;
	}
	.form-row {
		display: flex;
		padding: 0.3rem;
	}
	.divider {
		width: 95%;
		margin: 4px 0 4px auto;
		border-bottom: 2px dotted var(--color-blue-300);
	}
	.helmet {
		margin: -20px auto 0 auto;
		width: 275px;
	}
	.notes {
		color: var(--color-offblack);
		font-size: 0.75rem;
		font-style: italic;
		padding: 4px;
	}
	.save-button {
		margin: 0 4px;
		cursor: pointer;
		font-family: 'Bebas Neue';
		font-size: 1.5rem;
		padding: 0.25em;
		text-align: center;
		border-radius: var(--border-radius);
	}
	.delete-button {
		margin: 0;
		width: 1.75em;
		cursor: pointer;
		font-family: 'Bebas Neue';
		background-color: transparent;
		color: var(--urgent);
		font-size: 2rem;
		padding: 0;
		text-align: center;
		border: 1px solid var(--urgent);
		border-radius: var(--border-radius);
	}
	.delete-button:hover {
		background-color: var(--urgent-hover);
	}
</style>
