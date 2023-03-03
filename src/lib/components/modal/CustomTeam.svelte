<script lang="ts">
    import { browser } from "$app/environment";
	import CustomHelmet from "$lib/components/CustomHelmet.svelte";
    import { logos } from '$lib/data/logos.json'
    export let close: ()=>void;

    let bg = "#ffffff";
    let faceMask = "#79868B";
    let helmet = "#869397";
    let stripe = "#ffffff";
    let trim = "#002244";
    let primaryColor = "#002244";
    let secondaryColor = "#869397";
    let logo = ""
    let city = "";
    let name = "";
    let errors:string[] = [];

    function saveTeam(){
        errors = [];
        !city.length && errors.push("city")
        !name.length && errors.push("name")
        !logo.length && errors.push("logo")
        
        if(!errors.length){
            let lsTeams = localStorage.getItem('customTeams') || "";
            if(lsTeams){
                lsTeams = JSON.parse(lsTeams);
            }
            
            const customTeams = [
                ...lsTeams,
                {
                    id: crypto.randomUUID(),
                    isCustom: true,
                    city,
                    name,
                    key: city.substring(0,3).toUpperCase(),
                    primaryColor,
                    secondaryColor,
                    logo,
                    helmet,
                    faceMask,
                    stripe,
                    trim
                }
            ]
            
            browser && localStorage.setItem('customTeams', JSON.stringify(customTeams));
            close();
        }
    }
</script>

<div on:click|stopPropagation on:keydown|stopPropagation>
    <div>
        <h3>Add a Custom Team</h3>
    </div>
    <div class="container">
        <div class="form-row">
            <div class="form-label">Location:</div>
            <input type="text" maxlength="15" id="city" bind:value={city} class:error={errors.includes('city')}>
            <div class="form-label">Endzone:</div>
            <input type="color" id="primaryColor" bind:value={primaryColor}>
        </div>
        <div class="form-row">
            <div class="form-label">Name:</div>
            <input type="text" maxlength="10" id="name" bind:value={name} class:error={errors.includes('name')}>
            <div class="form-label">Text:</div>
            <input type="color" id="secondaryColor" bind:value={secondaryColor}>
        </div>
        <div class="form-row">
            <div>
                <div class="form-row">
                    <label class="form-label" for="logo">Logo:</label>
                    <select id="logo" bind:value={logo} class:error={errors.includes('logo')}>
                        <option value="">Choose...</option>
                        {#each logos as logo}
                            <option value={logo.file}>{logo.name}</option>
                        {/each}
                    </select>
                </div>
                <div class="form-row">
                    <label class="form-label" for="helmet">Helmet:</label>
                    <input type="color" id="helmet" bind:value={helmet}>
                </div>
                <div class="form-row">
                    <label class="form-label" for="secondaryColor">Face Mask:</label>
                    <input type="color" id="faceMask" bind:value={faceMask}>
                </div>
                <div class="form-row">
                    <label class="form-label" for="stripe">Stripe 1:</label>
                    <input type="color" id="stripe" bind:value={stripe}>
                </div>
                <div class="form-row">
                    <label class="form-label" for="secondaryColor">Stripe 2:</label>
                    <input type="color" id="trim" bind:value={trim}>
                </div> 
            </div>

                <CustomHelmet 
                    {bg}
                    {faceMask} 
                    {helmet}
                    {stripe}
                    {trim}
                    {logo}
                    height={200}
                    width={200} 
                />
        </div>
    </div>
    <div class="button-row">
        <button class="save-button" on:click={saveTeam}>
            Save Custom Team
        </button>
    </div>
</div>

<style>
    h3 {
        color: var(--black);
    }
    .button-row{
        display: flex;
        padding: 5px;
        justify-content: center;
    }
    .container {
        display: flex;
        flex-direction: column;
    }
    .error {
        border-color: var(--error);
    }
    .form-label{
        color: var(--black);
        font-family: var(--mono);
        width: 110px;
        text-align: right;
        padding-right: 5px;
    }
    .form-row{
        display: flex;
        padding: 5px;
    }
    .save-button {
        margin: 0 15px;
        min-width: 150px;
        cursor: pointer;
        font-family: var(--mono);
    }
</style>