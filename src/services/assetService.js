import { supabase } from './supabaseClient.js';
import { Asset } from '../models/Asset.js';

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN;

export const AssetService = {
    async getAssets() {
        const { data, error } = await supabase.from('assets').select('*');
        if (error) return [];
        return data.map(item => {
            const asset = new Asset(item.ticker, item.quantity, item.average_price);
            asset.id = item.id;
            return asset;
        });
    },

    // BUSCA SUGESTÕES DE TICKERS (Autocomplete)
    async getTickerSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        // Usamos o endpoint list para buscar tickers que combinem com o que foi digitado
        const url = `https://brapi.dev/api/quote/list?search=${query}&token=${BRAPI_TOKEN}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            // Retorna apenas os símbolos (ex: ["PETR4", "PETR3"])
            return data.stocks ? data.stocks.map(s => s.stock) : [];
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
            return [];
        }
    },

    // BUSCA PREÇO ATUAL DE UM TICKER ESPECÍFICO
    async getPrice(ticker) {
        const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.results?.[0]?.regularMarketPrice || 0;
        } catch (error) {
            return 0;
        }
    },

    async validateTicker(ticker) {
        if (!ticker) return false;
        const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;
        try {
            const response = await fetch(url);
            if (!response.ok) return false;
            const data = await response.json();
            return data.results && data.results.length > 0 && data.results[0].symbol;
        } catch (error) {
            return false;
        }
    },

    async getMarketPrices(tickers) {
        if (tickers.length === 0) return {};
        const tickersString = tickers.join(',');
        const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`;
        try {
            const response = await fetch(url);
            const json = await response.json();
            const prices = {};
            json.results.forEach(res => {
                prices[res.symbol] = res.regularMarketPrice;
            });
            return prices;
        } catch (error) {
            return {};
        }
    },

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
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
    },

    async updateAsset(id, data) {
        const { error } = await supabase
            .from('assets')
            .update({
                quantity: data.quantity,
                average_price: data.averagePrice
            })
            .eq('id', id);
        if (error) throw error;
    }
};