import { supabase } from './supabaseClient.js';
import { Asset } from '../models/Asset.js';

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;

export const AssetService = {
    // 1. Busca os ativos salvos no seu banco (Supabase)
    async getAssets() {
        const { data, error } = await supabase.from('assets').select('*');
        if (error) return [];

        // Verifique se o seu Model Asset aceita o ID como 1º ou 4º parâmetro
        return data.map(item => {
            const asset = new Asset(item.ticker, item.quantity, item.average_price);
            asset.id = item.id; // Adiciona o ID vindo do banco
            return asset;
        });
    },


    async validateTicker(ticker) {
        if (!ticker) return false;

        const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;

        try {
            const response = await fetch(url);

            // Se a API retornar 404 ou outro erro, o ticker é inválido
            if (!response.ok) return false;

            const data = await response.json();

            // A Brapi retorna um array 'results'. Se estiver vazio ou o primeiro item for nulo, não existe.
            return data.results && data.results.length > 0 && data.results[0].symbol;
        } catch (error) {
            console.error('Erro ao validar ticker na Brapi:', error);
            return false;
        }
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
    },

    async deleteAsset(id) {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro técnico no Supabase:", error);
            throw error;
        }
    },



    async updateAsset(asset) {

        const oldAsset = supabase.from('assets').select('*').eq('id', asset.id).single();

        if (oldAsset != null) {
            const { error } = await supabase
                .from('assets')
                .update({
                    quantity: asset.quantity,
                    average_price: asset.averagePrice
                })
                .eq('ticker', asset.ticker);
            if (error) throw error;
        }
        else {
            throw new Error("O Asset informado não existe.");

        }

    }
};