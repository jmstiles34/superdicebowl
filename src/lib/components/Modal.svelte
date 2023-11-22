<script lang="ts">
	import closeIcon from '$lib/images/close.svg';

	export let close: () => void;
	export let showModal: boolean;
	export let hasClose = false;

	let keydown = (e: KeyboardEvent) => {
		e.stopPropagation();
		if (e.key === 'Escape') {
			close();
		}
	};
	let doClose = (e: MouseEvent) => {
		e.stopPropagation();
		close();
	};
</script>

{#if showModal}
	<!-- <div class="backdrop" on:click={doClose} on:keydown={keydown} role="button" tabindex="0"> -->
	<div class="backdrop">
		<div class="modal">
			{#if hasClose}
				<div
					class="closeButton"
					on:click={doClose}
					on:keydown={keydown}
					role="button"
					tabindex="0"
					title="Close"
				>
					<img src={closeIcon} alt="Close Window" />
				</div>
			{/if}
			<slot />
		</div>
	</div>
{/if}

<style>
	.backdrop {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		background: var(--ltmask);
		z-index: 999;
		display: flex;
		justify-content: center;
	}

	.modal {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--white);
		height: fit-content;
		margin: auto 0;
	}

	.closeButton {
		cursor: pointer;
		position: absolute;
		right: 0;
		top: 0;
		margin-top: -18px;
		margin-right: -18px;
	}

	.closeButton img {
		height: 32px;
		width: 32px;
		background-color: var(--white);
		border-radius: 50%;
	}
</style>
