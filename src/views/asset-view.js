import { Security } from '../infrastructure/security.js';
import { BROKERS } from '../utils/brokers.js';
import { AssetService } from '../services/asset-service.js';

export const AssetView = {
    render(assets, user) {
        // --- TRAVA 1: CORREÇÃO DO BUG DE ROTAS ---
        // Se a busca da API terminar enquanto o usuário estiver em outra página, aborta a renderização.
        const currentHash = window.location.hash;
        if (currentHash !== '' && currentHash !== '#/') {
            return; 
        }

        const app = document.querySelector('#app');
        
        // --- TRAVA 2: CORREÇÃO DA GAVETA (ADD ASSET) FECHANDO SOZINHA ---
        // Memoriza se a gaveta estava aberta antes de reconstruir o HTML
        const existingDrawer = document.querySelector('#add-asset-drawer');
        const isDrawerOpen = existingDrawer && !existingDrawer.classList.contains('collapsed');

        // --- Extração e Formatação do Primeiro Nome ---
        const rawUserName = user.user_metadata?.full_name || user.email.split('@')[0];
        const firstNameRaw = rawUserName.split(' ')[0].toLowerCase();
        const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
        const userName = Security.escapeHTML(firstName);
        
        const currentBroker = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[currentBroker];

        const isNotifActive = user.notifications_enabled;
        const bellIcon = isNotifActive ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';
        const tooltipMessage = isNotifActive 
            ? "Notificações Diárias Ativas (18h)" 
            : "Ative o sininho para receber relatório diário da carteira";

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
            const profitPct = asset.variacaoPm || 0;
            const dailyChange = asset.dailyChange || 0;
            const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';

            let borderClass = 'border-neutral-portfolio';
            if (profitPct > 0) borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
            else if (profitPct < 0) borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

            const safeTicker = Security.escapeHTML(asset.ticker);
            
            const yieldPct = asset.yieldPct || 0;
            const divMensal = asset.divMensal || 0;
            const divAnual = asset.divAnual || 0;
            const currentPrice = Number(asset.currentPrice) || 0;
            const quantity = Number(asset.quantity) || 0;
            const rendaMensalPorCota = divAnual > 0 && quantity > 0 ? (divAnual / quantity) / 12 : 0;
            const cotasParaBolaDeNeve = rendaMensalPorCota > 0 && currentPrice > 0 ? Math.ceil(currentPrice / rendaMensalPorCota) : 0;
            const cotasFaltantes = Math.max(0, cotasParaBolaDeNeve - quantity);
            const cotasCompradasPorMes = divMensal > 0 && currentPrice > 0 ? Number((divMensal / currentPrice).toFixed(1)) : 0;
            const cotasCompradasPorAno = divAnual > 0 && currentPrice > 0 ? Number((divAnual / currentPrice).toFixed(1)) : 0;

            let snowballMessage = `Faltam ${cotasFaltantes} cotas para a Bola de Neve (${cotasParaBolaDeNeve} cotas)`;
            let snowballColor = '#ff8a8a';
            if (cotasParaBolaDeNeve > 0 && quantity >= cotasParaBolaDeNeve) {
                snowballMessage = `Você atingiu a Bola de Neve! (${cotasParaBolaDeNeve} Cotas)`;
                snowballColor = '#8fe3a7';
            } else if (cotasParaBolaDeNeve > 0 && quantity > 0 && quantity > cotasParaBolaDeNeve) {
                const acima = quantity - cotasParaBolaDeNeve;
                snowballMessage = `Você está ${acima} Cotas acima da Bola de Neve (${cotasParaBolaDeNeve})`;
                snowballColor = '#8fe3a7';
            }

            let dividendContent = `
                <div class="d-flex justify-content-around">
                    <div>
                        <p class="small text-secondary mb-0">Renda Mensal</p>
                        <p class="fw-bold mb-0 text-white">R$ ${divMensal.toFixed(2)}</p>
                        <p class="small mt-1 mb-0" style="color: #8fe3a7;">Gera ${cotasCompradasPorMes.toFixed(1)} cota(s) / mês</p>
                    </div>
                    <div>
                        <p class="small text-secondary mb-0">Renda Anual</p>
                        <p class="fw-bold mb-0 text-white">R$ ${divAnual.toFixed(2)}</p>
                        <p class="small mt-1 mb-0" style="color: #8fe3a7;">Gera ${cotasCompradasPorAno.toFixed(1)} cota(s) / ano</p>
                    </div>
                </div>
            `;

            if (asset.dataError) {
                dividendContent = `
                    <div class="text-center p-2">
                        <p class="small text-warning mb-2">Não foi possível carregar os dados.</p>
                        <button class="btn btn-sm btn-outline-warning btn-retry-asset" data-ticker="${safeTicker}">
                            <i class="bi bi-arrow-clockwise"></i> Tentar novamente
                        </button>
                    </div>
                `;
            } else if (yieldPct === 0) {
                dividendContent = `
                    <div class="text-center p-2">
                        <p class="small text-warning mb-2">Não foi possível calcular dividendos.</p>
                        <button class="btn btn-sm btn-outline-warning" onclick="window.location.reload()">
                            <i class="bi bi-arrow-clockwise"></i> Recarregar
                        </button>
                    </div>
                `;
            }

            const actionButtons = user.isGuest 
                ? `<span class="badge bg-secondary">Dados de Exemplo</span>`
                : `
                   <span id="actions-${asset.ticker}" class="d-flex align-items-center gap-2">
                       <i id="loading-${asset.ticker}" class="bi bi-arrow-repeat text-secondary fs-4 d-none spin-animation"></i>
                       
                       <button id="edit-${asset.ticker}" class="btn btn-link p-0 btn-edit edit-btn-wrapper" data-id="${asset.id}" data-ticker="${safeTicker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}" aria-label="Editar / Aporte">
                           <span class="edit-icon"><i class="bi bi-pencil text-primary fs-4"></i></span>
                       </button>
                       <button id="delete-${asset.ticker}" class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}">
                           <i class="bi bi-trash3 text-danger trash-icon fs-4"></i>
                       </button>
                   </span>`;

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
                                <p class="small text-secondary fw-bold mb-1">QTD: ${asset.quantity}</p>
                                <p class="small mb-0" style="font-size: 0.72rem; color: ${snowballColor};">
                                    ${snowballMessage}
                                </p>
                            </div>
                        </div>
                        
                        <div class="row border-top border-bottom border-secondary py-2 mb-3">
                            <div class="col-6 border-end border-secondary">
                                <p class="price-label">P. Médio</p>
                                <p class="price-value">R$ ${asset.averagePrice.toFixed(2)} <span class="${profitTextClass} small">(${profitPct.toFixed(2)}%)</span></p>
                            </div>
                            <div class="col-6 ps-3">
                                <p class="price-label">Preço Atual</p>
                                <p class="price-value d-flex align-items-center gap-1">R$ ${asset.currentPrice.toFixed(2)} <span class="${dailyTextClass} small">(${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%)</span></p>
                            </div>
                        </div>
                        
                        <div class="bg-dark rounded p-2 text-center border border-secondary mb-3 mx-0">
                            <span class="badge ${yieldPct > 0 ? 'bg-success' : 'bg-warning'} mb-2">
                                ${yieldPct > 0 ? 'Yield Anual: ' + yieldPct.toFixed(2) + '%' : 'Sem dados de Dividendos'}
                            </span>
                            ${dividendContent}
                        </div>
                        
                        <a href="${brokerInfo.webUrl || brokerInfo.appUrl}" target="_blank" class="btn w-100 d-flex align-items-center justify-content-center gap-2" 
                           style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; border: none; font-weight: bold; border-radius: 8px; height: 45px;">
                           <i class="bi bi-box-arrow-up-right"></i> Operar na ${currentBroker}
                        </a>
                    </div>
                </div>`;
        }).join('') : Array.from({ length: 6 }).map(() => `
            <div class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="skeleton-card">
                    <div class="skeleton-header">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-circle"></div>
                    </div>
                    <div class="skeleton-block"></div>
                    <div class="skeleton-row">
                        <div class="skeleton-block"></div>
                        <div class="skeleton-block"></div>
                    </div>
                    <div class="skeleton-block skeleton-block-lg mt-3"></div>
                </div>
            </div>
        `).join('');

        const listaAtivosPrompt = assets.map(a => 
            `- ${a.ticker} (Qtd: ${a.quantity} cotas): Preço R$ ${(Number(a.currentPrice) || 0).toFixed(2)} | Rentabilidade PM: ${(Number(a.variacaoPm) || 0).toFixed(2)}% | Variação Hoje: ${(Number(a.dailyChange) || 0).toFixed(2)}%`
        ).join('\n');

        const promptTemplate = `Atue como um analista financeiro sênior especialista na metodologia Barsi e em carteiras previdenciárias de dividendos.

Aqui está a fotografia da minha carteira hoje:
${listaAtivosPrompt}

Com base exclusivamente nesses ativos, por favor gere um relatório estruturado contendo:
1. O Cenário de Hoje: O que motivou as maiores altas e quedas do dia.
2. Radar de Notícias: As últimas notícias relevantes ou fatos relevantes emitidos sobre essas empresas/fundos.
3. Agenda de Proventos: As próximas datas "Com" e "Ex-dividendos" anunciadas ou estimadas para cada um.
4. Resumo Tático: Uma frase resumindo o momento atual de cada ativo.
5. Veredito de Aporte: Olhando para o preço atual e o histórico, qual a melhor recomendação de compra HOJE para maximizar o efeito bola de neve da minha carteira?`;
        
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

            <footer class="institutional-footer mt-auto pt-4 pb-4 border-top border-secondary" style="background: rgba(6, 8, 22, 0.9);">
                <div class="container text-center">
                    
                    <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
                        <img src="https://notifinancia.online/android-chrome-192x192.png" alt="Notifinancia Logo" width="28" height="28" style="border-radius: 6px;">
                        <span class="fw-bold text-success fs-5" style="letter-spacing: 1px;">NOTIFINANCIA</span>
                    </div>
                    
                    <div class="footer-links mb-4 d-flex justify-content-center gap-4 flex-wrap">
                       <a href="#/contato" class="text-decoration-none text-secondary hover-success small fw-bold">Suporte e Contato</a>
                       <a href="#/termos" class="text-decoration-none text-secondary hover-success small">Termos de Uso</a>
                       <a href="#/privacidade" class="text-decoration-none text-secondary hover-success small">Política de Privacidade</a>
                    </div>
                    
                    <p class="disclaimer-text text-secondary mx-auto mb-3" style="font-size: 0.72rem; max-width: 850px; line-height: 1.6; text-align: justify; text-align-last: center;">
                        <strong>Isenção de Responsabilidade:</strong> O Notifinancia é uma ferramenta educacional desenvolvida para o acompanhamento e organização de portfólios financeiros. Os cálculos apresentados (incluindo as projeções de dividendos) são baseados em dados públicos de mercado e <strong>não constituem recomendação de compra, venda ou manutenção de ativos</strong>. Rentabilidade passada não é garantia de rentabilidade futura. Todo investimento em renda variável envolve riscos.
                    </p>
                    
                    <p class="text-secondary small mt-2 mb-0" style="font-size: 0.8rem;">
                        &copy; ${new Date().getFullYear()} Notifinancia. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
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
                
                brokerSelect.dispatchEvent(new CustomEvent('brokerChanged', { detail: selected }));
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
                                <div class="d-flex gap-2 mt-2">
                                    <button type="button" class="btn btn-outline-danger btn-sm btn-quick-qty" data-val="-100">-100</button>
                                    <button type="button" class="btn btn-outline-danger btn-sm btn-quick-qty" data-val="-10">-10</button>
                                    <button type="button" class="btn btn-outline-danger btn-sm btn-quick-qty" data-val="-1">-1</button>
                                    <button type="button" class="btn btn-outline-success btn-sm btn-quick-qty" data-val="1">+1</button>
                                    <button type="button" class="btn btn-outline-success btn-sm btn-quick-qty" data-val="10">+10</button>
                                    <button type="button" class="btn btn-outline-success btn-sm btn-quick-qty" data-val="100">+100</button>
                                </div>
                            </div>
                        <div class="form-group mb-4">
                            <label class="small text-secondary fw-bold mb-1">Preço Médio (R$)</label>
                            <input type="number" id="update-averagePrice" class="form-control bg-black text-white border-secondary" required step="0.01">
                            <div class="d-flex gap-2 mt-2">
                                <button type="button" class="btn btn-outline-danger btn-sm btn-quick-price" data-val="-0.1">-0,10</button>
                                <button type="button" class="btn btn-outline-danger btn-sm btn-quick-price" data-val="-0.01">-0,01</button>
                                <button type="button" class="btn btn-outline-success btn-sm btn-quick-price" data-val="0.01">+0,01</button>
                                <button type="button" class="btn btn-outline-success btn-sm btn-quick-price" data-val="0.1">+0,10</button>
                            </div>
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