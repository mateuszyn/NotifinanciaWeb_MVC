export const AssetService = {
    async getAssets() {
        // Simulação de chamada de API
        return [
            { ticker: 'PETR4', quantity: 100, averagePrice: 35.50 },
            { ticker: 'VALE3', quantity: 50, averagePrice: 68.20 }
        ];
    }
};