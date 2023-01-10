<script>
    let teamsJson = fetch('/teams.json')
    .then(res => res.json())
    .then((data) => {
    console.log(data)
  });
</script>

<main>
<img alt="Dallas Cowboys" src='/logos/Cowboys.png'/>
</main>

<style>

</style>