import { supabase } from '../infrastructure/supabaseClient.js';
import { Asset } from '../models/asset.js';

export const AssetService = {
    // --- BLINDAGEM JWT ---
    // Captura o token de sessão ativo para provar que a requisição é legítima
    async _getAuthHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            throw new Error('Acesso negado: Usuário não autenticado.');
        }
        
        return {
            Authorization: `Bearer ${session.access_token}`
        };
    },

    // Busca ativos no banco de dados (A segurança aqui já é feita pelo RLS do banco)
    async getAssets() {
        const { data, error } = await supabase.from('assets').select('*');
        if (error) return [];
        
        return data.map(item => {
            const asset = new Asset(item.ticker, item.quantity, item.average_price);
            asset.id = item.id;
            
            // MÁGICA DO CACHE: Aplica os valores da última sessão instantaneamente
            asset.applyCache(item.cached_price, item.cached_change, item.cached_yield);
            
            return asset;
        });
    },

    // Salva o cache de todos os ativos no banco de dados de forma silenciosa
    async saveCacheBackground(assets) {
        try {
            const promises = assets.map(asset => 
                supabase.from('assets').update({
                    cached_price: asset.currentPrice,
                    cached_change: asset.dailyChange,
                    cached_yield: asset.yieldPct
                }).eq('id', asset.id)
            );
            await Promise.all(promises);
        } catch (error) {
            console.warn("Erro silencioso ao salvar cache no background:", error);
        }
    },

    // 1. ATUALIZADO: Busca sugestões enviando o Token JWT
    async getTickerSuggestions(query) {
        if (!query || query.length < 2) return [];
        try {
            const headers = await this._getAuthHeaders();
            
            const { data, error } = await supabase.functions.invoke('market-data', {
                body: { search: query, endpoint: 'list' },
                headers: headers
            });

            if (error) throw error;
            return data.stocks ? data.stocks.map(s => s.stock) : [];
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
            return [];
        }
    },

    // 2. UNIFICADO: Busca em LOTE (Batch) enviando o Token JWT
   // 2. UNIFICADO: Busca em LOTE (Batch) apontando para a API em Python (Vercel)
    async getMarketPrices(tickers) {
        if (!tickers || (Array.isArray(tickers) && tickers.length === 0)) return { results: {} };
        
        try {
            let tickerString = '';
            
            if (Array.isArray(tickers)) {
                tickerString = tickers.join(','); 
            } else if (typeof tickers === 'object' && tickers.ticker) {
                tickerString = String(tickers.ticker);
            } else {
                tickerString = String(tickers);
            }

            const cleanTicker = tickerString.toUpperCase().replace(/\s/g, '');

            // BINGO: Chamando a sua API Python nativa da Vercel em vez da Edge Function!
            const response = await fetch(`/api/market-data?tickers=${cleanTicker}`);

            if (!response.ok) {
                console.warn(`Aviso: Falha ao buscar dados em lote na API Python para: ${cleanTicker}`);
                return { results: {} }; 
            }

            const data = await response.json();
            return data; // Retorna o JSON certinho que o Python já cospe
        } catch (error) {
            console.error('Erro na chamada da API Python:', error);
            return { results: {} };
        }
    },

    // 3. Valida ticker usando a lógica de tradução já consertada
    async validateTicker(ticker) {
        if (!ticker) return false;
        try {
            // Reaproveitamos o getPrice que já sabe ler a API em Python e o .SA perfeitamente!
            const data = await this.getPrice(ticker);
            return data && data.price > 0;
        } catch (error) {
            return false;
        }
    },

    // 4. getPrice usa a lógica segura da API Python com tradutor e sufixo .SA
    async getPrice(ticker) {
        try {
            // Garante que a busca no backend vai com o .SA (exigência do Yahoo Finance para a B3)
            const searchTicker = ticker.toUpperCase().includes('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
            const data = await this.getMarketPrices(searchTicker);
            
            // Procura a resposta tanto com o .SA quanto sem ele
            const normalizedTicker = searchTicker;
            const rawTicker = ticker.toUpperCase().replace(/\.SA$/, '');
            
            const res = data.results?.[normalizedTicker] || data.results?.[rawTicker];
            
            return {
                // O Tradutor: Lê o formato velho e o formato puro da Edge/Python
                price: Number(res?.price || res?.regularMarketPrice || 0),
                changePercent: Number(res?.changePercent || res?.regularMarketChangePercent || 0),
                yieldPct: Number(res?.yieldpct || res?.yieldPct || res?.dividendYield || res?.yield || 0)
            };
        } catch (error) {
            return { price: 0, changePercent: 0, yieldPct: 0 };
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