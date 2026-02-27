export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        const userName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        const BROKERS = {
            'Nubank': { color: '#820AD1', textColor: '#FFFFFF', webUrl: 'https://nubank.com.br/', appUrl: 'https://play.google.com/store/apps/details?id=com.nu.production' },
            'Inter': { color: '#FF7A00', textColor: '#FFFFFF', webUrl: 'https://inter.co/', appUrl: 'https://play.google.com/store/apps/details?id=br.com.intermedium' },
            'XP': { color: '#212529', textColor: '#FFFFFF', webUrl: 'https://www.xpi.com.br/login/', appUrl: 'https://play.google.com/store/apps/details?id=br.com.xp.investimentos' },
            'Rico': { color: '#005AAA', textColor: '#FF8A00', webUrl: 'https://www.rico.com.vc/login/', appUrl: 'https://play.google.com/store/apps/details?id=com.rico.fox' }
        };

        const currentBroker = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[currentBroker];
        const isMobile = /Android|iPhone/i.test(navigator.userAgent);
        const targetUrl = isMobile ? brokerInfo.appUrl : brokerInfo.webUrl;

        // Lógica de Notificação
        const isNotifActive = user.notifications_enabled;
        const bellIcon = isNotifActive ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';
        const bellTitle = isNotifActive ? "Notificações Diárias (18h) Ativadas" : "Notificações Diárias (18h) Desativadas";

        const cardsHtml = assets.map(asset => {
            const profitPct = asset.variacaoPM || 0;
            const dailyChange = asset.dailyChange || 0;
            const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';

            let borderClass = 'border-neutral-portfolio';
            if (profitPct > 0) borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
            else if (profitPct < 0) borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="asset-card ${borderClass}">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="m-0 fw-bold">${asset.ticker}</h4>
                            <div class="d-flex gap-3">
                                <button class="btn btn-link p-0 text-primary btn-edit" data-id="${asset.id}" data-ticker="${asset.ticker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}">
                                    <i class="bi bi-pencil-square fs-4"></i>
                                </button>
                                <button class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}">
                                    <i class="bi bi-trash3 fs-4"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <p class="price-value mb-0">Total: R$ ${(asset.quantity * asset.currentPrice).toFixed(2)}</p>
                                <p class="small text-secondary fw-bold">QTD: ${asset.quantity}</p>
                            </div>
                        </div>
                        <div class="row border-top pt-2">
                            <div class="col-6 border-end">
                                <p class="price-label">P. Médio</p>
                                <p class="price-value">R$ ${asset.averagePrice.toFixed(2)} <span class="${profitTextClass} small">(${profitPct.toFixed(2)}%)</span></p>
                            </div>
                            <div class="col-6 ps-3">
                                <p class="price-label">Preço Atual</p>
                                <p class="price-value">R$ ${asset.currentPrice.toFixed(2)} <span class="${dailyTextClass} small">(${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%)</span></p>
                            </div>
                        </div>
                        
                        <a href="${targetUrl}" target="_blank" class="btn w-100 mt-3 d-flex align-items-center justify-content-center gap-2" 
                           style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; border: none; font-weight: bold; border-radius: 8px; height: 45px;">
                           <i class="bi bi-box-arrow-up-right"></i> Operar na ${currentBroker}
                        </a>
                    </div>
                </div>`;
        }).join('');

        app.innerHTML = `
            <header class="dashboard-header d-flex justify-content-between align-items-center p-3">
                <div class="fw-bold fs-5 text-success">NOTIFINANCIA</div>
                
                <div class="header-controls shadow-sm">
                    <div class="sort-container">
                        <select id="sort-select">
                            <option value="pm_asc">Variação P.M. (Menor %)</option>
                            <option value="pm_desc">Variação P.M. (Maior %)</option>
                            <option value="name_asc">Nome (A-Z)</option>
                            <option value="total_desc">Maior Valor Total</option>
                        </select>
                    </div>

                    <div class="broker-container">
                        <select id="broker-select">
                            <option value="Nubank" ${currentBroker === 'Nubank' ? 'selected' : ''}>Nubank</option>
                            <option value="Inter" ${currentBroker === 'Inter' ? 'selected' : ''}>Inter</option>
                            <option value="XP" ${currentBroker === 'XP' ? 'selected' : ''}>XP</option>
                            <option value="Rico" ${currentBroker === 'Rico' ? 'selected' : ''}>Rico</option>
                        </select>
                    </div>

                    <button id="btn-toggle-notif" class="btn btn-link p-0 shadow-none border-0" title="${bellTitle}">
                        <i class="${bellIcon} fs-4"></i>
                    </button>
                </div>

                <div class="d-flex align-items-center gap-3">
                    <span class="d-none d-lg-inline text-secondary">Olá, <b>${userName}</b></span>
                    <button id="btn-logout" class="btn btn-outline-danger btn-sm rounded-pill">Sair</button>
                </div>
            </header>

            <div class="container mt-4">
                <div class="row" id="asset-list">${cardsHtml}</div>
                <div id="form-container"></div>
            </div>
            ${this.renderUpdateModal()}
        `;

        const sortSelect = document.querySelector('#sort-select');
        if (sortSelect && user.sort_by) sortSelect.value = user.sort_by;

        // Sincroniza o visual do broker-select (cor e valor)
        const brokerSelect = document.querySelector('#broker-select');
        if (brokerSelect) {
            brokerSelect.value = currentBroker;
            brokerSelect.style.backgroundColor = brokerInfo.color;
            brokerSelect.style.color = brokerInfo.textColor;
        }
    },

    renderUpdateModal() {
        return `
            <div class="modal-overlay" id="update-modal-overlay">
                <div class="custom-modal">
                    <h3 class="modal-title">Editar <span id="modal-ticker-title"></span></h3>
                    <form id="form-update-asset">
                        <input type="hidden" id="update-id">
                        <div class="form-group mb-3">
                            <label>Quantidade</label>
                            <input type="number" id="update-quantity" class="form-control" required step="any">
                        </div>
                        <div class="form-group mb-3">
                            <label>Preço Médio (R$)</label>
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