export class Asset {
    constructor(ticker, quantity, averagePrice, id = null) {
        this.id = id;
        this.ticker = (ticker || '').toUpperCase().trim();
        this.quantity = Number(quantity) || 0;
        this.averagePrice = Number(averagePrice) || 0;
        
        // Dados vindos do mercado
        this.currentPrice = 0;
        this.dailyChange = 0;
    }

    /**
     * Atualiza os preços vindos da API
     */
    setMarketData(currentPrice, dailyChange) {
        this.currentPrice = Number(currentPrice) || 0;
        this.dailyChange = Number(dailyChange) || 0;
    }

    /**
     * GETTERS INTELIGENTES
     * Calculam dinamicamente na hora em que são acessados
     */
    get totalValue() {
        return this.quantity * this.currentPrice;
    }

    get variacaoPM() {
        if (this.averagePrice <= 0 || this.currentPrice <= 0) return 0;
        return ((this.currentPrice / this.averagePrice) - 1) * 100;
    }

    get lucroPrejuizo() {
        return (this.currentPrice - this.averagePrice) * this.quantity;
    }

    isFII() {
        return this.ticker.endsWith('11');
    }
}