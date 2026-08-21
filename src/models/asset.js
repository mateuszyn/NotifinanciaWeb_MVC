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

    // O Model enriquece a si mesmo com os dados do mercado
    // O Model enriquece a si mesmo com os dados do mercado
    enrich(marketData) {
        if (!marketData || Object.keys(marketData).length === 0) {
            this.dataError = true;
            this.currentPrice = this.averagePrice;
            this.totalValue = this.currentPrice * this.quantity;
            return;
        }

        const fetchedPrice = Number(marketData.price || marketData.regularMarketPrice) || 0;
        
        // REGRA DE BLINDAGEM: Se temos o preço real, atualizamos. 
        // Se não (plano B ativado), usamos o PM e ZERAMOS a variação para não mostrar "Frankensteins".
        if (fetchedPrice > 0) {
            this.currentPrice = fetchedPrice;
            this.dailyChange = Number(marketData.changePercent || marketData.regularMarketChangePercent) || 0;
        } else {
            this.currentPrice = this.averagePrice;
            this.dailyChange = 0; 
        }
        
        // Caça o Yield em qualquer formato que a API mandar
        this.yieldPct = Number(marketData.yieldPct || marketData.yieldpct || marketData.dividendYield || marketData.yield) || 0;
        
        this.divAnual = this.currentPrice * (this.yieldPct / 100) * this.quantity;
        this.divMensal = this.divAnual / 12;
        
        this.variacaoPm = this.averagePrice > 0 
            ? ((this.currentPrice / this.averagePrice) - 1) * 100 
            : 0;
            
        this.totalValue = this.currentPrice * this.quantity;
        
        const hasMeaningfulValues = fetchedPrice > 0 || this.dailyChange !== 0 || this.yieldPct > 0;
        this.dataError = !hasMeaningfulValues;
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