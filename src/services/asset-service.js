import { supabase } from '../infrastructure/supabase-client.js';
import { Asset } from '../models/asset.js';

export const AssetService = {
    // --- BLINDAGEM JWT ---
    async _getAuthHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            throw new Error('Acesso negado: Usuário não autenticado.');
        }
        
        return {
            Authorization: `Bearer ${session.access_token}`
        };
    },

    // Busca ativos no banco de dados e carrega o cache instantâneo (incluindo os meses pagos)
    async getAssets() {
        const { data, error } = await supabase.from('assets').select('*');
        if (error) return [];
        
        return data.map(item => {
            const asset = new Asset(item.ticker, item.quantity, item.average_price);
            asset.id = item.id;
            
            // CACHE INSTANTÂNEO: Aplica preço, variação, DY, P/VP e os meses pagos salvos
            asset.applyCache(item.cached_price, item.cached_change, item.cached_yield, null, item.cached_paid_months);
            
            return asset;
        });
    },

    calculatePortfolioSummary(assets = []) {
        const summary = assets.reduce((totals, asset) => {
            const quantity = Number(asset.quantity) || 0;
            const averagePrice = Number(asset.averagePrice) || 0;
            const currentPrice = Number(asset.currentPrice) || 0;
            const yieldPct = Number(asset.yieldPct) || 0;
            const dailyChange = Number(asset.dailyChange) || 0;
            const currentValue = currentPrice * quantity;
            const investedValue = averagePrice * quantity;

            totals.currentValue += currentValue;
            totals.investedValue += investedValue;
            totals.annualDividends += currentValue * (yieldPct / 100);
            totals.dailyChangeValue += currentValue * (dailyChange / 100);
            return totals;
        }, {
            currentValue: 0,
            investedValue: 0,
            annualDividends: 0,
            dailyChangeValue: 0
        });

        summary.profit = summary.currentValue - summary.investedValue;
        summary.profitPct = summary.investedValue > 0
            ? (summary.profit / summary.investedValue) * 100
            : 0;
        summary.dailyChangePct = summary.currentValue > 0
            ? (summary.dailyChangeValue / summary.currentValue) * 100
            : 0;
        summary.monthlyYieldPct = summary.currentValue > 0
            ? (summary.annualDividends / 12 / summary.currentValue) * 100
            : 0;

        return summary;
    },

    // Salva o cache de todos os ativos no banco de dados em background (agora salvando os paidMonths também)
    async saveCacheBackground(assets) {
        try {
            const promises = assets.map(asset => 
                supabase.from('assets').update({
                    cached_price: asset.currentPrice,
                    cached_change: asset.dailyChange,
                    cached_yield: asset.yieldPct,
                    cached_paid_months: asset.paidMonths
                }).eq('id', asset.id)
            );
            await Promise.all(promises);
        } catch (error) {
            console.warn("Erro silencioso ao salvar cache no background:", error);
        }
    },

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

            const response = await fetch(`/api/market-data?tickers=${cleanTicker}`);

            if (!response.ok) {
                console.warn(`Aviso: Falha ao buscar dados em lote na API Python para: ${cleanTicker}`);
                return { results: {} }; 
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro na chamada da API Python:', error);
            return { results: {} };
        }
    },

    async validateTicker(ticker) {
        if (!ticker) return false;
        try {
            const data = await this.getPrice(ticker);
            return data && data.price > 0;
        } catch (error) {
            return false;
        }
    },

    async getPrice(ticker) {
        try {
            const searchTicker = ticker.toUpperCase().includes('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
            const data = await this.getMarketPrices(searchTicker);
            
            const normalizedTicker = searchTicker;
            const rawTicker = ticker.toUpperCase().replace(/\.SA$/, '');
            
            const res = data.results?.[normalizedTicker] || data.results?.[rawTicker];
            
            return {
                price: Number(res?.price || res?.regularMarketPrice || 0),
                changePercent: Number(res?.changePercent || res?.regularMarketChangePercent || 0),
                yieldPct: Number(res?.yieldpct || res?.yieldPct || res?.dividendYield || res?.yield || 0)
            };
        } catch (error) {
            return { price: 0, changePercent: 0, yieldPct: 0 };
        }
    },

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