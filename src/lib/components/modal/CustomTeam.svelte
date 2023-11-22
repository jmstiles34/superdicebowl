<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import { logos } from '$lib/data/logos.json';
	import type { Team } from '$lib/types';
	import { DEFAULT_TEAM } from '$lib/constants/constants';
	export let close: (id: string) => void;
	export let customTeamId: string;
	import '@fontsource/bebas-neue';

	let bg = '#ffffff';
	let faceMask = '#d8d8d8';
	let helmet = '#4682b4';
	let stripe = '#ffffff';
	let trim = '#002244';
	let primary = '#002244';
	let secondary = '#4682b4';
	let logo = '';
	let logoTransform = '';
	let city = '';
	let name = '';
	let errors: string[] = [];
	let lsTeams = loadTeams();
	const sortedLogos = logos.sort((a, b) => (a.name > b.name ? 1 : -1));

	onMount(() => {
		if (customTeamId) {
			const team: Team = getTeam();
			faceMask = team.colors.faceMask || faceMask;
			helmet = team.colors.helmet || helmet;
			stripe = team.colors.stripe || stripe;
			trim = team.colors.trim || trim;
			primary = team.colors.primary;
			secondary = team.colors.secondary;
			logo = team.logo || logo;
			logoTransform = team.logoTransform || '';
			city = team.city;
			name = team.name;
		}
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
				logo,
				logoTransform,
				name,
				colors: {
					primary,
					secondary,
					helmet,
					faceMask,
					stripe,
					trim
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
				{bg}
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				{logo}
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

			<div class="divider" />

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

			<div class="divider" />

			<div class="form-row">
				<label class="form-label" for="secondaryColor">Endzone:</label>
				<input type="color" id="primary" bind:value={primary} />
				<label class="form-label" for="secondaryColor">Text:</label>
				<input type="color" id="secondary" bind:value={secondary} />
			</div>

			<div class="button-row">
				{#if customTeamId}
					<button class="delete-button" on:click={deleteTeam} title="Delete"> X </button>
				{/if}
				<button
					class="save-button"
					style={`color: ${secondary}; background-color: ${primary}`}
					on:click={saveTeam}
				>
					Save Custom Team
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	h3 {
		color: var(--black);
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
		border-color: var(--error);
	}
	.form-label {
		color: var(--black);
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
		border-bottom: 2px dotted var(--ltblue);
	}
	.helmet {
		margin: -20px auto 0 auto;
		width: 250px;
	}
	.notes {
		color: var(--black);
		font-size: 0.75rem;
		font-style: italic;
		padding: 4px;
	}
	.save-button {
		margin: 0 4px;
		cursor: pointer;
		font-family: 'Bebas Neue';
		font-size: 1.5rem;
	}
	.delete-button {
		margin: 0;
		width: 1.75em;
		cursor: pointer;
		font-family: 'Bebas Neue';
		background-color: transparent;
		color: var(--error);
		font-size: 2rem;
		padding: 0;
		border: 1px solid var(--error);
	}
	.delete-button:hover {
		background-color: #fad2dc;
	}
</style>
