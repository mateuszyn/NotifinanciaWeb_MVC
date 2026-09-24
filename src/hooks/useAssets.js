import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AssetService } from '../services/asset-service.js';
import { supabase } from '../infrastructure/supabase-client.js';

// Ordenação: a mesma lógica que existia no AssetController
function sortAssets(assets, criteria) {
    const sorted = [...assets];
    switch (criteria) {
        case 'name_asc': return sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
        case 'name_desc': return sorted.sort((a, b) => b.ticker.localeCompare(a.ticker));
        case 'day_desc': return sorted.sort((a, b) => (b.dailyChange || 0) - (a.dailyChange || 0));
        case 'day_asc': return sorted.sort((a, b) => (a.dailyChange || 0) - (b.dailyChange || 0));
        case 'pm_asc': return sorted.sort((a, b) => (a.variacaoPm || 0) - (b.variacaoPm || 0));
        case 'pm_desc': return sorted.sort((a, b) => (b.variacaoPm || 0) - (a.variacaoPm || 0));
        case 'total_desc': return sorted.sort((a, b) => ((b.currentPrice * b.quantity) || 0) - ((a.currentPrice * a.quantity) || 0));
        case 'total_asc': return sorted.sort((a, b) => ((a.currentPrice * a.quantity) || 0) - ((b.currentPrice * b.quantity) || 0));
        default: return sorted;
    }
}

export function useAssets() {
    const { user, isAuthenticated } = useAuth();
    const [rawAssets, setRawAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Preferências do usuário vindas do perfil (Supabase)
    const [sortBy, setSortBy] = useState('pm_asc');
    const [broker, setBroker] = useState('Nubank');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                if (!isAuthenticated) {
                    // GUEST MODE
                    const demoAssets = [
                        { id: 1, ticker: 'MXRF11', quantity: 150, averagePrice: 10.20, currentPrice: 10.55, variacaoPm: 3.43, dailyChange: 0.5, yieldPct: 12.32, divMensal: 15.00, divAnual: 180.00, paidMonths: [1,2,3,4,5,6,7,8,9,10,11,12], enrich: () => {} },
                        { id: 2, ticker: 'PETR4', quantity: 100, averagePrice: 38.50, currentPrice: 36.20, variacaoPm: -5.97, dailyChange: -1.2, yieldPct: 18.00, divMensal: 0, divAnual: 651.00, paidMonths: [5, 8, 11], enrich: () => {} },
                        { id: 3, ticker: 'KLBN4', quantity: 500, averagePrice: 4.10, currentPrice: 4.35, variacaoPm: 6.09, dailyChange: 1.1, yieldPct: 6.5, divMensal: 0, divAnual: 141.00, paidMonths: [2, 5, 8, 11], enrich: () => {} }
                    ];
                    setRawAssets(demoAssets);
                } else {
                    // Busca perfil do usuário
                    const { data: prof } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (prof) {
                        setSortBy(prof.sort_by || 'pm_asc');
                        setBroker(prof.preferred_broker || 'Nubank');
                        setNotificationsEnabled(prof.notifications_enabled || false);
                    }

                    // REAL MODE: Fetch do banco
                    const userAssets = await AssetService.getAssets();
                    setRawAssets(userAssets || []);

                    // SWR: Revalida preços no background
                    if (userAssets && userAssets.length > 0) {
                        const allTickers = userAssets.map(a => `${a.ticker.replace(/\.SA$/i, '')}.SA`);
                        AssetService.getMarketPrices(allTickers).then(data => {
                            const apiResults = data.results || [];
                            setRawAssets(prev => {
                                const updated = [...prev];
                                updated.forEach(asset => {
                                    const norm = asset.ticker.replace(/\.SA$/i, '').toUpperCase();
                                    let marketData = Array.isArray(apiResults)
                                        ? apiResults.find(i => i.symbol === norm || i.symbol === `${norm}.SA`) || {}
                                        : apiResults[norm] || apiResults[`${norm}.SA`] || {};
                                    asset.enrich(marketData);
                                });
                                AssetService.saveCacheBackground(updated);
                                return [...updated];
                            });
                        }).catch(e => console.error("SWR falhou silenciosamente", e));
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Erro ao carregar os ativos.");
            } finally {
                setLoading(false);
            }
        }

        if (user !== undefined) {
            loadData();
        }
    }, [isAuthenticated, user]);

    // Muda ordenação e salva no perfil
    const handleSortChange = async (newSort) => {
        setSortBy(newSort);
        if (isAuthenticated && user) {
            await supabase.from('profiles').update({ sort_by: newSort }).eq('id', user.id);
        }
    };

    // Muda corretora e salva no perfil
    const handleBrokerChange = async (newBroker) => {
        setBroker(newBroker);
        if (isAuthenticated && user) {
            await supabase.from('profiles').update({ preferred_broker: newBroker }).eq('id', user.id);
        }
    };

    // Toggle de notificações com salva no perfil
    const handleToggleNotif = async () => {
        const novoEstado = !notificationsEnabled;
        setNotificationsEnabled(novoEstado);
        if (isAuthenticated && user) {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                notifications_enabled: novoEstado,
                updated_at: new Date()
            });
        }
    };

    // Ativos já ordenados para renderização
    const assets = sortAssets(rawAssets, sortBy);

    return {
        assets,
        loading,
        error,
        setRawAssets,
        sortBy,
        broker,
        notificationsEnabled,
        onSortChange: handleSortChange,
        onBrokerChange: handleBrokerChange,
        onToggleNotif: handleToggleNotif,
    };
}
