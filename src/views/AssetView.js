export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        const userName = user.user_metadata.full_name || user.email;

        app.innerHTML = `
            <header class="dashboard-header">
                <div>NOTIFINANCIA: Dashboard</div>
                <div>
                    <span class="me-3">Olá, ${userName}</span>
                    <button id="btn-logout" class="btn btn-outline-danger btn-sm">Sair</button>
                </div>
            </header>

            <div class="container">
                <div class="row" id="asset-list">
                    ${assets.map(asset => {
                        const profit = (asset.currentPrice - asset.averagePrice) * asset.quantity;
                        const profitPct = (((asset.currentPrice / asset.averagePrice) - 1) * 100).toFixed(2);
                        
                        return `
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="asset-card">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h4 class="m-0">${asset.ticker}</h4>
                                    <span class="badge-ativo">ATIVO</span>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <p class="price-label">Qtd: ${asset.quantity}</p>
                                        <p class="price-value">Total: R$ ${(asset.quantity * asset.currentPrice).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div class="row border-top pt-2">
                                    <div class="col-6">
                                        <p class="price-label">P. Médio (vs Atual)</p>
                                        <p class="price-value">R$ ${asset.averagePrice.toFixed(2)} (${profitPct}%)</p>
                                    </div>
                                    <div class="col-6">
                                        <p class="price-label">Preço Atual</p>
                                        <p class="price-value">R$ ${asset.currentPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button class="btn btn-detail">DETALHES</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div id="form-container"></div>
            </div>
        `;
    }
};