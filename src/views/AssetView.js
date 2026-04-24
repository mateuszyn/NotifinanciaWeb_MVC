import { Security } from '../services/security.js';

export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        
        // Blindagem 1: Sanitiza o nome ou e-mail do usuário
        const rawUserName = user.user_metadata?.full_name || user.email.split('@')[0];
        const userName = Security.escapeHTML(rawUserName);
        
        const BROKERS = {
            'Nubank': { color: '#820AD1', textColor: '#FFFFFF', url: 'https://play.google.com/store/apps/details?id=com.nu.production' },
            'Inter': { color: '#FF7A00', textColor: '#FFFFFF', url: 'https://play.google.com/store/apps/details?id=br.com.intermedium' },
            'XP': { color: '#212529', textColor: '#FFFFFF', url: 'https://play.google.com/store/apps/details?id=br.com.xp.carteira' },
            'Rico': { color: '#005AAA', textColor: '#FF8A00', url: 'https://play.google.com/store/apps/details?id=br.com.rico.mobile' }
        };

        const currentBroker = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[currentBroker];

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

            // Blindagem 2: Sanitiza o ticker vindo do banco de dados
            const safeTicker = Security.escapeHTML(asset.ticker);

            // Se for visitante, mostra uma tag "Exemplo". Se for usuário real, mostra Lixeira e Lápis.
            const actionButtons = user.isGuest 
                ? `<span class="badge bg-secondary">Dados de Exemplo</span>`
                : `<button class="btn btn-link p-0 text-primary btn-edit" data-id="${asset.id}" data-ticker="${safeTicker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}">
                       <i class="bi bi-pencil-square fs-4"></i>
                   </button>
                   <button class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}">
                       <i class="bi bi-trash3 fs-4"></i>
                   </button>`;

            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="asset-card ${borderClass}">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="m-0 fw-bold">${safeTicker}</h4>
                            <div class="d-flex gap-3 align-items-center">
                                ${actionButtons}
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
                        
                        <a href="${brokerInfo.url}" target="_blank" class="btn w-100 mt-3 d-flex align-items-center justify-content-center gap-2" 
                           style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; border: none; font-weight: bold; border-radius: 8px; height: 45px;">
                           <i class="bi bi-box-arrow-up-right"></i> Operar na ${currentBroker}
                        </a>
                    </div>
                </div>`;
        }).join('');
        
        app.innerHTML = `
            <header class="bg-dark px-3 py-3 border-bottom border-secondary">
                <div class="header-container container-fluid p-0 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-2 gap-lg-3">
                    
                    <div class="header-brand text-center text-lg-start">
                        <div class="fw-bold text-success title-responsive">NOTIFINANCIA</div>
                        <div class="text-secondary fw-bold subtitle-responsive">
                            Relatórios Diários Sobre Sua Carteira!
                        </div>
                    </div>

                    <div class="d-flex flex-row gap-2 justify-content-center filter-container">
                        <select id="sort-select" class="form-select bg-dark text-white border-secondary form-select-sm" ${user.isGuest ? 'disabled' : ''}>
                            <option value="pm_asc">P.M. (Menor %)</option>
                            <option value="pm_desc">P.M. (Maior %)</option>
                            <option value="name_asc">Nome (A-Z)</option>
                            <option value="total_desc">Valor Total</option>
                        </select>

                        <select id="broker-select" class="form-select border-secondary form-select-sm" 
                                style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; font-weight: bold;" ${user.isGuest ? 'disabled' : ''}>
                            <option value="Nubank" ${currentBroker === 'Nubank' ? 'selected' : ''}>Nubank</option>
                            <option value="Inter" ${currentBroker === 'Inter' ? 'selected' : ''}>Inter</option>
                            <option value="XP" ${currentBroker === 'XP' ? 'selected' : ''}>XP</option>
                            <option value="Rico" ${currentBroker === 'Rico' ? 'selected' : ''}>Rico</option>
                        </select>
                    </div>

                    <div class="d-flex align-items-center justify-content-center gap-3 actions-container">
                        <button id="btn-toggle-notif" class="btn btn-link p-0 shadow-none border-0" ${user.isGuest ? 'disabled' : ''}>
                            <i class="${bellIcon} fs-4" title="${bellTitle}"></i>
                        </button>
                        <span class="text-secondary d-none d-md-block small">
                            Olá, <b class="text-white">${user.isGuest ? 'Visitante' : userName}</b>
                        </span>
                        
                        ${user.isGuest 
                            ? `<button class="btn btn-success btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#loginModal">Entrar</button>` 
                            : `<button id="btn-logout" class="btn btn-outline-danger btn-sm rounded-pill px-3">Sair</button>`
                        }
                    </div>

                </div>
            </header>

            <div class="container mt-4 mb-5 pb-5">
                <div class="row" id="asset-list">${cardsHtml}</div>
            </div>

            ${user.isGuest ? '' : `
            <div id="add-asset-drawer" class="bottom-drawer collapsed"> 
                <div class="drawer-header" id="drawer-toggle">
                    <div class="drag-handle"></div>
                    <button class="btn btn-success w-100 fw-bold py-2 mt-3 fake-add-btn">
                        + NOVO ATIVO
                    </button>
                </div>
                <div class="drawer-content" id="form-container"></div>
            </div>`}

            ${user.isGuest ? '' : this.renderUpdateModal()}
        `;

        // Lógica de Ordenação
        const sortSelect = document.querySelector('#sort-select');
        if (sortSelect && user.sort_by) sortSelect.value = user.sort_by;

        // Lógica da Corretora (Visual e Dinâmica) - Somente para usuários logados
        const brokerSelect = document.querySelector('#broker-select');
        if (brokerSelect && !user.isGuest) {
            brokerSelect.addEventListener('change', (e) => {
                const selected = e.target.value;
                const info = BROKERS[selected];
                
                brokerSelect.style.backgroundColor = info.color;
                brokerSelect.style.color = info.textColor;
                
                brokerSelect.dispatchEvent(new CustomEvent('brokerChanged', { detail: selected }));
            });
        }

        // Lógica da Gaveta - Somente para usuários logados
        const drawer = document.querySelector('#add-asset-drawer');
        const drawerHeader = document.querySelector('#drawer-toggle');
        
        if (drawer && drawerHeader && !user.isGuest) {
            drawerHeader.replaceWith(drawerHeader.cloneNode(true));
            const newDrawerHeader = document.querySelector('#drawer-toggle');
            newDrawerHeader.addEventListener('click', () => {
                drawer.classList.toggle('collapsed');
            });
        }
    },

    renderUpdateModal() {
        return `
            <div class="modal-overlay" id="update-modal-overlay">
                <div class="custom-modal">
                    <h3 class="modal-title text-white fs-5 mb-4 border-bottom border-secondary pb-2">
                        Editar <span id="modal-ticker-title" class="text-success fw-bold"></span>
                    </h3>
                    <form id="form-update-asset">
                        <input type="hidden" id="update-id">
                        <div class="form-group mb-3">
                            <label class="small text-secondary fw-bold mb-1">Quantidade</label>
                            <input type="number" id="update-quantity" class="form-control bg-black text-white border-secondary" required step="any">
                        </div>
                        <div class="form-group mb-4">
                            <label class="small text-secondary fw-bold mb-1">Preço Médio (R$)</label>
                            <input type="number" id="update-averagePrice" class="form-control bg-black text-white border-secondary" required step="0.01">
                        </div>
                        <div class="d-flex gap-3 mt-4">
                            <button type="button" id="btn-close-modal" class="btn btn-outline-secondary flex-grow-1 fw-bold py-2">Cancelar</button>
                            <button type="submit" class="btn btn-success flex-grow-1 fw-bold py-2">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>`;
    }
};