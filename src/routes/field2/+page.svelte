
<script lang="ts">
    import '@fontsource/abril-fatface';
    import '@fontsource/bebas-neue';
    import { fieldData } from '$lib/data/data.json'
</script>

<div class="wrapper">
    <div class="field-container">
        <div class="endzone"></div>
        <div class="field">
            {#each fieldData as block, i}
                <div class:yards-home={i<=9} class:yards-away={i>9}>
                    <div class="hashes"></div>
                    <div class={`upper fieldNumber flipV ${i % 2 ? 'number' : 'zero' }`}>
                        {block.upperNumber}
                    </div>
                    <div class="first-mid hashes"></div>
                    <div class="second-mid hashes"></div>
                    <div class={`lower fieldNumber ${i % 2 ? 'number' : 'zero' }`}>
                        {block.lowerNumber}
                    </div>
                    <div class="lower hashes"></div>
                </div>
            {/each}
        </div>  
        <div class="endzone"></div>
    </div>
    <div class="fieldLogo">
        <img 
            alt={`Team Logo`} 
            src={`/logos/Cowboys.png`}
        />
    </div>
    <div 
            class="football"
            style:left={`50%`}
            style:transition={'left 0.5s ease-in-out, top 0.5s ease-in-out, rotate 0s ease-in-out'
            }
        >
            <img alt="Football" src={`/images/football.png`}/>
        </div>
</div>
<style>
    .wrapper {
        min-height: 23.61rem;
        max-width: 53.125rem;
        min-width: 37.5rem;
        margin: 0 auto;
    }

    .field-container {
        display: grid;
        grid-template-columns: 10% auto 10%;
        min-height: 23.61rem;
        max-width: 53.125rem;
        min-width: 37.5rem;
        background-color: var(--field);
    }
    .endzone {
        border: 2px solid var(--white);
        background-color: var(--yellow);
    }
    .field {
        display: grid;
        grid-template-columns: repeat(20, 5%);
    }
    .fieldLogo {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: 16%;
        transform: translate(-50%, -50%);
    }
    .fieldLogo img {
        width: 100%;
        opacity: .8;
    }
    .football {
        position: absolute;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        z-index: 10;
        width: 4.5%;
    }
    .football img {
        width: 100%;
        transition: all 0.5s ease-in-out;
    }
    .yards-away {
        border-top: 2px solid var(--white);
        border-bottom: 2px solid var(--white);
        border-left: 1px solid var(--white);
    }
    .yards-home {
        border-top: 2px solid var(--white);
        border-bottom: 2px solid var(--white);
        border-right: 1px solid var(--white);
    }
    .fieldNumber {
        position: absolute;
        color:  var(--white);
        font-size: clamp(0.5rem, 0.2250rem + 2.4000vw, 1.5rem);
        font-family: 'Abril Fatface', sans-serif;
        opacity: .95;
    }
    .upper.fieldNumber {
        top: 3.5rem;
    }
    .lower.fieldNumber {
        bottom: 3.5rem;
    }
    .number {
        right: .25rem;
    }
    .zero {
        left: .25rem;
    }
    .flipV {
        transform: scale(-1, -1);
        -moz-transform: scale(-1, -1);
        -webkit-transform: scale(-1, -1);
        -o-transform: scale(-1 -1);
        -ms-transform: scale(-1, -1);
    }
    .hashes {
        position: absolute;
        left: 15%;
        right: 0;
        height: 3%;
        background: -webkit-linear-gradient(left, var(--white) 25%, transparent 25%);
        background-size: 25% 100%;
    }
    .first-mid.hashes {
        top: 39.25%;
    }
    .second-mid.hashes {
        top: 59.25%;
    }
    .lower.hashes {
        bottom: 0;
    }
</style>