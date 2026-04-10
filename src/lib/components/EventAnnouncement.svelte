<script lang="ts">
	type AnnouncementType = 'touchdown' | 'turnover' | 'fieldgoal' | 'safety';

	type Props = {
		text: string;
		type: AnnouncementType;
		key: number;
	};

	let { text, type, key }: Props = $props();
	let visible = $state(false);

	$effect(() => {
		if (key > 0 && text) {
			visible = true;
			const timer = setTimeout(() => (visible = false), 1800);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if visible}
	<div class="announcement-overlay">
		{#key key}
			<div class="announcement-text {type}" aria-live="assertive">
				{text}
			</div>
		{/key}
	</div>
{/if}

<style>
	.announcement-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		pointer-events: none;
		overflow: hidden;
	}

	.announcement-text {
		font-family: var(--font-display);
		font-size: clamp(2rem, 1rem + 6vw, 5rem);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		white-space: nowrap;
		text-shadow:
			0 0 20px currentColor,
			0 0 40px currentColor,
			2px 2px 0 rgba(0, 0, 0, 0.6);
		animation: announce 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.touchdown {
		color: gold;
	}

	.turnover {
		color: #ff4444;
		animation: announce-shake 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.fieldgoal {
		color: var(--color-on-accent);
	}

	.safety {
		color: #ff8c00;
	}

	@keyframes announce {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		15% {
			transform: scale(1.1);
			opacity: 1;
		}
		50% {
			transform: scale(1.15);
			opacity: 1;
		}
		100% {
			transform: scale(3);
			opacity: 0;
		}
	}

	@keyframes announce-shake {
		0% {
			transform: scale(0) rotate(0deg);
			opacity: 0;
		}
		8% {
			transform: scale(1.05) rotate(-3deg);
			opacity: 1;
		}
		12% {
			transform: scale(1.1) rotate(3deg);
			opacity: 1;
		}
		16% {
			transform: scale(1.1) rotate(-2deg);
			opacity: 1;
		}
		20% {
			transform: scale(1.15) rotate(0deg);
			opacity: 1;
		}
		50% {
			transform: scale(1.15) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: scale(3) rotate(0deg);
			opacity: 0;
		}
	}
</style>
