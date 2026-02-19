import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { AuthService } from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';

export const AssetController = {
    async init() {
        const user = await AuthService.getUser();

        // 1. Busca perfil e preferência de ordenação
        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_enabled, sort_by')
            .eq('id', user.id)
            .maybeSingle();

        user.notifications_enabled = profile?.notifications_enabled || false;
        user.sort_by = profile?.sort_by || 'pm_asc';

        // 2. Busca ativos brutos
        const userAssets = await AssetService.getAssets();
        const tickers = userAssets.map(a => a.ticker);
        
        // 3. Busca preços de mercado
        const marketData = await AssetService.getMarketPrices(tickers);

        // 4. CÁLCULO PRIMEIRO (Crucial para a ordenação funcionar)
        let enrichedAssets = userAssets.map(asset => {
            const live = marketData[asset.ticker] || { price: 0, changePercent: 0 };
            const currentPrice = live.price;
            
            // Cálculo da variação baseado no preço médio
            const variacaoPM = asset.averagePrice > 0 
                ? ((currentPrice / asset.averagePrice) - 1) * 100 
                : 0;

            return {
                ...asset,
                currentPrice,
                dailyChange: live.changePercent,
                variacaoPM: variacaoPM, // Valor numérico para o sort
                totalValue: currentPrice * asset.quantity
            };
        });

        // 5. ORDENAÇÃO DEPOIS (Agora os valores existem!)
        enrichedAssets = this.sortAssets(enrichedAssets, user.sort_by);

        // 6. RENDERIZAÇÃO POR ÚLTIMO
        AssetView.render(enrichedAssets, user);
        AddAssetView.render();

        this.setupEventListeners();
    },

    sortAssets(assets, criteria) {
        const sorted = [...assets];
        switch (criteria) {
            case 'name_asc': return sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
            case 'name_desc': return sorted.sort((a, b) => b.ticker.localeCompare(a.ticker));
            case 'day_desc': return sorted.sort((a, b) => b.dailyChange - a.dailyChange);
            case 'day_asc': return sorted.sort((a, b) => a.dailyChange - b.dailyChange);
            case 'pm_asc': 
                return sorted.sort((a, b) => (a.variacaoPM || 0) - (b.variacaoPM || 0));
            case 'pm_desc': 
                return sorted.sort((a, b) => (b.variacaoPM || 0) - (a.variacaoPM || 0));
            case 'total_desc': return sorted.sort((a, b) => b.totalValue - a.totalValue);
            case 'total_asc': return sorted.sort((a, b) => a.totalValue - b.totalValue);
            case 'qty_desc': return sorted.sort((a, b) => b.quantity - a.quantity);
            case 'qty_asc': return sorted.sort((a, b) => a.quantity - b.quantity);
            default: return sorted;
        }
    },

    setupEventListeners() {
        // --- ORDENAÇÃO (NOVO) ---
        document.querySelector('#sort-select')?.addEventListener('change', async (e) => {
            const newSort = e.target.value;
            const user = await AuthService.getUser();
            
            // 1. Feedback visual imediato (opcional: desativar o select enquanto salva)
            e.target.disabled = true;

            try {
                // 2. Salva no Supabase
                const { error } = await supabase
                    .from('profiles')
                    .update({ sort_by: newSort })
                    .eq('id', user.id);

                if (error) throw error;

                // 3. Recarrega os dados e a View
                await this.init(); 
            } catch (err) {
                console.error("Erro ao salvar ordenação:", err);
            } finally {
                e.target.disabled = false;
            }
        });

        // --- OUTROS LISTENERS ---
        // (Logout)
        document.querySelector('#btn-logout')?.addEventListener('click', async () => {
            await AuthService.signOut();
            window.location.reload();
        });

        // (Notificações)
        document.querySelector('#btn-toggle-notif')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');
            try {
                icon.classList.add('bell-animating');
                const user = await AuthService.getUser();
                const { data: profile } = await supabase.from('profiles').select('notifications_enabled').eq('id', user.id).maybeSingle();
                const novoEstado = profile ? !profile.notifications_enabled : true;
                await supabase.from('profiles').upsert({ id: user.id, email: user.email, notifications_enabled: novoEstado, updated_at: new Date() });
                await this.init(); 
            } catch (error) {
                icon.classList.remove('bell-animating');
                alert("Erro ao atualizar notificações.");
            }
        });

        // --- BOTÕES DE ATALHO DE QUANTIDADE ---
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const inputQty = document.querySelector('#quantity');
                const addValue = parseInt(e.currentTarget.dataset.add);
                const currentValue = parseInt(inputQty.value) || 0;
                inputQty.value = currentValue + addValue;
            });
        });

        // --- RECOMENDAÇÃO DE TICKERS ---
        const tickerInput = document.querySelector('#ticker');
        const datalist = document.querySelector('#ticker-suggestions');

        tickerInput?.addEventListener('input', async (e) => {
            const query = e.target.value.toUpperCase();
            if (query.length >= 2) {
                const suggestions = await AssetService.getTickerSuggestions(query);
                if (datalist) {
                    datalist.innerHTML = suggestions
                        .map(t => `<option value="${t}">`)
                        .join('');
                }
            }
        });

        // --- BUSCA DE PREÇO AO DIGITAR TICKER ---
        tickerInput?.addEventListener('blur', async (e) => {
            const ticker = e.target.value.toUpperCase().trim();
            if (ticker) {
                const data = await AssetService.getPrice(ticker);
                if (data.price > 0) {
                    const priceInput = document.querySelector('#averagePrice');
                    const priceDisplay = document.querySelector('#live-price');
                    const infoSpan = document.querySelector('#current-price-info');

                    if (!priceInput.value) priceInput.value = data.price.toFixed(2);
                    
                    if (priceDisplay) {
                        const sign = data.changePercent >= 0 ? '+' : '';
                        priceDisplay.innerText = `${data.price.toFixed(2)} (${sign}${data.changePercent.toFixed(2)}%)`;
                        priceDisplay.className = data.changePercent >= 0 ? 'text-success' : 'text-danger';
                    }
                    if (infoSpan) infoSpan.style.display = 'inline';
                }
            }
        });

        // --- CRIAR ASSET ---
        const form = document.querySelector('#form-asset');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tickerValue = document.querySelector('#ticker').value.toUpperCase().trim();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            
            submitBtn.innerText = "Validando...";
            submitBtn.disabled = true;

            try {
                const isValid = await AssetService.validateTicker(tickerValue);
                if (!isValid) {
                    alert(`O ticker "${tickerValue}" não foi encontrado.`);
                    return;
                }
                const newAsset = {
                    ticker: tickerValue,
                    quantity: Number(document.querySelector('#quantity').value),
                    averagePrice: parseFloat(document.querySelector('#averagePrice').value)
                };
                await AssetService.addAsset(newAsset);
                form.reset();
                await this.init();
            } catch (error) {
                alert('Erro ao processar sua solicitação.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });

        // --- DELETAR ASSET ---
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const idDoAtivo = e.currentTarget.dataset.id;
                if (confirm('Deseja realmente excluir este ativo?')) {
                    try {
                        await AssetService.deleteAsset(idDoAtivo);
                        await this.init();
                    } catch (error) {
                        alert('Erro ao deletar: ' + error.message);
                    }
                }
            });
        });

        // --- EDIÇÃO (MODAL) ---
        const overlay = document.querySelector('#update-modal-overlay');

        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                document.querySelector('#update-id').value = btn.dataset.id;
                document.querySelector('#modal-ticker-title').innerText = btn.dataset.ticker;
                document.querySelector('#update-quantity').value = btn.dataset.qty;
                document.querySelector('#update-averagePrice').value = btn.dataset.price;
                overlay.classList.add('active');
            });
        });

        document.querySelector('#btn-close-modal')?.addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });

        document.querySelector('#form-update-asset')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.querySelector('#update-id').value;
            const data = {
                quantity: Number(document.querySelector('#update-quantity').value),
                averagePrice: parseFloat(document.querySelector('#update-averagePrice').value)
            };
            try {
                await AssetService.updateAsset(id, data);
                overlay.classList.remove('active');
                await this.init();
            } catch (error) {
                alert("Erro: " + error.message);
            }
        });
    }
};