import { AssetService } from '../services/assetService.js';

export const DashboardController = {
    async init() {
        const app = document.querySelector('#app');
        if (!app) return;

        app.innerHTML = `
            <section class="dashboard-shell">
                <header class="dashboard-header">
                    <div>
                        <p class="eyebrow">Notifinancia</p>
                        <h1>Dashboard de Investimentos</h1>
                        <p class="subtitle">Análise rápida de dividend yield, preço e o número mágico para 1 nova cota por mês.</p>
                    </div>
                </header>

                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando dados do mercado...</p>
                </div>
            </section>
        `;

        try {
            // 1. Busca os ativos salvos do usuário
            const userAssets = await AssetService.getAssets();
            
            if (!userAssets || userAssets.length === 0) {
                this.render({}); // Renderiza vazio se não houver ativos
                return;
            }

            // 2. Extrai apenas a lista de tickers
            const tickers = userAssets.map(asset => asset.ticker);

            // 3. Busca os preços em lote na API
            const data = await AssetService.getMarketPrices(tickers);
            
            this.render(data.results || {});
        } catch (error) {
            app.innerHTML = `
                <section class="dashboard-shell">
                    <div class="error-state">
                        <h2>Ops!</h2>
                        <p>${error.message}</p>
                    </div>
                </section>
            `;
        }
    },

    render(results) {
        const app = document.querySelector('#app');
        if (!app) return;

        const cards = Object.entries(results).map(([ticker, item]) => this.createCard(ticker, item)).join('');

        app.innerHTML = `
            <section class="dashboard-shell">
                <header class="dashboard-header">
                    <div>
                        <p class="eyebrow">Notifinancia</p>
                        <h1>Dashboard de Investimentos</h1>
                        <p class="subtitle">Monitoramento inteligente para a estratégia de dividendos e formação de média.</p>
                    </div>
                </header>

                <div class="cards-grid">
                    ${cards}
                </div>
            </section>
        `;
    },

    createCard(ticker, item) {
        const price = Number(item.price || 0);
        const yieldPct = Number(item.yieldpct || 0);
        const changePercent = Number(item.changePercent || 0);
        const exDividendDate = this.formatDate(item.exDividendDate);

        const monthlyYieldDecimal = (yieldPct / 100) / 12;
        const dividendPerShare = price * monthlyYieldDecimal;
        const sharesNeeded = dividendPerShare > 0 ? Math.ceil(price / dividendPerShare) : 0;
        const magicNumber = sharesNeeded * price;

        const changeClass = changePercent >= 0 ? 'positive' : 'negative';

        return `
            <article class="asset-card">
                <div class="card-top">
                    <div>
                        <p class="card-ticker">${ticker}</p>
                        <p class="card-subtitle">Ativo do portfólio</p>
                    </div>
                    <span class="pill ${changeClass}">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span>
                </div>

                <div class="metric-row">
                    <div>
                        <span class="metric-label">Preço Atual</span>
                        <strong>R$ ${price.toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div>
                        <span class="metric-label">Variação</span>
                        <strong class="${changeClass}">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</strong>
                    </div>
                </div>

                <div class="metric-row">
                    <div>
                        <span class="metric-label">Dividend Yield</span>
                        <strong>${yieldPct.toFixed(2)}%</strong>
                    </div>
                    <div>
                        <span class="metric-label">Próxima Ex</span>
                        <strong>${exDividendDate}</strong>
                    </div>
                </div>

                <div class="magic-box">
                    <p class="metric-label">Número Mágico</p>
                    <h3>R$ ${this.formatCurrency(magicNumber)}</h3>
                    <small>${sharesNeeded} cota${sharesNeeded === 1 ? '' : 's'} para gerar 1 cota nova por mês</small>
                </div>
            </article>
        `;
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    formatDate(timestamp) {
        if (!timestamp) return '—';

        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};
