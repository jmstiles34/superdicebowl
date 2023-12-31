<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import closeIcon from '$lib/images/close.svg';
	import ModalPortal from './modal/ModalPortal.svelte';
	import TrapFocus from './modal/TrapFocus.svelte';
	import { NOOP } from '$lib/constants/constants';

	export let close: () => void;
	export let showModal: boolean;
	export let choiceRequired = true;
	export let hasClose = false;
	export let initialFocusElement: HTMLElement | null = null;
	export let returnFocusElement: HTMLElement | null = null;

	let keydown = (e: KeyboardEvent) => {
		e.stopPropagation();
		if (e.key === 'Enter' || e.key === 'Escape') {
			close();
		}
	};
	let doClose = (e: MouseEvent) => {
		e.stopPropagation();
		close();
	};
</script>

<svelte:window on:keydown={keydown} />

{#if showModal}
	<ModalPortal>
		<div
			class="backdrop"
			on:click|self|stopPropagation={choiceRequired ? NOOP : doClose}
			on:keydown|self|stopPropagation={choiceRequired ? NOOP : keydown}
			role="button"
			tabindex="-1"
			transition:fade
		>
			<div class="modal" aria-modal="true" role="dialog" tabindex="-1" transition:scale>
				<TrapFocus {initialFocusElement} {returnFocusElement} {hasClose}>
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
					<div>
						<slot />
					</div>
				</TrapFocus>
			</div>
		</div>
	</ModalPortal>
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
		padding: 12px;
		border-radius: 8px;
		background: var(--color-white);
		height: fit-content;
		margin: auto 0;
	}

	.closeButton {
		cursor: pointer;
		position: absolute;
		right: 0;
		top: 0;
		margin-top: -30px;
		margin-right: -30px;
	}

	.closeButton img {
		height: 32px;
		width: 32px;
		background-color: var(--color-white);
		border-radius: 50%;
	}
</style>
