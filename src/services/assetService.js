import { supabase } from './supabaseClient.js';
import { Asset } from '../models/Asset.js';

export const AssetService = {
    // Busca ativos no banco de dados
    async getAssets() {
        const { data, error } = await supabase.from('assets').select('*');
        if (error) return [];
        return data.map(item => {
            const asset = new Asset(item.ticker, item.quantity, item.average_price);
            asset.id = item.id;
            return asset;
        });
    },

    // 1. ATUALIZADO: Busca sugestões via Edge Function (Seguro)
    async getTickerSuggestions(query) {
        if (!query || query.length < 2) return [];
        try {
            // Usamos a função proxy para buscar a lista de sugestões
            const { data, error } = await supabase.functions.invoke('market-data', {
                body: { search: query, endpoint: 'list' } 
            });

            if (error) throw error;
            return data.stocks ? data.stocks.map(s => s.stock) : [];
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
            return [];
        }
    },

    // 2. UNIFICADO: Busca em LOTE (Batch) para economizar a cota do Google
    async getMarketPrices(tickers) {
        if (!tickers || (Array.isArray(tickers) && tickers.length === 0)) return { results: [] };
        
        try {
            let tickerString = '';
            
            // Se for um Array (vários ativos), junta tudo com vírgula
            if (Array.isArray(tickers)) {
                tickerString = tickers.join(','); 
            } else if (typeof tickers === 'object' && tickers.ticker) {
                tickerString = String(tickers.ticker);
            } else {
                tickerString = String(tickers);
            }

            const cleanTicker = tickerString.toUpperCase().replace(/\s/g, ''); // Limpa os espaços

            const { data, error } = await supabase.functions.invoke('market-data', {
                body: { tickers: cleanTicker }
            });

            if (error || !data || !data.results) {
                console.warn(`Aviso: Falha ao buscar dados em lote para: ${cleanTicker}`);
                return { results: [] }; 
            }

            return data;
        } catch (error) {
            console.error('Erro na chamada da Edge Function:', error);
            return { results: [] };
        }
    },

    // 3. ATUALIZADO: Valida ticker usando a Edge Function
    async validateTicker(ticker) {
        if (!ticker) return false;
        try {
            const data = await this.getMarketPrices(ticker);
            return data.results && data.results.length > 0 && data.results[0].symbol;
        } catch (error) {
            return false;
        }
    },

    // 4. ATUALIZADO: getPrice agora utiliza a lógica segura
    async getPrice(ticker) {
        try {
            const data = await this.getMarketPrices(ticker);
            const res = data.results?.[0];
            return {
                price: res?.regularMarketPrice || 0,
                changePercent: res?.regularMarketChangePercent || 0
            };
        } catch (error) {
            return { price: 0, changePercent: 0 };
        }
    },

    // Operações de Banco de Dados (Supabase + RLS garantem a segurança aqui)
    async addAsset(asset) {
        const { error } = await supabase
            .from('assets')
            .insert([{
                ticker: asset.ticker.toUpperCase(),
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