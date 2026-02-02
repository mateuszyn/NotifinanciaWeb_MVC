export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        const userName = user.user_metadata.full_name || user.email;

        // Geramos o HTML dos cards
        const cardsHtml = assets.map(asset => {
            const profitPct = (((asset.currentPrice / asset.averagePrice) - 1) * 100).toFixed(2);

            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
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
                        <div class="row border-top pt-2 mb-3">
                            <div class="col-6">
                                <p class="price-label">P. Médio (vs Atual)</p>
                                <p class="price-value">R$ ${asset.averagePrice.toFixed(2)} (${profitPct}%)</p>
                            </div>
                            <div class="col-6">
                                <p class="price-label">Preço Atual</p>
                                <p class="price-value">R$ ${asset.currentPrice.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-detail flex-grow-1">DETALHES</button>
                            <button class="btn btn-outline-primary btn-edit" 
                                data-id="${asset.id}" 
                                data-ticker="${asset.ticker}" 
                                data-qty="${asset.quantity}" 
                                data-price="${asset.averagePrice}">
                                EDITAR
                            </button>
                            <button class="btn btn-outline-danger btn-delete" data-id="${asset.id}">
                                DELETAR
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        // Montamos o layout completo
        app.innerHTML = `
            <header class="dashboard-header">
                <div>NOTIFINANCIA: Dashboard</div>
                <div>
                    <span class="me-3">Olá, ${userName}</span>
                    <button id="btn-logout" class="btn btn-outline-danger btn-sm">Sair</button>
                </div>
            </header>

            <div class="container mt-4">
                <div class="row" id="asset-list">
                    ${cardsHtml}
                </div>
                <div id="form-container"></div>
            </div>

            ${this.renderUpdateModal()}
        `;
    },

    renderUpdateModal() {
        return `
    <div class="modal-overlay" id="update-modal-overlay">
        <div class="custom-modal">
            <h3 class="modal-title">Editar <span id="modal-ticker-title"></span></h3>
            <form id="form-update-asset">
                <input type="hidden" id="update-id">
                
                <div class="form-group mb-3">
                    <label for="update-quantity">Quantidade</label>
                    <input type="number" id="update-quantity" class="form-control" required step="any">
                </div>
                
                <div class="form-group mb-3">
                    <label for="update-averagePrice">Preço Médio (R$)</label>
                    <input type="number" id="update-averagePrice" class="form-control" required step="0.01">
                </div>
                
                <div class="d-flex gap-2 mt-4">
                    <button type="button" id="btn-close-modal" class="btn btn-secondary flex-grow-1">Cancelar</button>
                    <button type="submit" class="btn btn-primary flex-grow-1">Salvar</button>
                </div>
            </form>
        </div>
    </div>`;
    }
};