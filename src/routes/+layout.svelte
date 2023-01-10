<script>
    //import Title from '$lib/title.svelte'
    import '../styles/global.css'
  </script>
  
  <header>
    <h1>HELLO</h1>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <p>Copyright 2022 Ninja Gaming Guides</p>
  </footer>
  
  <style>
    header {
      display: flex;
      justify-content: center;
    }
    main {
      max-width: 960px;
      margin: 20px auto;
    }
    footer {
      text-align: center;
    }
  </style>