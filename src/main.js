import './assets/style.css'

document.querySelector('#app').innerHTML = `
  <div>
    <header>
      <h1>Notifinancia</h1>
      <p>Gestão de Carteira - Barsi Methodology</p>
    </header>

    <main>
      <section id="summary">
        <div class="card">
          <h3>Patrimônio Total</h3>
          <p id="total-value">R$ 0,00</p>
        </div>
      </section>

      <section id="assets-list">
        <h2>Meus Ativos</h2>
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Qtd</th>
              <th>Preço Médio</th>
              <th>Valor Atual</th>
              <th>Valorização</th>
            </tr>
          </thead>
          <tbody id="assets-table-body">
            </tbody>
        </table>
      </section>
    </main>
  </div>
`
