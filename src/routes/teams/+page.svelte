<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth/authState.svelte';
	import type { CustomTeamRecord } from '$lib/db/database';
	import {
		deleteCustomTeam,
		getCustomTeamsByUser
	} from '$lib/db/repositories/customTeamRepository';
	import { getTeamRecord, type TeamRecord } from '$lib/db/repositories/gameRepository';
	import CustomHelmet from '$lib/components/CustomHelmet.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import CustomTeam from '$lib/components/modal/CustomTeam.svelte';
	import { POSITION } from '$lib/constants/constants';

	let teams: CustomTeamRecord[] = $state([]);
	let records: Map<string, TeamRecord> = $state(new Map());
	let showEditor = $state(false);
	let editTeamId = $state('');
	let confirmDeleteId: number | null = $state(null);

	$effect(() => {
		if (auth.initialized && !auth.isLoggedIn) goto('/login');
	});

	$effect(() => {
		if (auth.currentUser?.id) loadTeams();
	});

	async function loadTeams() {
		if (!auth.currentUser?.id) return;
		teams = await getCustomTeamsByUser(auth.currentUser.id);

		const newRecords = new Map<string, TeamRecord>();
		for (const team of teams) {
			const record = await getTeamRecord(auth.currentUser.id, team.teamData.id);
			newRecords.set(team.teamData.id, record);
		}
		records = newRecords;
	}

	function openEditor(teamId: string) {
		editTeamId = teamId;
		showEditor = true;
	}

	async function closeEditor(id: string) {
		showEditor = false;
		editTeamId = '';
		await loadTeams();
	}

	async function handleDelete(recordId: number) {
		await deleteCustomTeam(recordId);
		confirmDeleteId = null;
		await loadTeams();
	}

	function formatRecord(teamId: string): string {
		const record = records.get(teamId);
		if (!record || record.total === 0) return 'No games played';
		return `${record.wins}W - ${record.losses}L`;
	}
</script>

{#if auth.isLoggedIn}
	<div class="teams-page">
		<div class="header">
			<h2>My Teams</h2>
			<button class="game-button create-btn" onclick={() => openEditor('')}>
				+ New Team
			</button>
		</div>

		{#if teams.length === 0}
			<p class="empty">You haven't created any custom teams yet.</p>
		{:else}
			<div class="team-list">
				{#each teams as record (record.id)}
					<div class="team-card">
						<div class="team-header">
							<div class="helmet-preview">
								<CustomHelmet
									faceMask={record.teamData.colors.faceMask || ''}
									helmet={record.teamData.colors.helmet || ''}
									stripe={record.teamData.colors.stripe || ''}
									trim={record.teamData.colors.trim || ''}
									logo={record.teamData.logo}
									logoFixed={false}
									logoLeft={record.teamData.logoLeft || ''}
									logoX={record.teamData.logoX}
									logoY={record.teamData.logoY}
									logoWidth={record.teamData.logoWidth}
									logoHeight={record.teamData.logoHeight}
									logoRotation={record.teamData.logoRotation}
									direction={POSITION.RIGHT}
								/>
							</div>
							<div class="team-info">
								<div
									class="team-name"
									style:color={record.teamData.colors.secondary}
								>
									{record.teamData.city} {record.teamData.name}
								</div>
								<div class="team-record">{formatRecord(record.teamData.id)}</div>
							</div>
						</div>
						<div class="card-actions">
							<button class="game-button" onclick={() => openEditor(record.teamData.id)}>
								Edit
							</button>
							{#if confirmDeleteId === record.id}
								<div class="confirm-row">
									<button class="delete-btn" onclick={() => handleDelete(record.id!)}>
										Confirm
									</button>
									<button class="cancel-btn" onclick={() => (confirmDeleteId = null)}>
										Cancel
									</button>
								</div>
							{:else}
								<button class="delete-trigger" onclick={() => (confirmDeleteId = record.id!)}>
									Delete
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<Modal
		showModal={showEditor}
		close={() => { showEditor = false; editTeamId = ''; }}
		hasClose={true}
		choiceRequired={false}
	>
		<div class="modal-content">
			<CustomTeam customTeamId={editTeamId} close={closeEditor} />
		</div>
	</Modal>
{/if}

<style>
	.teams-page {
		max-width: 30rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	h2 {
		margin: 0;
	}
	.create-btn {
		white-space: nowrap;
	}
	.empty {
		color: var(--color-gray-400);
		text-align: center;
		padding: 2rem 0;
	}
	.team-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.team-card {
		background: var(--color-gray-900);
		border: 1px solid var(--color-gray-700);
		border-radius: var(--border-radius);
		padding: 0.75rem;
	}
	.team-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.helmet-preview {
		width: 4rem;
		height: 4rem;
		flex-shrink: 0;
		overflow: visible;
	}
	.team-info {
		flex: 1;
	}
	.team-name {
		font-weight: 600;
		font-size: var(--16px);
	}
	.team-record {
		color: var(--color-gray-400);
		font-size: var(--14px);
		margin-top: 0.125rem;
	}
	.card-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.delete-trigger {
		color: var(--urgent);
		font-size: var(--12px);
	}
	.delete-trigger:hover {
		color: var(--urgent-hover);
	}
	.confirm-row {
		display: flex;
		gap: 0.5rem;
	}
	.delete-btn {
		color: var(--color-white);
		background: var(--urgent);
		padding: 0.25rem 0.5rem;
		border-radius: var(--border-radius);
		font-size: var(--12px);
	}
	.cancel-btn {
		color: var(--color-gray-300);
		font-size: var(--12px);
	}
</style>
