<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let ref: HTMLDivElement;
	let portal: HTMLDivElement;

	onMount(() => {
		portal = document.createElement('div');
		portal.setAttribute('modal-portal', 'true');
		document.body.appendChild(portal);
		portal.appendChild(ref);

		return () => {
			document.body.removeChild(portal);
		};
	});
</script>

<div bind:this={ref}>
	{@render children()}
</div>
