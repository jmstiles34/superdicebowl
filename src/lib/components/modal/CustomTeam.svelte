<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import { logos } from '$lib/data/logos.json';
	import type { Team } from '$lib/types';
	import { DEFAULT_TEAM } from '$lib/constants/constants';
	import '@fontsource/bebas-neue';
	import { hexToOklch, oklchToHex } from '$lib/utils/common';
	import { auth } from '$lib/auth/authState.svelte';
	import {
		createCustomTeam,
		getCustomTeamByTeamId,
		updateCustomTeam
	} from '$lib/db/repositories/customTeamRepository';

	type CustomTeamProps = {
		close: (id: string) => void;
		customTeamId: string;
	};

	let { close, customTeamId }: CustomTeamProps = $props();

	let faceMask = $state(oklchToHex('oklch(0.8845 0 0 / 1)'));
	let helmet = $state(oklchToHex('oklch(0.589 0.0989 245.29 / 1)'));
	let stripe = $state(oklchToHex('oklch(1 0 0 / 1)'));
	let trim = $state(oklchToHex('oklch(0.2469 0.0734 251.79 / 1)'));
	let primary = $state(oklchToHex('oklch(0.2469 0.0734 251.79 / 1)'));
	let secondary = $state(oklchToHex('oklch(0.589 0.0989 245.29 / 1)'));
	let logo = $state('');
	let logoTransform = $state('');
	let city = $state('');
	let name = $state('');
	let errors: string[] = $state([]);
	let dbRecordId: number | null = $state(null);
	const sortedLogos = logos.sort((a, b) => (a.name > b.name ? 1 : -1));

	onMount(async () => {
		if (!auth.currentUser?.id || !customTeamId) return;

		const record = await getCustomTeamByTeamId(auth.currentUser.id, customTeamId);
		if (!record) return;

		dbRecordId = record.id!;
		const team = record.teamData;
		faceMask = oklchToHex(team.colors.faceMask || faceMask);
		helmet = oklchToHex(team.colors.helmet || helmet);
		stripe = oklchToHex(team.colors.stripe || stripe);
		trim = oklchToHex(team.colors.trim || trim);
		primary = oklchToHex(team.colors.primary || primary);
		secondary = oklchToHex(team.colors.secondary || secondary);
		logo = team.logo || logo;
		logoTransform = team.logoTransform || '';
		city = team.city;
		name = team.name;
	});

	async function handleSave() {
		if (!auth.currentUser?.id) return;

		errors = [];
		if (!city.length) errors.push('city');
		if (!name.length) errors.push('name');
		if (!logo.length) errors.push('logo');
		if (errors.length) return;

		const teamId = customTeamId || uuidv4();
		const teamData: Team = {
			id: teamId,
			city,
			isCustom: true,
			cityKey: city.substring(0, 3).toUpperCase(),
			fieldLogo: logo,
			logo,
			logoFixed: false,
			logoLeft: '',
			logoTransform,
			name,
			colors: {
				primary: hexToOklch(primary),
				secondary: hexToOklch(secondary),
				helmet: hexToOklch(helmet),
				faceMask: hexToOklch(faceMask),
				stripe: hexToOklch(stripe),
				trim: hexToOklch(trim)
			}
		};

		if (dbRecordId) {
			await updateCustomTeam(dbRecordId, teamData);
		} else {
			await createCustomTeam(auth.currentUser.id, teamData);
		}
		close(teamId);
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
				<button
					class="save-button"
					style={`color: ${secondary}; background-color: ${primary}`}
					onclick={handleSave}
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
</style>
