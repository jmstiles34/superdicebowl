<script lang="ts">
    import '@fontsource/abril-fatface';
    import '@fontsource/bebas-neue';
    import { fieldData } from '$lib/data/data.json'
</script>

<main>
    <div class="game">
        <div class="field-wrapper">
            <div class="endZone">
                <div class="endZoneElements">
                    <div></div>
                    <div class="helmetLogo">
                        <img alt="Football" src={`/images/football.png`}/>
                    </div>
                    <div 
                        class={`name2`}
                        style={`color: red;`}>
                        Commanders
                    </div>
                    <div class="helmetLogo">
                        <img alt="Football" src={`/images/football.png`}/>
                    </div>
                    <div></div>
                </div>
            </div>
            
            <div class="field">
                {#each fieldData as block, i}
                    <div class="fiveYards">
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

            <div class="endZone">
                <div 
                class={`name nameRight rotateRight`}
                style={`color: red;`}>
                Commanders
            </div>
            </div>
        </div>
    </div>
</main>

<style>
    main {
        position: relative;
        padding: 1rem;
	}
    .game{
        display: flex;
        max-width: 53.125rem;
        min-height: 23.61rem;
        min-width: 37.5rem;
        margin: 0 auto;
        background-color:chartreuse
    }
    
    .field-wrapper {
        display: flex;
        height: auto;
        width: 100%;
        background-color: var(--field);
    }
    .endZone {
        width: 10%;
        border: 0.125rem solid var(--white);
        background-color: var(--yellow);
    }
    .field {
        display: flex;
        width: 80%;
    }
    .fiveYards {
        width: 5%;
        border-top: 2px solid var(--white);
        border-bottom: 2px solid var(--white);
        border-right: 1px solid var(--white);
    }
    .fiveYards:last-child {
        border-right: none;
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
    .endZoneElements{
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 0.25em 3em auto 3em 0.25em;
        gap: 0.25em;
        height: 100%;
    }
    .helmetLogo {
        display: flex;
        justify-content: center;
        margin: auto 0;
        background-color: blueviolet;     
    }
    .helmetLogo img {
        height: 1.25em;
    }
    .name {
        font-weight:700;
        font-family: 'Bebas Neue';
        font-size: 330%;
        position: absolute;
        top: 50%;
    }
    .name2 {
        display: flex;
        font-weight:700;
        font-family: 'Bebas Neue';
        font-size: clamp(2.5rem, 1.2250rem + 4.5333vw, 3.35rem);
        transform: rotate(180deg);
        writing-mode: vertical-lr;
        justify-content: center;
    }
    .nameRight {
        left: 45%;
    }
    .rotateLeft {
        transform:  translateX(-50%) translateY(-50%) rotate(-90deg); 
    }
    .rotateRight {
        transform:  translateX(-50%) translateY(-50%) rotate(90deg);
    }
    @media (max-width: 5rem) {
		.fieldNumber {
			font-size: 1em;
		}
	}
</style>