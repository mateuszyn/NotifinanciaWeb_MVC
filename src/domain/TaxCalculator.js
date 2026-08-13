export const TaxCalculator = {
    /**
     * Retorna o último dia útil do mês seguinte no formato DD/MM/YYYY
     */
    getLastBusinessDay() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        let dayOfWeek = nextMonth.getDay();
        
        // Se for domingo (0), volta 2 dias (para sexta)
        if (dayOfWeek === 0) nextMonth.setDate(nextMonth.getDate() - 2);
        // Se for sábado (6), volta 1 dia (para sexta)
        else if (dayOfWeek === 6) nextMonth.setDate(nextMonth.getDate() - 1);
        
        const day = String(nextMonth.getDate()).padStart(2, '0');
        const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const year = nextMonth.getFullYear();
        
        return `${day}/${month}/${year}`;
    },

    /**
     * Avalia se o ativo é um FII com lucro e calcula o imposto devido
     * @param {Object} asset - Objeto do ativo (com ticker, averagePrice, quantity)
     * @param {number} currentPrice - Preço atual de mercado do ativo
     * @returns {Object} Resultado do cálculo
     */
    calculateFIITax(asset, currentPrice) {
        const isFII = asset.ticker.endsWith('11');
        const lucro = (currentPrice - asset.averagePrice) * asset.quantity;
        const temLucro = lucro > 0;

        if (isFII && temLucro) {
            return {
                isTaxable: true,
                lucro: lucro,
                imposto: lucro * 0.20,
                dataVencimento: this.getLastBusinessDay()
            };
        }

        return {
            isTaxable: false,
            lucro: lucro,
            imposto: 0,
            dataVencimento: null
        };
    }
};