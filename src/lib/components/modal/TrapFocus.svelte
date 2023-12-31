<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	// Props
	export let initialFocusElement: HTMLElement | null;
	export let returnFocusElement: HTMLElement | null;
	export let hasClose = false;

	let ref: HTMLElement;
	let tabbableChildren: Element[];
	let firstTabbableChild: Element;
	let lastTabbableChild: Element;
	let returnFocusElem: Element | null;

	onMount(() => {
		returnFocusElem = returnFocusElement || document.activeElement;
		tabbableChildren = [...ref.querySelectorAll('*')].filter(
			(node) => (node as HTMLElement).tabIndex >= 0
		);
		firstTabbableChild = tabbableChildren[0];
		lastTabbableChild = tabbableChildren[tabbableChildren.length - 1];

		// Wait for children to mount before trying to focus `initialFocusElement`
		tick().then(() => {
			if (initialFocusElement) {
				initialFocusElement.focus();
			} else {
				const initialFocusElem =
					ref.querySelector('[autofocus]') ||
					(hasClose ? tabbableChildren[1] : firstTabbableChild) ||
					ref.querySelector('[modal-content]');

				(initialFocusElem as HTMLElement).focus();
			}
		});
	});

	onDestroy(() => {
		if (returnFocusElem) {
			(returnFocusElem as HTMLElement).focus();
		}
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Tab') {
			return;
		}

		if (tabbableChildren.length === 0) {
			event.preventDefault();
		}

		if (event.shiftKey) {
			// Handle shift + tab
			if (document.activeElement === firstTabbableChild) {
				event.preventDefault();
				(lastTabbableChild as HTMLElement).focus();
			}
		} else {
			if (document.activeElement === lastTabbableChild) {
				event.preventDefault();
				(firstTabbableChild as HTMLElement).focus();
			}
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<div bind:this={ref}>
	<slot />
</div>
