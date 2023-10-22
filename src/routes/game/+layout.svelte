<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { settings } from '$lib/stores/Settings'

    const {awayTeam, homeTeam} = $settings;
    onMount(() => {
        if(!awayTeam.id.length || !homeTeam.id.length){
            goto('/')
        }
    });
</script>

<slot />