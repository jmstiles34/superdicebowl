<script lang="ts">
	import { onMount } from 'svelte';

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
	<slot />
</div>
