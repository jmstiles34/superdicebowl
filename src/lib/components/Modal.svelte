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
    <div class="backdrop" on:click={doClose} on:keydown={keydown}>
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
    }
    .modal {
        padding: 10px;
        border-radius: 10px;
        max-width: 600px;
        margin: 10% auto;
        text-align: center;
        background: var(--white);
        display: inline-block;
    }
</style>