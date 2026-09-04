import { Security } from '../infrastructure/security.js';
import { BROKERS } from '../utils/brokers.js';
import { AssetService } from '../services/asset-service.js';

export const AssetView = {
    render(assets, user) {
        // --- TRAVA 1: CORREÇÃO DO BUG DE ROTAS ---
        const currentHash = window.location.hash;
        if (currentHash !== '' && currentHash !== '#/') return;

        const app = document.querySelector('#app');

        // --- TRAVA 2: CORREÇÃO DA GAVETA (ADD ASSET) FECHANDO SOZINHA ---
        const existingDrawer = document.querySelector('#add-asset-drawer');
        const isDrawerOpen = existingDrawer && !existingDrawer.classList.contains('collapsed');

        const userName = Security.escapeHTML((user.user_metadata?.full_name || user.email.split('@')[0]).split(' ')[0]);
        const brokerInfo = BROKERS[user.preferred_broker || 'Nubank'];
        const isNotifActive = user.notifications_enabled;

        const portfolioSummary = AssetService.calculatePortfolioSummary(assets);
        const formatCurrency = value => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
        const profitClass = portfolioSummary.profit >= 0 ? 'positive' : 'negative';
        let portfolioBorderClass = 'border-neutral-portfolio';
        if (portfolioSummary.profit > 0) {
            portfolioBorderClass = portfolioSummary.dailyChangePct >= 0
                ? 'border-profit-viva-pos'
                : 'border-profit-dia-neg';
        } else if (portfolioSummary.profit < 0) {
            portfolioBorderClass = portfolioSummary.dailyChangePct >= 0
                ? 'border-loss-dia-pos'
                : 'border-loss-viva-neg';
        }

        const cardsHtml = assets.length > 0 ? assets.map(asset => {
            const safeTicker = Security.escapeHTML(asset.ticker);
            const profitTextClass = asset.variacaoPm >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyTextClass = asset.dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            let borderClass = 'border-neutral-portfolio';
            if (asset.variacaoPm > 0) borderClass = asset.dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
            else if (asset.variacaoPm < 0) borderClass = asset.dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

            let snowballMessage = `Faltam ${Math.max(0, asset.cotasParaBolaDeNeve - asset.quantity)} cotas para a Bola de Neve`;
            let snowballColor = asset.quantity >= asset.cotasParaBolaDeNeve ? '#8fe3a7' : '#ff8a8a';

            let dividendContent = `
                <div class="d-flex justify-content-around">
                    <div>
                        <p class="small text-secondary mb-0">Renda Mensal</p>
                        <p class="fw-bold mb-0 text-white">R$ ${asset.divMensal.toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-0">Renda Anual</p>
                        <p class="fw-bold mb-0 text-white">R$ ${asset.divAnual.toFixed(2)}</p>
                    </div>
                </div>
            `;

            if (asset.dataError) {
                dividendContent = `<div class="text-center p-2"><p class="small text-warning">Erro ao carregar dados.</p></div>`;
            }

            const actionButtons = user.isGuest ? `<span class="badge bg-secondary">Exemplo</span>` : `
                   <span id="actions-${asset.ticker}" class="d-flex align-items-center gap-2">
                       <button class="btn btn-link p-0 btn-edit" data-id="${asset.id}" data-ticker="${safeTicker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}"><i class="bi bi-pencil text-primary fs-4"></i></button>
                       <button class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}"><i class="bi bi-trash3 text-danger fs-4"></i></button>
                   </span>`;

            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="asset-card ${borderClass}">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="m-0 fw-bold">${safeTicker}</h4>
                            ${actionButtons}
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <p class="price-value mb-0">Total: R$ ${asset.totalValue.toFixed(2)}</p>
                                <p class="small text-secondary fw-bold mb-1">QTD: ${asset.quantity}</p>
                            </div>
                        </div>
                        <div class="row border-top border-bottom border-secondary py-2 mb-3">
                            <div class="col-6 border-end border-secondary">
                                <p class="price-label">P. Médio</p>
                                <p class="price-value">R$ ${asset.averagePrice.toFixed(2)} <span class="${profitTextClass} small">(${asset.variacaoPm.toFixed(2)}%)</span></p>
                            </div>
                            <div class="col-6 ps-3">
                                <p class="price-label">Preço Atual</p>
                                <p class="price-value">R$ ${asset.currentPrice.toFixed(2)} <span class="${dailyTextClass} small">(${asset.dailyChange.toFixed(2)}%)</span></p>
                            </div>
                        </div>
                        <div class="bg-dark rounded p-2 text-center border border-secondary">${dividendContent}</div>
                    </div>
                </div>`;
        }).join('') : '';

        app.innerHTML = `
            <header class="bg-dark px-3 py-3 border-bottom border-secondary">
                <div class="container-fluid d-flex justify-content-between align-items-center">
                    <div class="text-success fw-bold">NOTIFINANCIA</div>
                    <div class="d-flex gap-2">
                        <select id="sort-select" class="form-select form-select-sm" ${user.isGuest ? 'disabled' : ''}>
                            <option value="pm_asc">P.M.</option>
                        </select>
                    </div>
                    <div class="text-secondary small">Olá, <b class="text-white">${userName}</b></div>
                </div>
            </header>
            <div class="container mt-4 mb-5 pb-5">
                <section class="portfolio-summary ${portfolioBorderClass} mb-4" aria-label="Resumo consolidado da carteira">
                    <div class="portfolio-summary-header">
                        <div>
                            <span class="summary-eyebrow">Visão consolidada</span>
                            <h2 class="summary-title">Painel da Carteira</h2>
                        </div>
                    </div>
                    <div class="portfolio-summary-grid">
                        <div class="summary-metric summary-metric-highlight">
                            <span>Patrimônio atual</span>
                            <strong>${formatCurrency(portfolioSummary.currentValue)}</strong>
                        </div>
                        <div class="summary-metric">
                            <span>Variação global</span>
                            <strong class="${profitClass}">${formatCurrency(portfolioSummary.profit)}</strong>
                            <small class="${profitClass}">${portfolioSummary.profitPct >= 0 ? '+' : ''}${portfolioSummary.profitPct.toFixed(2)}%</small>
                        </div>
                        <div class="summary-metric">
                            <span>DY esperado anual</span>
                            <strong>${formatCurrency(portfolioSummary.annualDividends)}</strong>
                        </div>
                        <div class="summary-metric">
                            <span>DY médio mensal</span>
                            <strong>${portfolioSummary.monthlyYieldPct.toFixed(2)}%</strong>
                            <small>${formatCurrency(portfolioSummary.annualDividends / 12)} / mês</small>
                        </div>
                    </div>
                </section>
                <div class="row" id="asset-list">${cardsHtml}</div>
                
                ${user.isGuest ? '' : `
                <div class="d-flex flex-column align-items-center mt-5 mb-5">
                    <button onclick="window.open('https://gemini.google.com/', '_blank')" class="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm mb-4" style="background-color: #1a73e8; border: none;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 2c-.3 0-.5.2-.6.5L9.2 8.7 3.5 10.9c-.3.1-.5.3-.5.6s.2.5.5.6l5.7 2.2 2.2 5.7c.1.3.3.5.6.5s.5-.2.6-.5l2.2-5.7 5.7-2.2c.3-.1.5-.3.5-.6s-.2-.5-.5-.6l-5.7-2.2-2.2-5.7c-.1-.3-.3-.5-.6-.5z"/>
                        </svg>
                        Pergunte ao Gemini
                    </button>
                    
                    <div class="text-start bg-dark border border-secondary rounded p-3" style="max-width: 600px; width: 100%;">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-secondary small fw-bold">📋 Copie o prompt abaixo e cole no Gemini:</span>
                            <button class="btn btn-sm btn-outline-success border-0 px-2 py-1" onclick="navigator.clipboard.writeText(document.getElementById('gemini-prompt').value).then(() => { this.innerHTML = '<i class=\\'bi bi-check2\\'></i> Copiado!'; setTimeout(() => this.innerHTML = '<i class=\\'bi bi-clipboard\\'></i> Copiar', 2000); })">
                                <i class="bi bi-clipboard"></i> Copiar
                            </button>
                        </div>
                        <textarea id="gemini-prompt" readonly class="form-control bg-black text-white border-secondary font-monospace" style="height: 180px; font-size: 0.75rem; resize: none;">${promptTemplate}</textarea>
                    </div>
                </div>
                `}
            </div>

            ${user.isGuest ? '' : `
            <div id="add-asset-drawer" class="bottom-drawer ${isDrawerOpen ? '' : 'collapsed'}"> 
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
    },

    renderUpdateModal() {
        return `
            <div class="modal-overlay" id="update-modal-overlay">
                <div class="custom-modal">
                    <h3 class="modal-title text-white fs-5 mb-4">Editar <span id="modal-ticker-title"></span></h3>
                    <form id="form-update-asset">
                        <input type="hidden" id="update-id">
                        <input type="number" id="update-quantity" class="form-control mb-2" required>
                        <input type="number" id="update-averagePrice" class="form-control mb-3" required step="0.01">
                        <button type="submit" class="btn btn-success w-100">Salvar</button>
                    </form>
                </div>
            </div>`;
    }
};