<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/Settings';

	let { children } = $props();
	const { awayTeam, homeTeam } = $settings;

	$effect.pre(() => {
		if (!awayTeam.id.length || !homeTeam.id.length) {
			goto('/');
		}
	});
</script>

{@render children()}
