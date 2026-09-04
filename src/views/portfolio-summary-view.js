export const PortfolioSummaryView = {
	render(summary) {
		const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
		const profitClass = summary.profit >= 0 ? 'positive' : 'negative';
		let borderClass = 'border-neutral-portfolio';
		if (summary.profit > 0) borderClass = summary.dailyChangePct >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
		else if (summary.profit < 0) borderClass = summary.dailyChangePct >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

		return `
			<section class="portfolio-summary ${borderClass} mb-4" aria-label="Resumo consolidado da carteira">
				<div class="portfolio-summary-header"><div><span class="summary-eyebrow">Visão consolidada</span><h2 class="summary-title">Painel da Carteira</h2></div></div>
				<div class="portfolio-summary-grid">
					<div class="summary-metric summary-metric-highlight"><span>Patrimônio atual</span><strong>${formatCurrency(summary.currentValue)}</strong></div>
					<div class="summary-metric"><span>Variação global</span><strong class="${profitClass}">${formatCurrency(summary.profit)}</strong><small class="${profitClass}">${summary.profitPct >= 0 ? '+' : ''}${summary.profitPct.toFixed(2)}%</small></div>
					<div class="summary-metric"><span>DY esperado anual</span><strong>${formatCurrency(summary.annualDividends)}</strong></div>
					<div class="summary-metric"><span>DY médio mensal</span><strong>${summary.monthlyYieldPct.toFixed(2)}%</strong><small>${formatCurrency(summary.annualDividends / 12)} / mês</small></div>
				</div>
			</section>`;
	}
};
