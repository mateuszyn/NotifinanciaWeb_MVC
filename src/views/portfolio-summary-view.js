export const PortfolioSummaryView = {
    render(summary, assets = []) {
        const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        const profitClass = summary.profit >= 0 ? 'positive' : 'negative';
        let borderClass = 'border-neutral-portfolio';
        if (summary.profit > 0) borderClass = summary.dailyChangePct >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
        else if (summary.profit < 0) borderClass = summary.dailyChangePct >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

        // ==========================================
        // 1. COMPONENTE DE EXPLICAÇÃO DO DY (TOOLTIP)
        // ==========================================
        const dyInfoTooltip = `
            <details class="dy-info-wrapper">
                <summary class="dy-info-btn" aria-label="Informações sobre o cálculo do DY">
                    <i class="bi bi-info-circle-fill"></i>
                </summary>
                <div class="dy-info-popover">
                    O Dividend Yield (DY) é baseado nos proventos pagos nos últimos 12 meses, obtidos via Yahoo Finance. Trata-se de uma base estimada e indicativa, <strong>não constituindo garantia</strong> de rendimentos futuros.
                </div>
            </details>
        `;

        // ==========================================
        // 2. RENDERIZAÇÃO DOS QUADRADINHOS DE TICKERS
        // ==========================================
        const tickersSquaresHtml = assets.map(asset => {
            const pmVal = asset.variacaoPm || asset.variacaoPM || 0;
            const dailyVal = asset.dailyChange || 0;
            const pmClass = pmVal >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const dailyClass = dailyVal >= 0 ? 'text-profit-pos' : 'text-profit-neg';
            const squareBorderClass = pmVal >= 0 ? 'border-success' : 'border-danger';

            return `
                <details class="ticker-square-wrapper">
                    <summary class="ticker-square ${squareBorderClass}" title="${asset.ticker}">
                        <span class="ticker-symbol">${asset.ticker.replace(/\.SA$/i, '')}</span>
                    </summary>
                    <div class="ticker-popover">
                        <div class="ticker-popover-title"><strong>${asset.ticker}</strong></div>
                        <div class="ticker-popover-row">
                            <span>P.M.:</span> <strong class="${pmClass}">${pmVal >= 0 ? '+' : ''}${pmVal.toFixed(2)}%</strong>
                        </div>
                        <div class="ticker-popover-row">
                            <span>Hoje:</span> <strong class="${dailyClass}">${dailyVal >= 0 ? '+' : ''}${dailyVal.toFixed(2)}%</strong>
                        </div>
                    </div>
                </details>
            `;
        }).join('');

        // ==========================================
        // 3. ESTRUTURA HTML DO PAINEL CONSOLIDADO
        // ==========================================
        return `
            <section class="portfolio-summary ${borderClass} mb-4" aria-label="Resumo consolidado da carteira">
                <div class="portfolio-summary-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                        <span class="summary-eyebrow">Visão consolidada</span>
                        <h2 class="summary-title">Painel da Carteira</h2>
                    </div>
                    ${assets.length > 0 ? `
                        <div class="ticker-squares-grid">
                            ${tickersSquaresHtml}
                        </div>
                    ` : ''}
                </div>
                
                <div class="portfolio-summary-grid mt-3">
                    <div class="summary-metric summary-metric-highlight">
                        <span>Patrimônio atual</span>
                        <strong>${formatCurrency(summary.currentValue)}</strong>
                    </div>
                    <div class="summary-metric">
                        <span>Variação global</span>
                        <strong class="${profitClass}">${formatCurrency(summary.profit)}</strong>
                        <small class="${profitClass}">${summary.profitPct >= 0 ? '+' : ''}${summary.profitPct.toFixed(2)}%</small>
                    </div>
                    <div class="summary-metric">
                        <span>DY esperado anual</span>
                        <strong>${formatCurrency(summary.annualDividends)}</strong>
                        ${dyInfoTooltip}
                    </div>
                    <div class="summary-metric">
                        <span>DY médio mensal</span>
                        <strong>${summary.monthlyYieldPct.toFixed(2)}%</strong>
                        <small>${formatCurrency(summary.annualDividends / 12)} / mês</small>
                        ${dyInfoTooltip}
                    </div>
                </div>
            </section>`;
    }
};