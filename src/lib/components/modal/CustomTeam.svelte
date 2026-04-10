<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import { logos } from '$lib/data/logos.json';
	import type { Team } from '$lib/types';
	import { hexToOklch, oklchToHex } from '$lib/utils/common';
	import { auth } from '$lib/auth/authState.svelte';
	import rotateLeft from '$lib/images/rotate-left.svg';
	import rotateRight from '$lib/images/rotate-right.svg';
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
	let logoRot = $state(-20);
	let city    = $state('');
	let name    = $state('');
	let errors: string[] = $state([]);
	let dbRecordId: number | null = $state(null);
	let currentStep = $state(1);
	const totalSteps = 3;
	const sortedLogos = logos.sort((a, b) => (a.name > b.name ? 1 : -1));

	function validateStep1(): boolean {
		errors = [];
		if (!city.length) errors.push('city');
		if (!name.length) errors.push('name');
		return errors.length === 0;
	}

	function nextStep() {
		if (currentStep === 1 && !validateStep1()) return;
		if (currentStep < totalSteps) currentStep++;
	}

	function prevStep() {
		if (currentStep > 1) currentStep--;
	}

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
	<div class="form-row" data-active-step={currentStep}>

		<!-- ── Step 1: Location & Name ──────────────────────── -->
		<div class="step step-1">
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
			</div>
		</div>

		<!-- ── Step 2: Helmet + Logo + Colors ───────────────── -->
		<div class="step step-2">
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
							<img src={rotateLeft} alt="Rotate left" />
						</button>
						<button class="rotate-btn reset-btn" onclick={() => (logoRot = -20)} aria-label="Reset rotation">
							{logoRot + 20}°
						</button>
						<button class="rotate-btn" onclick={() => (logoRot += 5)} aria-label="Rotate right">
							<img src={rotateRight} alt="Rotate right" />
						</button>
					</div>
				{/if}
			</div>
			<div class="fields">
				<div class="field-row">
					<label class="field-label" for="logo">Logo</label>
					<select id="logo" bind:value={logo} class:error={errors.includes('logo')}>
						<option value="">Choose...</option>
						{#each sortedLogos as l}
							<option value={l.file}>{l.name}</option>
						{/each}
					</select>
				</div>
				<div class="color-grid">
					<label class="field-label" for="helmet">Helmet</label>
					<input type="color" id="helmet" bind:value={helmet} />
					<label class="field-label" for="stripe">Stripe 1</label>
					<input type="color" id="stripe" bind:value={stripe} />

					<label class="field-label" for="faceMask">Mask</label>
					<input type="color" id="faceMask" bind:value={faceMask} />
					<label class="field-label" for="trim">Stripe 2</label>
					<input type="color" id="trim" bind:value={trim} />

					<label class="field-label" for="primary">Endzone</label>
					<input type="color" id="primary" bind:value={primary} />
					<label class="field-label" for="secondary">Text</label>
					<input type="color" id="secondary" bind:value={secondary} />
				</div>
				<div class="save-row">
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

		<!-- ── Step 3: Save (mobile only) ───────────────────── -->
		<div class="step step-3">
			<div class="save-row">
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

	<!-- ── Mobile step navigation ──────────────────────────── -->
	<div class="step-nav">
		<button class="step-nav-btn" onclick={prevStep} disabled={currentStep === 1}>
			&#x25C0; Back
		</button>
		<div class="step-indicators">
			{#each Array(totalSteps) as _, i}
				<span class="step-dot" class:active={currentStep === i + 1}></span>
			{/each}
		</div>
		<button class="step-nav-btn" onclick={nextStep} disabled={currentStep === totalSteps}>
			Next &#x25B6;
		</button>
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
		flex-direction: column;
		gap: var(--space-2);
	}

	.step-1 .fields {
		flex-direction: row;
		gap: var(--space-4);
	}

	.step-2 {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.step-3 {
		display: none;
	}

	.step-nav {
		display: none;
	}

	/* ── Helmet panel ─────────────────────────────────────────── */
	.helmet-panel {
		flex-shrink: 0;
		width: 200px;
	}

	.helmet-panel :global(.helmet-wrapper) {
		height: 10rem;
	}

	.notes {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-style: italic;
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-2) 0 0;
		margin: 0;
	}

	.rotate-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) 0;
	}




	.rotate-btn {
		cursor: pointer;
		font-size: var(--text-base);
		padding: var(--space-1) var(--space-2-5);
		height: 2rem;
		border-radius: var(--radius-sm);
		background: var(--card-bg);
		color: var(--color-text-primary);
		border: 2px solid var(--color-border-default);
		box-shadow: var(--snes-window-sm);
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.rotate-btn img {
		width: 1rem;
		height: 1rem;
		display: block;
		filter: var(--icon-filter-default);
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

	/* ── Color grid ──────────────────────────────────────────── */
	.color-grid {
		display: grid;
		grid-template-columns: auto auto auto auto;
		gap: var(--space-1) var(--space-2);
		align-items: center;
	}

	.color-grid .field-label {
		width: auto;
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

	/* ── Save row ─────────────────────────────────────────────── */
	.save-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-4);
	}

	.save-button {
		/* Uses team's own primary/secondary colors — set via inline style.
		   We supply structure, border, shadow, and typography. */
		font-family: var(--font-endzone);
		font-weight: 700;
		font-size: var(--text-display-sm);
		text-transform: uppercase;
		letter-spacing: 0.15em;
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

	/* ── Step navigation (mobile only) ────────────────────────── */
	.step-nav-btn {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		background: var(--btn-secondary-bg);
		border: 2px solid var(--btn-secondary-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--snes-window-sm);
		padding: var(--space-1-5) var(--space-3);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-snes),
			box-shadow var(--dur-fast) var(--ease-snes);
	}

	.step-nav-btn:hover:not(:disabled) {
		background: var(--btn-secondary-bg-hover);
		box-shadow: var(--btn-secondary-shadow-hover);
	}

	.step-nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.step-indicators {
		display: flex;
		gap: var(--space-2);
	}

	.step-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-border-default);
		transition: background-color var(--dur-fast) var(--ease-snes);
	}

	.step-dot.active {
		background: var(--btn-primary-bg-hover);
		box-shadow: 0 0 6px var(--btn-primary-bg-hover);
	}

	/* ── Mobile wizard ───────────────────────────────────────── */
	@media (max-width: 780px) {
		.form-row {
			display: block;
		}

		.step {
			display: none;
		}

		.form-row[data-active-step='1'] .step-1,
		.form-row[data-active-step='2'] .step-2,
		.form-row[data-active-step='3'] .step-3 {
			display: block;
		}

		.step-1 .fields {
			flex-direction: column;
			gap: var(--space-1);
		}

		.step-2 {
			display: block;
		}

		.step-2 .save-row {
			display: none;
		}

		.helmet-panel {
			max-width: 280px;
			margin: 0 auto;
		}

		.step-2 .fields {
			margin-top: var(--space-4);
		}

		.save-row {
			flex-direction: column;
			gap: var(--space-3);
		}

		.step-nav {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: var(--space-4) 0 0;
		}
	}
</style>