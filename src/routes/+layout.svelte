<script>
    import '$lib/styles/global.css'

    let currentYear = new Date().getFullYear();
  </script>
  
  <div class="header">
    <header class="header">
      <div></div>
    </header>
  </div>

  <main>
    <slot></slot>
  </main>

  <div class="footer">
    <footer>
      <div></div>
    </footer>
  </div>
  
  <style>
    header {
      display: flex;
      flex-flow: column wrap;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .header {
      background-color: var(--smoke);
    }
    main {
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      max-width: 1400px;
      margin: 0 auto;
    }
    footer {
      display: flex;
      flex-flow: column wrap;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .footer {
      background-color: var(--smoke);
    }
  </style>