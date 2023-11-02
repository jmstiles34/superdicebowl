<script lang="ts">
    export let close:()=>void;
    export let showModal:boolean;

    let keydown = (e: KeyboardEvent) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
        close()
        }
    }
    let doClose = (e: MouseEvent) => {
        e.stopPropagation()
        close()
    }
</script>

{#if showModal}
    <div class="backdrop" on:click={doClose} on:keydown={keydown} role="button" tabindex="0">
        <div class="modal">
            <slot/>
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
        background: var(--mask);
        z-index: 999;
        display: flex;
        justify-content: center;
    }
    
    .modal {
        padding: .75rem;
        border-radius: 0.5rem;
        background: var(--white);
        height:fit-content;
        margin: auto 0;
    }
</style>