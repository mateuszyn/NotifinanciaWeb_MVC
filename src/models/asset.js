export class Asset {
    constructor(ticker, quantity, averagePrice) {
        this.ticker = ticker;
        this.quantity = Number(quantity) || 0;
        this.averagePrice = Number(averagePrice) || 0;
        
        // camelCase impecável
        this.currentPrice = 0;
        this.dailyChange = 0;
        this.yieldPct = 0; 
        this.divAnual = 0;
        this.divMensal = 0;
        this.variacaoPm = 0; 
        this.totalValue = 0;
        this.dataError = false;
    }

    // Aplica o cache instantâneo enquanto a API não responde
    applyCache(cachedPrice, cachedChange, cachedYield) {
        const price = Number(cachedPrice) || 0;
        
        if (price > 0) {
            this.currentPrice = price;
            this.dailyChange = Number(cachedChange) || 0;
            this.yieldPct = Number(cachedYield) || 0;
            
            this.divAnual = this.currentPrice * (this.yieldPct / 100) * this.quantity;
            this.divMensal = this.divAnual / 12;
            
            this.variacaoPm = this.averagePrice > 0 
                ? ((this.currentPrice / this.averagePrice) - 1) * 100 
                : 0;
                
            this.totalValue = this.currentPrice * this.quantity;
            this.dataError = false;
        }
    }

    // O Model enriquece a si mesmo com os dados do mercado
    enrich(marketData) {
        // Verifica se a API não mandou dados (Yahoo falhou ou Vercel dormiu)
        const isMarketDataEmpty = !marketData || Object.keys(marketData).length === 0;
        const fetchedPrice = isMarketDataEmpty ? 0 : (Number(marketData.price || marketData.regularMarketPrice) || 0);

        if (fetchedPrice > 0) {
            // SUCESSO: Atualiza com os dados super frescos do mercado
            this.currentPrice = fetchedPrice;
            this.dailyChange = Number(marketData.changePercent || marketData.regularMarketChangePercent) || 0;
            this.yieldPct = Number(marketData.yieldPct || marketData.yieldpct || marketData.dividendYield || marketData.yield) || 0;
            this.dataError = false;
        } else {
            // FALHA: A API não trouxe preço. Ativamos o Modo de Segurança!
            this.dataError = true;
            
            // Se a classe AINDA NÃO TEM preço (o cache do banco estava vazio), usamos o P.M.
            if (!this.currentPrice || this.currentPrice === 0) {
                this.currentPrice = this.averagePrice;
                this.dailyChange = 0;
            }
            // MÁGICA: Se ela já tinha preço (puxou do SWR Cache), NÃO FAZEMOS NADA! 
            // Ela vai manter o último preço e variação reais que estavam salvos no banco.
        }

        // Refaz a matemática com o preço que sobreviveu (Fresco, Cache ou P.M.)
        this.divAnual = this.currentPrice * (this.yieldPct / 100) * this.quantity;
        this.divMensal = this.divAnual / 12;
        
        this.variacaoPm = this.averagePrice > 0 
            ? ((this.currentPrice / this.averagePrice) - 1) * 100 
            : 0;
            
        this.totalValue = this.currentPrice * this.quantity;
    }

    getProfit() {
        return (this.currentPrice - this.averagePrice) * this.quantity;
    }

    isFii() {
        return this.ticker.toUpperCase().endsWith('11');
    }

    getTaxDue() {
        if (!this.isFii()) return 0;
        const profit = this.getProfit();
        return profit > 0 ? profit * 0.20 : 0;
    }
}