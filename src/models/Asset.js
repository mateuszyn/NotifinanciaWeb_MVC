export class Asset {
    constructor(ticker, quantity, averagePrice, id = null) {
        this.id = id;
        this.ticker = (ticker || '').toUpperCase().trim();
        this.quantity = Number(quantity) || 0;
        this.averagePrice = Number(averagePrice) || 0;

        this.currentPrice = 0;
        this.dailyChange = 0;
        this.yieldpct = 0;
    }

    setMarketData(currentPrice, dailyChange, yieldpct = 0) {
        this.currentPrice = Number(currentPrice) || 0;
        this.dailyChange = Number(dailyChange) || 0;
        this.yieldpct = Number(yieldpct) || 0;
    }

    get divAnual() {
        if (this.currentPrice <= 0 || this.quantity <= 0) return 0;
        return this.currentPrice * this.quantity * (this.yieldpct / 100);
    }

    get divMensal() {
        if (this.currentPrice <= 0 || this.quantity <= 0) return 0;
        return this.divAnual / 12;
    }

    get cotasPorMes() {
        if (this.currentPrice <= 0) return 0;
        return this.divMensal / this.currentPrice;
    }

    get cotasPorAno() {
        if (this.currentPrice <= 0) return 0;
        return this.divAnual / this.currentPrice;
    }

    get atingiuBolaDeNeve() {
        return this.cotasPorMes >= 1;
    }

    get cotasParaBolaDeNeve() {
        if (this.yieldpct <= 0) return 0;
        const quantidadeNecessaria = 12 / (this.yieldpct / 100);
        return Math.max(0, Math.ceil(quantidadeNecessaria - this.quantity));
    }

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