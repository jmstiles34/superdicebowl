<script lang="ts">
    export let showModal = false;

    /* let keydown = (e: KeyboardEvent) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
        close()
        }
    } */
  </script>
  
  {#if showModal}
    <div class="backdrop">
        <div class="modal">
            <slot></slot>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background: var(--mask);
        z-index: 999;
    }
    .modal {
        padding: 10px;
        border-radius: 10px;
        max-width: 400px;
        margin: 10% auto;
        text-align: center;
        background: var(--white);
    }
</style>