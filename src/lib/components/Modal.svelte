<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import closeIcon from '$lib/images/close.svg';
	import ModalPortal from './modal/ModalPortal.svelte';
	import TrapFocus from './modal/TrapFocus.svelte';
	import { NOOP } from '$lib/constants/constants';
	import type { Snippet } from 'svelte';
	import { self, stopPropagation } from '$lib/utils/events';

	type ModalProps = {
		children: Snippet;
		choiceRequired?: boolean;
		close: () => void;
		hasClose?: boolean;
		initialFocusElement?: HTMLElement | null;
		returnFocusElement?: HTMLElement | null;
		showModal: boolean;
	};

	let {
		children,
		choiceRequired = true,
		close,
		hasClose = false,
		initialFocusElement = null,
		returnFocusElement = null,
		showModal
	}: ModalProps = $props();

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

<svelte:window onkeydown={keydown} />

{#if showModal}
	<ModalPortal>
		<div
			class="backdrop"
			onclick={self(stopPropagation(choiceRequired ? NOOP : doClose))}
			onkeydown={self(stopPropagation(choiceRequired ? NOOP : keydown))}
			role="button"
			tabindex="-1"
			transition:fade={{ duration: 150 }}
		>
			<div
				class="modal"
				aria-modal="true"
				role="dialog"
				tabindex="-1"
				transition:scale={{ duration: 180, start: 0.92 }}
			>
				{#if hasClose}
					<div
						class="close-button"
						onclick={doClose}
						onkeydown={keydown}
						role="button"
						tabindex="0"
						title="Close"
						aria-label="Close"
					>
						<img src={closeIcon} alt="Close Window" />
					</div>
				{/if}
				<TrapFocus {initialFocusElement} {returnFocusElement} {hasClose}>
					<div>
						{@render children()}
					</div>
				</TrapFocus>
			</div>
		</div>
	</ModalPortal>
{/if}

<style>
	/* ── Backdrop ─────────────────────────────────────────────── */
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--modal-backdrop);
		z-index: 999;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* ── Modal panel ──────────────────────────────────────────── */
	.modal {
		position: relative;
		padding: var(--space-4);
		border-radius: var(--modal-radius);
		background: var(--modal-bg);
		border: 2px solid var(--modal-border);
		box-shadow: var(--modal-shadow);
		height: fit-content;
		max-height: 90vh;
		overflow-y: auto;
		/* Prevent backdrop clicks from passing through */
		pointer-events: all;
	}

	/* ── Close button ─────────────────────────────────────────── */
	.close-button {
		position: sticky;
		top: 0;
		float: right;
		margin-top: calc(-1 * var(--space-6));
		margin-right: calc(-1 * var(--space-4));
		cursor: pointer;
		z-index: 1;
		padding-right: var(--space-2);
		transition: opacity var(--dur-fast) var(--ease-snes);
		opacity: 0.7;
	}

	.close-button:hover {
		opacity: 1;
	}

	.close-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
		border-radius: var(--radius-sm);
	}

	.close-button img {
		height: 20px;
		width: 20px;
		display: block;
		filter: var(--icon-filter-default);
		transition: filter var(--dur-fast) var(--ease-snes);
	}

	.close-button:hover img {
		filter: var(--icon-filter-hover);
	}
</style>