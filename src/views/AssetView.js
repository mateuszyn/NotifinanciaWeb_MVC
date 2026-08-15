import { Security } from '../infrastructure/security.js';
import { BROKERS } from '../logic/brokers.js';

export const AssetView = {
    render(assets, user) {
        const app = document.querySelector('#app');
        
        const rawUserName = user.user_metadata?.full_name || user.email.split('@')[0];
        const firstNameRaw = rawUserName.split(' ')[0].toLowerCase();
        const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
        const userName = Security.escapeHTML(firstName);
        
        const currentBroker = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[currentBroker] || BROKERS['Nubank'];

        const isNotifActive = user.notifications_enabled;
        const bellIcon = isNotifActive ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';
        const tooltipMessage = isNotifActive 
            ? "Notificações Diárias Ativas (18h)" 
            : "Ative o sininho para receber relatório diário da carteira";

        const cardsHtml = assets.map(asset => {
            const profitPct = asset.variacaoPM || 0;
            const dailyChange = asset.dailyChange || 0;
            const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';

            let borderClass = 'border-neutral-portfolio';
            if (profitPct > 0) borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
            else if (profitPct < 0) borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

            const safeTicker = Security.escapeHTML(asset.ticker);

            const actionButtons = user.isGuest 
                ? `<span class="badge bg-secondary">Dados de Exemplo</span>`
                : `<button class="btn btn-link p-0 text-primary btn-edit" data-id="${asset.id}" data-ticker="${safeTicker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}">
                       <i class="bi bi-pencil-square fs-4"></i>
                   </button>
                   <button class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}">
                       <i class="bi bi-trash3 fs-4"></i>
                   </button>`;

            // Bloco de Dividendos (Retornado com sucesso!)
            const yieldVal = asset.yieldpct || 0;
            const divMensal = asset.divMensal || 0;
            const divAnual = asset.divAnual || 0;

            const dividendSection = `
                <div class="mt-3 pt-2 border-top border-secondary text-start" style="font-size: 0.85rem;">
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Dividend Yield:</span>
                        <b class="text-success">${yieldVal.toFixed(2)}% a.a.</b>
                    </div>
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Provento Mensal (Est.):</span>
                        <b class="text-white">R$ ${divMensal.toFixed(2)}</b>
                    </div>
                    <div class="d-flex justify-content-between text-secondary">
                        <span>Provento Anual (Est.):</span>
                        <b class="text-white">R$ ${divAnual.toFixed(2)}</b>
                    </div>
                </div>
            `;

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
                        
                        ${dividendSection}

                        <a href="${brokerInfo.webUrl}" target="_blank" class="btn w-100 mt-3 d-flex align-items-center justify-content-center gap-2" 
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
                        <button id="btn-toggle-notif" class="btn btn-link p-0 shadow-none border-0" ${user.isGuest ? 'disabled' : ''}
                                data-bs-toggle="tooltip" 
                                data-bs-placement="bottom" 
                                title="${tooltipMessage}">
                            <i class="${bellIcon} fs-4"></i>
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
                
                ${user.isGuest ? '' : `
                <div class="text-center mt-4 mb-5">
                    <button onclick="window.open('https://gemini.google.com/', '_blank')" class="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm" style="background-color: #1a73e8; border: none;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 2c-.3 0-.5.2-.6.5L9.2 8.7 3.5 10.9c-.3.1-.5.3-.5.6s.2.5.5.6l5.7 2.2 2.2 5.7c.1.3.3.5.6.5s.5-.2.6-.5l2.2-5.7 5.7-2.2c.3-.1.5-.3.5-.6s-.2-.5-.5-.6l-5.7-2.2-2.2-5.7c-.1-.3-.3-.5-.6-.5z"/>
                        </svg>
                        Pergunte ao Gemini
                    </button>
                </div>
                `}
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

        const sortSelect = document.querySelector('#sort-select');
        if (sortSelect && user.sort_by) sortSelect.value = user.sort_by;

        const brokerSelect = document.querySelector('#broker-select');
        if (brokerSelect && !user.isGuest) {
            brokerSelect.addEventListener('change', (e) => {
                const selected = e.target.value;
                const info = BROKERS[selected];
                brokerSelect.style.backgroundColor = info.color;
                brokerSelect.style.color = info.textColor;
            });
        }

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
    },

    showUpdateModal(id, ticker, qty, price) {
        document.querySelector('#update-id').value = id;
        document.querySelector('#modal-ticker-title').innerText = ticker;
        document.querySelector('#update-quantity').value = qty;
        document.querySelector('#update-averagePrice').value = price;
        document.querySelector('#update-modal-overlay')?.classList.add('active');
    },

    closeUpdateModal() {
        document.querySelector('#update-modal-overlay')?.classList.remove('active');
    },

    closeAddDrawer() {
        document.querySelector('#add-asset-drawer')?.classList.add('collapsed');
    },

    clearAddForm() {
        const t = document.querySelector('#asset-ticker');
        const q = document.querySelector('#quantity');
        const p = document.querySelector('#averagePrice');
        if (t) t.value = '';
        if (q) q.value = '';
        if (p) p.value = '';
    },

    setPriceLoading(isLoading) {
        const priceInput = document.querySelector('#averagePrice');
        if (!priceInput) return;
        
        if (isLoading) {
            priceInput.dataset.originalPlaceholder = priceInput.placeholder;
            priceInput.value = '';
            priceInput.placeholder = "Buscando...";
            priceInput.disabled = true;
        } else {
            priceInput.placeholder = priceInput.dataset.originalPlaceholder || '';
            priceInput.disabled = false;
        }
    },

    setPriceValue(price) {
        const priceInput = document.querySelector('#averagePrice');
        if (priceInput) priceInput.value = price;
    },

    focusPriceInput() {
        document.querySelector('#averagePrice')?.focus();
    },

    bindEvents(handlers) {
        const app = document.querySelector('#app');
        if (!app) return;

        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-retry-price')) {
                const ticker = document.querySelector('#asset-ticker')?.value.toUpperCase().trim();
                handlers.onRetryPrice(ticker);
                return;
            }

            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete) {
                handlers.onDeleteAsset(btnDelete.dataset.id);
                return;
            }

            const btnEdit = e.target.closest('.btn-edit');
            if (btnEdit) {
                this.showUpdateModal(
                    btnEdit.dataset.id,
                    btnEdit.dataset.ticker,
                    btnEdit.dataset.qty,
                    btnEdit.dataset.price
                );
                return;
            }

            const overlay = document.querySelector('#update-modal-overlay');
            if (e.target.closest('#btn-close-modal') || e.target === overlay) {
                this.closeUpdateModal();
                return;
            }

            const btnNotif = e.target.closest('#btn-toggle-notif');
            if (btnNotif) {
                const icon = btnNotif.querySelector('i');
                handlers.onToggleNotif(icon);
                return;
            }

            if (e.target.closest('#btn-logout')) {
                handlers.onLogout();
                return;
            }
        });

        app.addEventListener('change', (e) => {
            const sortSelect = e.target.closest('#sort-select');
            if (sortSelect) {
                handlers.onSortChange(sortSelect.value);
                return;
            }

            const brokerSelect = e.target.closest('#broker-select');
            if (brokerSelect) {
                handlers.onBrokerChange(brokerSelect.value);
                return;
            }
        });

        app.addEventListener('submit', (e) => {
            const formUpdate = e.target.closest('#form-update-asset');
            if (formUpdate) {
                e.preventDefault();
                handlers.onUpdateAsset(
                    document.querySelector('#update-id').value,
                    document.querySelector('#update-quantity').value,
                    document.querySelector('#update-averagePrice').value
                );
                return;
            }

            const formCreate = e.target.closest('#form-asset');
            if (formCreate) {
                e.preventDefault();
                handlers.onCreateAsset(
                    document.querySelector('#asset-ticker')?.value.toUpperCase().trim(),
                    document.querySelector('#quantity')?.value,
                    document.querySelector('#averagePrice')?.value
                );
                return;
            }
        });

        app.addEventListener('focusout', (e) => {
            if (e.target && e.target.id === 'asset-ticker') {
                const priceInput = document.querySelector('#averagePrice');
                if (priceInput && !priceInput.value) {
                    handlers.onTickerFocusOut(e.target.value.toUpperCase().trim());
                }
            }
        });
    }
};