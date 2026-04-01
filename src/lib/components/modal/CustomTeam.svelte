<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import { logos } from '$lib/data/logos.json';
	import type { Team } from '$lib/types';
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
	let helmet   = $state(oklchToHex('oklch(0.589 0.0989 245.29 / 1)'));
	let stripe   = $state(oklchToHex('oklch(1 0 0 / 1)'));
	let trim     = $state(oklchToHex('oklch(0.2469 0.0734 251.79 / 1)'));
	let primary   = $state(oklchToHex('oklch(0.2469 0.0734 251.79 / 1)'));
	let secondary = $state(oklchToHex('oklch(0.589 0.0989 245.29 / 1)'));
	let logo    = $state('');
	let logoX   = $state(176);
	let logoY   = $state(114);
	let logoW   = $state(346);
	let logoH   = $state(346);
	let logoRot = $state(0);
	let city    = $state('');
	let name    = $state('');
	let errors: string[] = $state([]);
	let dbRecordId: number | null = $state(null);
	const sortedLogos = logos.sort((a, b) => (a.name > b.name ? 1 : -1));

	onMount(async () => {
		if (!auth.currentUser?.id || !customTeamId) return;

		const record = await getCustomTeamByTeamId(auth.currentUser.id, customTeamId);
		if (!record) return;

		dbRecordId = record.id!;
		const team = record.teamData;
		faceMask  = oklchToHex(team.colors.faceMask  || faceMask);
		helmet    = oklchToHex(team.colors.helmet     || helmet);
		stripe    = oklchToHex(team.colors.stripe     || stripe);
		trim      = oklchToHex(team.colors.trim       || trim);
		primary   = oklchToHex(team.colors.primary    || primary);
		secondary = oklchToHex(team.colors.secondary  || secondary);
		logo      = team.logo     || logo;
		logoX     = team.logoX    ?? logoX;
		logoY     = team.logoY    ?? logoY;
		logoW     = team.logoWidth  ?? logoW;
		logoH     = team.logoHeight ?? logoH;
		logoRot   = team.logoRotation ?? logoRot;
		city      = team.city;
		name      = team.name;
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
			logoX,
			logoY,
			logoWidth:   logoW,
			logoHeight:  logoH,
			logoRotation: logoRot,
			name,
			colors: {
				primary:   hexToOklch(primary),
				secondary: hexToOklch(secondary),
				helmet:    hexToOklch(helmet),
				faceMask:  hexToOklch(faceMask),
				stripe:    hexToOklch(stripe),
				trim:      hexToOklch(trim)
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

		<!-- ── Helmet preview ────────────────────────────────── -->
		<div class="helmet-panel">
			<CustomHelmet
				{faceMask}
				{helmet}
				{stripe}
				{trim}
				{logo}
				logoFixed={false}
				{logoX}
				{logoY}
				logoWidth={logoW}
				logoHeight={logoH}
				logoRotation={logoRot}
				setLogoPosition={(x, y, w, h) => { logoX = x; logoY = y; logoW = w; logoH = h; }}
				canCustomize={true}
			/>
			{#if logo}
				<p class="notes">Drag to move · Scroll to resize</p>
				<div class="rotate-controls">
					<button class="rotate-btn" onclick={() => (logoRot -= 5)} aria-label="Rotate left">
						&#x21B6;
					</button>
					<button class="rotate-btn reset-btn" onclick={() => (logoRot = 0)} aria-label="Reset rotation">
						{logoRot}°
					</button>
					<button class="rotate-btn" onclick={() => (logoRot += 5)} aria-label="Rotate right">
						&#x21B7;
					</button>
				</div>
			{/if}
		</div>

		<!-- ── Fields ────────────────────────────────────────── -->
		<div class="fields">

			<div class="field-row">
				<label class="field-label" for="city">Location</label>
				<input
					type="text"
					id="city"
					maxlength="15"
					bind:value={city}
					class:error={errors.includes('city')}
				/>
			</div>

			<div class="field-row">
				<label class="field-label" for="name">Name</label>
				<input
					type="text"
					id="name"
					maxlength="12"
					bind:value={name}
					class:error={errors.includes('name')}
				/>
			</div>

			<div class="divider"></div>

			<div class="field-row">
				<label class="field-label" for="logo">Logo</label>
				<select id="logo" bind:value={logo} class:error={errors.includes('logo')}>
					<option value="">Choose...</option>
					{#each sortedLogos as l}
						<option value={l.file}>{l.name}</option>
					{/each}
				</select>
			</div>

			<div class="field-row">
				<label class="field-label" for="helmet">Helmet</label>
				<input type="color" id="helmet" bind:value={helmet} />
				<label class="field-label swatch-label" for="stripe">Stripe 1</label>
				<input type="color" id="stripe" bind:value={stripe} />
			</div>

			<div class="field-row">
				<label class="field-label" for="faceMask">Mask</label>
				<input type="color" id="faceMask" bind:value={faceMask} />
				<label class="field-label swatch-label" for="trim">Stripe 2</label>
				<input type="color" id="trim" bind:value={trim} />
			</div>

			<div class="divider"></div>

			<div class="field-row">
				<label class="field-label" for="primary">Endzone</label>
				<input type="color" id="primary" bind:value={primary} />
				<label class="field-label swatch-label" for="secondary">Text</label>
				<input type="color" id="secondary" bind:value={secondary} />
			</div>

			<div class="button-row">
				<button
					class="save-button"
					style="color: {secondary}; background-color: {primary};"
					onclick={handleSave}
				>
					Save Team
				</button>
			</div>

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
		margin: 0 0 var(--space-5) 0;
	}

	/* ── Layout ───────────────────────────────────────────────── */
	.container {
		display: flex;
		flex-direction: column;
	}

	.form-row {
		display: flex;
		gap: var(--space-5);
		align-items: flex-start;
	}

	/* ── Helmet panel ─────────────────────────────────────────── */
	.helmet-panel {
		flex-shrink: 0;
		width: 275px;
		margin-top: -20px;
	}

	.notes {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-style: italic;
		color: var(--color-text-tertiary);
		text-align: center;
		padding: var(--space-2) 0 var(--space-1);
	}

	.rotate-controls {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-1) 0;
	}

	.rotate-btn {
		cursor: pointer;
		font-size: var(--text-lg);
		padding: var(--space-1) var(--space-2-5);
		border-radius: var(--radius-sm);
		background: var(--card-bg);
		color: var(--color-text-primary);
		border: 2px solid var(--color-border-default);
		box-shadow: var(--snes-window-sm);
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.rotate-btn:hover {
		background: var(--color-bg-elevated);
		box-shadow: var(--snes-window-md);
		border-color: var(--color-border-strong);
	}

	.reset-btn {
		font-family: var(--font-numeric);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		min-width: 3.5rem;
		color: var(--color-text-gold);
	}

	/* ── Fields panel ─────────────────────────────────────────── */
	.fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.field-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1-5) 0;
	}

	/* ── Labels ───────────────────────────────────────────────── */
	.field-label {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		white-space: nowrap;
		width: 4.5rem;
		text-align: right;
		flex-shrink: 0;
	}

	/* Second label in a two-swatch row — no fixed width, just gap */
	.swatch-label {
		width: auto;
		padding-left: var(--space-2);
	}

	/* ── Text inputs & select ─────────────────────────────────── */
	input[type='text'],
	select {
		flex: 1;
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: var(--input-text);
		background-color: var(--input-bg);
		border: 2px solid var(--input-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--input-shadow);
		padding: var(--space-1-5) var(--space-3);
		outline: none;
		transition:
			border-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	input[type='text']:hover,
	select:hover {
		border-color: var(--input-border-hover);
	}

	input[type='text']:focus,
	select:focus {
		border-color: var(--input-border-focus);
		box-shadow: var(--input-shadow-focus);
	}

	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237080F0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-3) center;
		padding-right: var(--space-8);
		cursor: pointer;
	}

	select option {
		background-color: var(--color-bg-elevated);
		color: var(--color-text-primary);
	}

	/* ── Color pickers ────────────────────────────────────────── */
	input[type='color'] {
		width: 2.25rem;
		height: 2.25rem;
		padding: 2px;
		border: 2px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--snes-window-sm);
		background: var(--input-bg);
		cursor: pointer;
		flex-shrink: 0;
		transition: border-color var(--dur-fast) var(--ease-snes);
	}

	input[type='color']:hover {
		border-color: var(--color-border-strong);
	}

	/* ── Validation error state ───────────────────────────────── */
	.error {
		border-color: var(--color-border-danger) !important;
		box-shadow: 0 0 0 1px var(--color-border-danger), var(--glow-red-sm) !important;
	}

	/* ── Section divider ──────────────────────────────────────── */
	.divider {
		width: 100%;
		margin: var(--space-2) 0;
		border: none;
		border-bottom: 2px dotted var(--color-border-default);
	}

	/* ── Save button ──────────────────────────────────────────── */
	.button-row {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--space-4);
	}

	.save-button {
		/* Uses team's own primary/secondary colors — set via inline style.
		   We supply structure, border, shadow, and typography. */
		font-family: var(--font-display);
		font-weight: var(--weight-extrabold);
		font-style: italic;
		font-size: var(--text-display-sm);
		letter-spacing: var(--tracking-display);
		padding: var(--space-2) var(--space-6);
		border-radius: var(--radius-sm);
		border: 2px solid rgba(0, 0, 0, 0.25);
		box-shadow: var(--shadow-pixel-md) rgba(0, 0, 0, 0.4),
		            inset 0 1px 0 rgba(255, 255, 255, 0.2);
		cursor: pointer;
		text-align: center;
		transition:
			filter var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.save-button:hover {
		filter: brightness(1.1);
		box-shadow: var(--shadow-pixel-lg) rgba(0, 0, 0, 0.5),
		            inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.save-button:active {
		transform: translateY(2px);
		box-shadow: none;
	}
</style>