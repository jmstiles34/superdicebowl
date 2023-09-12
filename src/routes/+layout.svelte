<script>
	import '../app.postcss';
	import '$lib/styles/global.css';

	let currentYear = new Date().getFullYear();

	/*
  <div class="header">
    <header class="header">
      <div></div>
    </header>
  </div>
  <div class="footer">
    <footer>
      <div></div>
    </footer>
  </div>
  */
</script>

<main>
	<slot />
</main>

<style>
	/*header {
      display: flex;
      flex-flow: column wrap;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .header {
      background-color: var(--smoke);
    }*/
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		max-width: 1400px;
		margin: 0 auto;
	}
	/*footer {
      display: flex;
      flex-flow: column wrap;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .footer {
      background-color: var(--smoke);
    }*/
</style>
