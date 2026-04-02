<script lang="ts">
	import { DEFAULT_PLAY, DEFAULT_PLAY_SUMMARY, GAME_ACTION, TEAM } from '$lib/constants/constants';
	import type { Play, PlaySummary, Team } from '$lib/types';

	type SummaryProps = {
		awayTeam: Team;
		homeTeam: Team;
		playLog: Play[];
	};

	let { awayTeam, homeTeam, playLog }: SummaryProps = $props();
	let activeTab = $state(0);

	const pointAfterMade = [GAME_ACTION.EXTRA_POINT_MADE, GAME_ACTION.TWO_POINT_MADE];
	const pointAfterMiss = [GAME_ACTION.EXTRA_POINT_MISS, GAME_ACTION.TWO_POINT_MISS];
	const pointAfterActions = [...pointAfterMade, ...pointAfterMiss];

	let offensePlays = $derived(playLog.filter(({ action }) => action === GAME_ACTION.OFFENSE));
	let penaltyPlays = $derived(offensePlays.filter(({ diceRoll }) => [22, 33, 36, 56].includes(diceRoll)));
	let puntPlays = $derived(playLog.filter(({ action }) => action === GAME_ACTION.PUNT));

	let scoringPlays = $derived([...playLog]
		.filter(({ action, points }) => points > 0 || pointAfterMiss.includes(action))
		.reduce((acc: Play[], play) => {
			if (pointAfterActions.includes(play.action)) {
				const previousPlay = acc.at(-1) || DEFAULT_PLAY;
				const newAcc = acc.slice(0, -1);
				let extraPoints = 0;
				let pointResult = '';
				if (pointAfterMade.includes(play.action)) {
					extraPoints = play.points;
					pointResult = `(${play.points === 1 ? 'Kick good' : 'Two-Point made'})`;
				} else {
					pointResult = `(${
						play.action === GAME_ACTION.EXTRA_POINT_MISS ? 'Kick missed' : 'Two-Point failed'
					})`;
				}
				return [
					...newAcc,
					{
						...previousPlay,
						points: previousPlay.points + extraPoints,
						description: `${previousPlay.description} ${pointResult}`
					}
				];
			}
			return [...acc, play];
		}, [])
		.reduce((log: PlaySummary[], play) => {
			const isSafety = play.description.includes('Safety');
			const previousPlay = log.at(-1) || DEFAULT_PLAY_SUMMARY;
			if (isSafety) {
				return [{
					team: play.team,
					description: play.description,
					homeScore: play.team === TEAM.AWAY ? play.points + previousPlay.homeScore : previousPlay.homeScore,
					awayScore: play.team === TEAM.HOME ? play.points + previousPlay.awayScore : previousPlay.awayScore
				}];
			}
			return [...log, {
				team: play.team,
				description: play.description,
				homeScore: play.team === TEAM.HOME ? play.points + previousPlay.homeScore : previousPlay.homeScore,
				awayScore: play.team === TEAM.AWAY ? play.points + previousPlay.awayScore : previousPlay.awayScore
			}];
		}, []));

	let possessions = $derived(playLog.reduce((acc: string[], play) => {
		if (play.team === acc.at(-1)) return acc;
		return [...acc, play.team];
	}, []));
	let awayDrives  = $derived(possessions.filter((team) => team === TEAM.AWAY));
	let homeDrives  = $derived(possessions.filter((team) => team === TEAM.HOME));

	let awayFirstDowns = $derived(offensePlays.filter(({ team, isFirstdown }) => team === TEAM.AWAY && isFirstdown));
	let homeFirstDowns = $derived(offensePlays.filter(({ team, isFirstdown }) => team === TEAM.HOME && isFirstdown));

	let awayFumbles = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.AWAY && diceRoll === 23));
	let homeFumbles = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.HOME && diceRoll === 23));

	let awayInts = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.AWAY && [12, 45].includes(diceRoll)));
	let homeInts = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.HOME && [12, 45].includes(diceRoll)));

	let awayPenalties = $derived(penaltyPlays.filter(({ team, diceRoll }) =>
		(team === TEAM.AWAY && [36, 56].includes(diceRoll)) || (team === TEAM.HOME && [22, 33].includes(diceRoll))
	));
	let homePenalties = $derived(penaltyPlays.filter(({ team, diceRoll }) =>
		(team === TEAM.HOME && [36, 56].includes(diceRoll)) || (team === TEAM.AWAY && [22, 33].includes(diceRoll))
	));
	let awayPenaltyYards = $derived(awayPenalties.reduce((total, play) => total + Math.abs(play.penaltyYards), 0));
	let homePenaltyYards = $derived(homePenalties.reduce((total, play) => total + Math.abs(play.penaltyYards), 0));

	let awayPlays = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.AWAY && ![22, 33, 36, 56].includes(diceRoll)));
	let homePlays = $derived(offensePlays.filter(({ team, diceRoll }) => team === TEAM.HOME && ![22, 33, 36, 56].includes(diceRoll)));

	let awayPunts = $derived(puntPlays.filter(({ team }) => team === TEAM.AWAY));
	let homePunts = $derived(puntPlays.filter(({ team }) => team === TEAM.HOME));

	let awayYards = $derived(offensePlays
		.filter(({ team, diceRoll }) => team === TEAM.AWAY && ![12, 23, 45, 22, 33, 36, 56].includes(diceRoll))
		.reduce((count, play) => count + play.yards, 0));
	let homeYards = $derived(offensePlays
		.filter(({ team, diceRoll }) => team === TEAM.HOME && ![12, 23, 45, 22, 33, 36, 56].includes(diceRoll))
		.reduce((count, play) => count + play.yards, 0));

	function toggleTab(idx: number) {
		activeTab = idx;
	}
</script>

<div class="container">

	<!-- ── Tab bar ──────────────────────────────────────────── -->
	<div class="tab-row">
		<button
			class="tab"
			class:tab-selected={activeTab === 0}
			onclick={() => toggleTab(0)}
		>
			Game Stats
		</button>
		<button
			class="tab"
			class:tab-selected={activeTab === 1}
			onclick={() => toggleTab(1)}
		>
			Scoring
		</button>
	</div>

	<!-- ── Game Stats tab ───────────────────────────────────── -->
	{#if activeTab === 0}
		<div class="grid-container">
			<!-- Team headers -->
			<div class="grid-item team-header"
				style="background-color: {homeTeam.colors.primary}; color: {homeTeam.colors.secondary};"
			>
				{homeTeam.name}
			</div>
			<div class="grid-item vs">vs</div>
			<div class="grid-item team-header"
				style="background-color: {awayTeam.colors.primary}; color: {awayTeam.colors.secondary};"
			>
				{awayTeam.name}
			</div>

			<!-- Stat rows -->
			<div class="grid-item stat">{homeDrives.length}</div>
			<div class="grid-item stat-label">Drives</div>
			<div class="grid-item stat">{awayDrives.length}</div>

			<div class="grid-item stat">{homePlays.length}</div>
			<div class="grid-item stat-label">Plays</div>
			<div class="grid-item stat">{awayPlays.length}</div>

			<div class="grid-item stat">{homeYards}</div>
			<div class="grid-item stat-label">Yards</div>
			<div class="grid-item stat">{awayYards}</div>

			<div class="grid-item stat">{homeFirstDowns.length}</div>
			<div class="grid-item stat-label">1st Downs</div>
			<div class="grid-item stat">{awayFirstDowns.length}</div>

			<div class="grid-item stat">{homePenalties.length}/{homePenaltyYards}yds</div>
			<div class="grid-item stat-label">Penalties</div>
			<div class="grid-item stat">{awayPenalties.length}/{awayPenaltyYards}yds</div>

			<div class="grid-item stat">{homeFumbles.length}</div>
			<div class="grid-item stat-label">Fumbles</div>
			<div class="grid-item stat">{awayFumbles.length}</div>

			<div class="grid-item stat">{homeInts.length}</div>
			<div class="grid-item stat-label">INTs</div>
			<div class="grid-item stat">{awayInts.length}</div>

			<div class="grid-item stat">{homePunts.length}</div>
			<div class="grid-item stat-label">Punts</div>
			<div class="grid-item stat">{awayPunts.length}</div>
		</div>
	{/if}

	<!-- ── Scoring Summary tab ──────────────────────────────── -->
	{#if activeTab === 1}
		<div class="score-list">
			<!-- Score column headers -->
			<div class="score-header">
				<div class="score-header-desc"></div>
				<div class="score-header-key"
					style="background-color: {homeTeam.colors.primary}; color: {homeTeam.colors.secondary};"
				>
					{homeTeam.cityKey}
				</div>
				<div class="score-header-key"
					style="background-color: {awayTeam.colors.primary}; color: {awayTeam.colors.secondary};"
				>
					{awayTeam.cityKey}
				</div>
			</div>

			<!-- Scoring play rows -->
			{#each scoringPlays as play}
				<div class="score-row">
					<div class="team-logo"
						style="background-color: {play.team === TEAM.HOME ? homeTeam.colors.primary : awayTeam.colors.primary};"
					>
						<img
							alt="Team Logo"
							src={`/logos/${play.team === TEAM.HOME ? homeTeam.logo : awayTeam.logo}.webp`}
						/>
					</div>
					<div class="play-description">{play.description}</div>
					<div class="score-cell">{play.homeScore}</div>
					<div class="score-cell">{play.awayScore}</div>
				</div>
			{/each}
		</div>
	{/if}

</div>

<style>
	/* ── Container ────────────────────────────────────────────── */
	.container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr;
		width: 400px;
		min-height: 310px;
	}

	/* ── Tabs ─────────────────────────────────────────────────── */
	.tab-row {
		display: flex;
		width: 100%;
		margin-bottom: var(--space-2);
		border-bottom: 2px solid var(--color-border-default);
	}

	.tab {
		flex: 1;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		text-align: center;
		padding: var(--space-2) var(--space-3);
		background-color: transparent;
		color: var(--color-text-secondary);
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		cursor: pointer;
		transition:
			color var(--dur-fast) var(--ease-snes),
			border-color var(--dur-fast) var(--ease-snes),
			background-color var(--dur-fast) var(--ease-snes);
	}

	.tab:hover {
		color: var(--color-text-primary);
		background-color: var(--nav-bg-active);
	}

	.tab-selected,
	.tab-selected:hover {
		color: var(--nav-text-active);
		border-bottom-color: var(--nav-border-active);
		background-color: var(--nav-bg-active);
		cursor: default;
	}

	/* ── Stats grid ───────────────────────────────────────────── */
	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background-color: var(--color-border-subtle);
	}

	.grid-item {
		padding: var(--space-1-5) var(--space-2);
		text-align: center;
	}

	/* Team name header cells */
	.team-header {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-base);
		letter-spacing: var(--tracking-display);
		padding: 2px var(--space-2);
		/* background + color set via inline team styles */
	}

	/* Stat value cells */
	.stat {
		font-family: var(--font-numeric);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		background-color: var(--table-row-bg);
		border: none;
	}

	/* Alternating rows — every pair of stat rows */
	.grid-container > .stat:nth-child(6n+4),
	.grid-container > .stat:nth-child(6n+5),
	.grid-container > .stat:nth-child(6n+6) {
		background-color: var(--table-row-bg-alt);
	}

	/* Center label column */
	.stat-label {
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--table-header-text);
		background-color: var(--table-header-bg);
	}

	/* vs separator in team header row */
	.vs {
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-tertiary);
		background-color: var(--table-header-bg);
	}

	/* ── Scoring tab ──────────────────────────────────────────── */
	.score-header {
		display: grid;
		grid-template-columns: 1fr 48px 48px;
		gap: 1px;
		background-color: var(--color-border-subtle);
		margin-bottom: 1px;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.score-header-desc {
		background-color: var(--table-header-bg);
		padding: 2px;
	}

	.score-header-key {
		font-family: var(--font-display);
		font-weight: var(--weight-black);
		font-style: italic;
		font-size: var(--text-sm);
		text-align: center;
		padding: 2px;
		/* background + color set via inline team styles */
	}

	.score-list {
		height: 268px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1px;
		background-color: var(--color-border-subtle);
	}

	.score-row {
		display: grid;
		grid-template-columns: 32px 1fr 48px 48px;
		align-items: center;
		background-color: var(--table-row-bg);
	}

	.score-row:nth-child(even) {
		background-color: var(--table-row-bg-alt);
	}

	.team-logo {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.team-logo img {
		width: 32px;
		height: 32px;
		display: block;
	}

	.play-description {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--table-cell-text);
		padding: var(--space-1) var(--space-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.score-cell {
		font-family: var(--font-numeric);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-gold);
		text-align: center;
		padding: var(--space-1);
		border-left: 1px solid var(--color-border-subtle);
	}
</style>