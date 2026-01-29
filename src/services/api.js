import { supabase } from './supabaseClient.js';
import { Asset } from '../models/Asset.js';

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;

export const AssetService = {
    // 1. Busca os ativos salvos no seu banco (Supabase)
    async getAssets() {
        const { data, error } = await supabase
            .from('assets')
            .select('*');

        if (error) {
            console.error('Erro no Supabase:', error.message);
            return [];
        }

        return data.map(item => new Asset(item.ticker, item.quantity, item.average_price));
    },

    // 2. Busca os preços atuais na Bolsa (Brapi)
    async getMarketPrices(tickers) {
        if (tickers.length === 0) return {};

        const tickersString = tickers.join(',');
        const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`;

        try {
            const response = await fetch(url);
            const json = await response.json();
            
            // Transformamos o array da API em um objeto fácil de consultar: { 'PETR4': 38.50 }
            const prices = {};
            json.results.forEach(res => {
                prices[res.symbol] = res.regularMarketPrice;
            });
            return prices;
        } catch (error) {
            console.error('Erro na Brapi:', error);
            return {};
        }
    },

    // 3. Salva um novo ativo
    async addAsset(asset) {
        const { error } = await supabase
            .from('assets')
            .insert([{ 
                ticker: asset.ticker, 
                quantity: asset.quantity, 
                average_price: asset.averagePrice 
            }]);
        if (error) throw error;
    }
};