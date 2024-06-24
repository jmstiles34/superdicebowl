<script lang="ts">
	import { goto } from '$app/navigation';
	import { DEFAULT_PLAY, DEFAULT_PLAY_SUMMARY, GAME_ACTION, TEAM } from '$lib/constants/constants';
	import type { Play, PlaySummary, Team } from '$lib/types';
	import '@fontsource/bebas-neue';

	type SummaryProps = {
		awayTeam: Team;
		homeTeam: Team;
		playLog: Play[];
		gameIsOver: boolean;
	};

	let { awayTeam, homeTeam, playLog, gameIsOver }: SummaryProps = $props();
	let activeTab = $state(0);

	const pointAfterMade = [GAME_ACTION.EXTRA_POINT_MADE, GAME_ACTION.TWO_POINT_MADE];
	const pointAfterMiss = [GAME_ACTION.EXTRA_POINT_MISS, GAME_ACTION.TWO_POINT_MISS];
	const pointAfterActions = [...pointAfterMade, ...pointAfterMiss];

	const offensePlays = playLog.filter(({ action }) => action === GAME_ACTION.OFFENSE);
	const penaltyPlays = offensePlays.filter(({ diceRoll }) => [22, 33, 36, 56].includes(diceRoll));
	const puntPlays = playLog.filter(({ action }) => action === GAME_ACTION.PUNT);

	const scoringPlays = [...playLog]
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
				return [
					{
						team: play.team,
						description: play.description,
						homeScore:
							play.team === TEAM.AWAY
								? play.points + previousPlay.homeScore
								: previousPlay.homeScore,
						awayScore:
							play.team === TEAM.HOME
								? play.points + previousPlay.awayScore
								: previousPlay.awayScore
					}
				];
			}

			return [
				...log,
				{
					team: play.team,
					description: play.description,
					homeScore:
						play.team === TEAM.HOME ? play.points + previousPlay.homeScore : previousPlay.homeScore,
					awayScore:
						play.team === TEAM.AWAY ? play.points + previousPlay.awayScore : previousPlay.awayScore
				}
			];
		}, []);

	const possessions = playLog.reduce((acc: string[], play) => {
		if (play.team === acc.at(-1)) return acc;
		return [...acc, play.team];
	}, []);
	const awayDrives = possessions.filter((team) => team === TEAM.AWAY);
	const homeDrives = possessions.filter((team) => team === TEAM.HOME);

	const awayFirstDowns = offensePlays.filter(
		({ team, isFirstdown }) => team === TEAM.AWAY && isFirstdown
	);
	const homeFirstDowns = offensePlays.filter(
		({ team, isFirstdown }) => team === TEAM.HOME && isFirstdown
	);

	const awayFumbles = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.AWAY && diceRoll === 23
	);
	const homeFumbles = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.HOME && diceRoll === 23
	);

	const awayInts = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.AWAY && [12, 45].includes(diceRoll)
	);
	const homeInts = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.HOME && [12, 45].includes(diceRoll)
	);

	const awayPenalties = penaltyPlays.filter(
		({ team, diceRoll }) =>
			(team === TEAM.AWAY && [36, 56].includes(diceRoll)) ||
			(team === TEAM.HOME && [22, 33].includes(diceRoll))
	);
	const homePenalties = penaltyPlays.filter(
		({ team, diceRoll }) =>
			(team === TEAM.HOME && [36, 56].includes(diceRoll)) ||
			(team === TEAM.AWAY && [22, 33].includes(diceRoll))
	);
	const awayPenaltyYards = awayPenalties.reduce(
		(total, play) => total + Math.abs(play.penaltyYards),
		0
	);
	const homePenaltyYards = homePenalties.reduce(
		(total, play) => total + Math.abs(play.penaltyYards),
		0
	);

	const awayPlays = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.AWAY && ![22, 33, 36, 56].includes(diceRoll)
	);
	const homePlays = offensePlays.filter(
		({ team, diceRoll }) => team === TEAM.HOME && ![22, 33, 36, 56].includes(diceRoll)
	);

	const awayPunts = puntPlays.filter(({ team }) => team === TEAM.AWAY);
	const homePunts = puntPlays.filter(({ team }) => team === TEAM.HOME);

	const awayYards = offensePlays
		.filter(
			({ team, diceRoll }) => team === TEAM.AWAY && ![12, 23, 45, 22, 33, 36, 56].includes(diceRoll)
		)
		.reduce((count, play) => count + play.yards, 0);
	const homeYards = offensePlays
		.filter(
			({ team, diceRoll }) => team === TEAM.HOME && ![12, 23, 45, 22, 33, 36, 56].includes(diceRoll)
		)
		.reduce((count, play) => count + play.yards, 0);

	function toggleTab(idx: number) {
		activeTab = idx;
	}
</script>

<div class="container">
	<div class="tab-row">
		<div
			class="tab"
			class:tab-selected={activeTab === 0}
			onclick={() => toggleTab(0)}
			onkeydown={() => toggleTab(0)}
			role="button"
			tabindex="0"
		>
			Game Stats
		</div>
		<div
			class="tab"
			class:tab-selected={activeTab === 1}
			onclick={() => toggleTab(1)}
			onkeydown={() => toggleTab(1)}
			role="button"
			tabindex="0"
		>
			Scoring Summary
		</div>
	</div>

	{#if activeTab === 0}
		<div class="grid-container">
			<!-- Row 1 -->
			<div
				class="grid-item"
				style={`
                background-color: ${homeTeam.colors.primary};
                color: ${homeTeam.colors.secondary};
            `}
			>
				<div class="team">{homeTeam.name}</div>
			</div>
			<div class="grid-item vs">vs</div>
			<div
				class="grid-item team"
				style={`
                background-color: ${awayTeam.colors.primary};
                color: ${awayTeam.colors.secondary};
            `}
			>
				<div class="team">{awayTeam.name}</div>
			</div>

			<!-- Row 2 -->
			<div class="grid-item stat">{homeDrives.length}</div>
			<div class="grid-item statName">Drives</div>
			<div class="grid-item stat">{awayDrives.length}</div>

			<!-- Row 3 -->
			<div class="grid-item stat">{homePlays.length}</div>
			<div class="grid-item statName">Plays</div>
			<div class="grid-item stat">{awayPlays.length}</div>

			<!-- Row 4 -->
			<div class="grid-item stat">{homeYards}</div>
			<div class="grid-item statName">Yards</div>
			<div class="grid-item stat">{awayYards}</div>

			<!-- Row 5 -->
			<div class="grid-item stat">{homeFirstDowns.length}</div>
			<div class="grid-item statName">Firstdowns</div>
			<div class="grid-item stat">{awayFirstDowns.length}</div>

			<!-- Row 6 -->
			<div class="grid-item stat">{homePenalties.length}/{homePenaltyYards}yds</div>
			<div class="grid-item statName">Penalties</div>
			<div class="grid-item stat">{awayPenalties.length}/{awayPenaltyYards}yds</div>

			<!-- Row 7 -->
			<div class="grid-item stat">{homeFumbles.length}</div>
			<div class="grid-item statName">Fumbles</div>
			<div class="grid-item stat">{awayFumbles.length}</div>

			<!-- Row 8 -->
			<div class="grid-item stat">{homeInts.length}</div>
			<div class="grid-item statName">Ints</div>
			<div class="grid-item stat">{awayInts.length}</div>

			<!-- Row 9 -->
			<div class="grid-item stat">{homePunts.length}</div>
			<div class="grid-item statName">Punts</div>
			<div class="grid-item stat">{awayPunts.length}</div>
		</div>
	{/if}

	{#if activeTab === 1}
		<div>
			<div class="grid-container-score-header">
				<!-- Row 1 -->
				<div class="grid-item score"></div>
				<div
					class="grid-item city-key"
					style={`
                    background-color: ${homeTeam.colors.primary};
                    color: ${homeTeam.colors.secondary};
                `}
				>
					{homeTeam.cityKey}
				</div>
				<div
					class="grid-item city-key"
					style={`
                    background-color: ${awayTeam.colors.primary};
                    color: ${awayTeam.colors.secondary};
                `}
				>
					{awayTeam.cityKey}
				</div>
			</div>
			<div class="score-list">
				<div class="grid-container-score">
					{#each scoringPlays as play}
						<div
							class="teamLogo"
							style={`background-color: ${
								play.team === TEAM.HOME ? homeTeam.colors.primary : awayTeam.colors.primary
							};`}
						>
							<img
								alt="Team Logo"
								src={`/logos/${play.team === TEAM.HOME ? homeTeam.logo : awayTeam.logo}.webp`}
							/>
						</div>
						<div class="grid-item score-item">
							<div class="description">{play.description}</div>
						</div>
						<div class="grid-item score">{play.homeScore}</div>
						<div class="grid-item score">{play.awayScore}</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if gameIsOver}
		<div class="returnButton">
			<button
				onclick={() => {
					goto('/');
				}}
			>
				Return Home
			</button>
		</div>
	{/if}
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr auto;
		width: 400px;
		min-height: 310px;
	}
	.tab-row {
		display: flex;
		width: 100%;
		margin-bottom: 4px;
	}
	.tab {
		display: flex;
		width: 50%;
		font-size: var(--16px);
		color: var(--color-offblack);
		text-align: center;
		padding: 8px;
		background-color: var(--color-blue-300);
		cursor: pointer;
		white-space: nowrap;
	}
	.tab-selected,
	.tab-selected:hover {
		background-color: var(--color-blue-600);
		color: var(--color-white);
		font-weight: 600;
		cursor: default;
	}
	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 1px;
	}
	.grid-container-score {
		display: grid;
		grid-template-columns: auto 1fr 48px 48px;
		grid-gap: 1px;
	}
	.grid-container-score-header {
		display: grid;
		grid-template-columns: auto 48px 48px 14px;
		grid-gap: 1px;
	}

	.grid-item {
		background-color: var(--color-gray-100);
		color: var(--color-white);
		padding: 5px;
		text-align: center;
	}
	.score-list {
		margin-top: 2px;
		height: 234px;
		overflow-y: scroll;
	}
	.score {
		background-color: var(--color-white);
		color: var(--color-offblack);
		font-size: var(--16px);
		border: 1px solid var(--color-gray-100);
	}
	.score-item {
		text-align: left;
	}
	.team {
		font-weight: 700;
		font-family: 'Bebas Neue';
		font-size: var(--24px);
		transform: translateY(1.5px);
	}
	.city-key {
		font-family: 'Bebas Neue';
		font-size: 1.35rem;
		transform: translateY(1.5px);
	}
	.teamLogo {
		width: 32px;
		height: 32px;
	}
	.teamLogo img {
		width: 32px;
		height: 32px;
	}
	.description {
		color: var(--color-gray-900);
		font-size: var(--12px);
		margin: auto 0;
		padding: 4px;
		white-space: nowrap;
	}
	.stat {
		background-color: var(--color-white);
		color: var(--color-offblack);
		font-size: var(--14px);
		border: 1px solid var(--color-gray-200);
	}
	.statName {
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--color-gray-900);
		font-size: var(--12px);
	}
	.vs {
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--color-gray-900);
		font-size: var(--16px);
	}
	.returnButton {
		display: flex;
		flex-direction: column;
		align-content: flex-end;
		margin-top: 8px;
	}
	button {
		margin: 0;
	}
</style>
