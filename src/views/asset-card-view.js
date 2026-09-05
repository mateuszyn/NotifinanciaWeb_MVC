import { Security } from '../infrastructure/security.js';
import { BROKERS } from '../utils/brokers.js';

export const AssetCardView = {
    renderList(assets, user) {
        if (!assets.length) return Array.from({ length: 6 }).map(() => `<div class="col-12 col-md-6 col-lg-4 mb-4"><div class="skeleton-card"><div class="skeleton-header"><div class="skeleton-line skeleton-title"></div><div class="skeleton-circle"></div></div><div class="skeleton-block"></div><div class="skeleton-row"><div class="skeleton-block"></div><div class="skeleton-block"></div></div><div class="skeleton-block skeleton-block-lg mt-3"></div></div></div>`).join('');
        return assets.map(asset => this.render(asset, user)).join('');
    },

    render(asset, user) {
        const profitPct = asset.variacaoPm || 0;
        const dailyChange = asset.dailyChange || 0;
        const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
        const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';
        let borderClass = 'border-neutral-portfolio';
        if (profitPct > 0) borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
        else if (profitPct < 0) borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';
        const safeTicker = Security.escapeHTML(asset.ticker);
        const brokerName = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[brokerName] || BROKERS.Nubank;
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
        const snowballMessage = cotasParaBolaDeNeve > 0 && quantity >= cotasParaBolaDeNeve ? `Você atingiu a Bola de Neve! (${cotasParaBolaDeNeve} Cotas)` : `Faltam ${cotasFaltantes} cotas para a Bola de Neve (${cotasParaBolaDeNeve} cotas)`;
        const snowballColor = cotasParaBolaDeNeve > 0 && quantity >= cotasParaBolaDeNeve ? '#8fe3a7' : '#ff8a8a';
        const dividendContent = asset.dataError ? `<div class="text-center p-2"><p class="small text-warning mb-2">Não foi possível carregar os dados.</p><button class="btn btn-sm btn-outline-warning btn-retry-asset" data-ticker="${safeTicker}"><i class="bi bi-arrow-clockwise"></i> Tentar novamente</button></div>` : yieldPct === 0 ? `<div class="text-center p-2"><p class="small text-warning mb-2">Não foi possível calcular dividendos.</p><button class="btn btn-sm btn-outline-warning" onclick="window.location.reload()"><i class="bi bi-arrow-clockwise"></i> Recarregar</button></div>` : `<div class="d-flex justify-content-around"><div><p class="small text-secondary mb-0">Renda Mensal</p><p class="fw-bold mb-0 text-white">R$ ${divMensal.toFixed(2)}</p><p class="small mt-1 mb-0" style="color: #8fe3a7;">Gera ${cotasCompradasPorMes.toFixed(1)} cota(s) / mês</p></div><div><p class="small text-secondary mb-0">Renda Anual</p><p class="fw-bold mb-0 text-white">R$ ${divAnual.toFixed(2)}</p><p class="small mt-1 mb-0" style="color: #8fe3a7;">Gera ${cotasCompradasPorAno.toFixed(1)} cota(s) / ano</p></div></div>`;
        const actions = user.isGuest ? '<span class="badge bg-secondary">Dados de Exemplo</span>' : `<span id="actions-${asset.ticker}" class="d-flex align-items-center gap-2"><button id="edit-${asset.ticker}" class="btn btn-link p-0 btn-edit edit-btn-wrapper" data-id="${asset.id}" data-ticker="${safeTicker}" data-qty="${asset.quantity}" data-price="${asset.averagePrice}" aria-label="Editar / Aporte"><span class="edit-icon"><i class="bi bi-pencil text-primary fs-4"></i></span></button><button id="delete-${asset.ticker}" class="btn btn-link p-0 text-danger btn-delete" data-id="${asset.id}"><i class="bi bi-trash3 text-danger trash-icon fs-4"></i></button></span>`;
        return `<div class="col-12 col-md-6 col-lg-4 mb-4"><div class="asset-card ${borderClass}"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="m-0 fw-bold">${safeTicker}</h4><div class="d-flex gap-3 align-items-center">${actions}</div></div><div class="row mb-3"><div class="col-12"><p class="price-value mb-0">Total: R$ ${(quantity * currentPrice).toFixed(2)}</p><p class="small text-secondary fw-bold mb-1">QTD: ${quantity}</p><p class="small mb-0" style="font-size: 0.72rem; color: ${snowballColor};">${snowballMessage}</p></div></div><div class="row border-top border-bottom border-secondary py-2 mb-3"><div class="col-6 border-end border-secondary"><p class="price-label">P. Médio</p><p class="price-value">R$ ${asset.averagePrice.toFixed(2)} <span class="${profitTextClass} small">(${profitPct.toFixed(2)}%)</span></p></div><div class="col-6 ps-3"><p class="price-label">Preço Atual</p><p class="price-value d-flex align-items-center gap-1">R$ ${currentPrice.toFixed(2)} <span class="${dailyTextClass} small">(${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%)</span></p></div></div><div class="bg-dark rounded p-2 text-center border border-secondary mb-3 mx-0"><span class="badge ${yieldPct > 0 ? 'bg-success' : 'bg-warning'} mb-2">${yieldPct > 0 ? 'Yield Anual: ' + yieldPct.toFixed(2) + '%' : 'Sem dados de Dividendos'}</span>${dividendContent}</div><a href="${brokerInfo.webUrl || brokerInfo.appUrl}" target="_blank" rel="noopener noreferrer" class="btn w-100 d-flex align-items-center justify-content-center gap-2" style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; border: none; font-weight: bold; border-radius: 8px; height: 45px;"><i class="bi bi-box-arrow-up-right"></i> Operar na ${brokerName}</a></div></div>`;
    }
};
