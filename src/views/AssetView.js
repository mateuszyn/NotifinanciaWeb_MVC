export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        const userName = user.user_metadata.full_name || user.email;

        const cardsHtml = assets.map(asset => {
            // 1. Cálculos de Performance
            const profitPct = (((asset.currentPrice / asset.averagePrice) - 1) * 100);
            const dailyChange = asset.dailyChange || 0;

            // 2. Lógica de Cores do Texto (Porcentagem)
            const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';

            // 3. Lógica de Cores das Bordas (Complexa)
            let borderClass = 'border-neutral-portfolio'; // Padrão Azul

            if (profitPct > 0) {
                // Valorizado na carteira
                borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
            } else if (profitPct < 0) {
                // Desvalorizado na carteira
                borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';
            }

            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="asset-card ${borderClass}">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="m-0 fw-bold">${asset.ticker}</h4>
                            
                            <div class="d-flex gap-3">
                                <button class="btn btn-link p-0 text-primary btn-edit" 
                                    data-id="${asset.id}" data-ticker="${asset.ticker}" 
                                    data-qty="${asset.quantity}" data-price="${asset.averagePrice}">
                                    <i class="bi bi-pencil-square fs-4"></i>
                                </button>

                                <button class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}">
                                    <i class="bi bi-trash3 fs-4"></i>
                                </button>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-12 col-sm-6 mb-2 mb-sm-0">
                                <p class="price-value mb-0 text-nowrap">
                                    Total: R$ ${(asset.quantity * asset.currentPrice).toFixed(2)}
                                </p>
                            </div>

                            <div class="col-12 col-sm-6 text-sm-end">
                                <p class="small text-secondary fw-bold mb-1">QTD: ${asset.quantity}</p>
                            </div>
                        </div>

                        <div class="row border-top pt-2">
                            <div class="col-6 border-end">
                                <p class="price-label">P. Médio (vs Carteira)</p>
                                <p class="price-value">
                                    R$ ${asset.averagePrice.toFixed(2)} 
                                    <span class="${profitTextClass} small fw-bold">(${profitPct.toFixed(2)}%)</span>
                                </p>
                            </div>
                            <div class="col-6 ps-3">
                                <p class="price-label">Preço Atual (Dia)</p>
                                <p class="price-value">
                                    R$ ${asset.currentPrice.toFixed(2)}
                                    <span class="${dailyTextClass} small fw-bold">(${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%)</span>
                                </p>
                            </div>
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