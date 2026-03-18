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

    async getTickerSuggestions(query) {
        if (!query || query.length < 2) return [];
        const url = `https://brapi.dev/api/quote/list?search=${query}&token=${BRAPI_TOKEN}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.slice(0, 5);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
            return [];
        }
    },

    // 1. ALTERADO: Agora retorna um objeto { price, changePercent }
    async getPrice(ticker) {
        const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const res = data.results?.[0];
            return {
                price: res?.regularMarketPrice || 0,
                changePercent: res?.regularMarketChangePercent || 0
            };
        } catch (error) {
            return { price: 0, changePercent: 0 };
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

    // 2. ALTERADO: Mapeia cada ticker para um objeto com preço e variação
    async getMarketPrices(tickers) {
        if (tickers.length === 0) return {};
        const tickersString = tickers.join(',');
        const marketData = {};

        for (let index = 0; index < tickers.length; index++) {
            const element = tickers[index];
            const url = `https://brapi.dev/api/quote/${element}?token=${BRAPI_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();
            marketData[element] = {
                price: data.results?.[0]?.regularMarketPrice || 0,
                changePercent: data.results?.[0]?.regularMarketChangePercent || 0
            };
        }
        return marketData
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