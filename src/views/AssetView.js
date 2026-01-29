export const AssetView = {
    render(assets) {
        const app = document.querySelector('#app');
        app.innerHTML = `
            <h1>Notifinancia - Meus Ativos</h1>
            <ul>
                ${assets.map(a => `<li>${a.ticker}: ${a.quantity} cotas</li>`).join('')}
            </ul>
        `;
    }
};