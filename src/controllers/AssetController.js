import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { AuthService } from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js'; // IMPORTAÇÃO NECESSÁRIA

export const AssetController = {
    async init() {
        const user = await AuthService.getUser();

        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_enabled')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle para evitar erros se for o primeiro acesso

        // Se o perfil for nulo, define como false por padrão
        user.notifications_enabled = profile ? profile.notifications_enabled : false;

        const userAssets = await AssetService.getAssets();
        const tickers = userAssets.map(a => a.ticker);
        
        const marketData = await AssetService.getMarketPrices(tickers);

        const enrichedAssets = userAssets.map(asset => {
            const live = marketData[asset.ticker] || { price: 0, changePercent: 0 };
            return {
                ...asset,
                currentPrice: live.price,
                dailyChange: live.changePercent 
            };
        });

        AssetView.render(enrichedAssets, user);
        AddAssetView.render();

        this.setupEventListeners();
    },

    setupEventListeners() {
        // --- LOGOUT ---
        document.querySelector('#btn-logout')?.addEventListener('click', async () => {
            await AuthService.signOut();
            window.location.reload();
        });

        // --- BOTÃO DE NOTIFICAÇÃO (SINO) ---
        document.querySelector('#btn-toggle-notif')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');
            
            try {
                // 1. Adiciona a animação imediatamente (feedback visual instantâneo)
                icon.classList.add('bell-animating');
                
                const user = await AuthService.getUser();
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('notifications_enabled')
                    .eq('id', user.id)
                    .maybeSingle();

                const novoEstado = profile ? !profile.notifications_enabled : true;

                // 2. Salva no banco
                const { error } = await supabase
                    .from('profiles')
                    .upsert({ 
                        id: user.id, 
                        email: user.email, 
                        notifications_enabled: novoEstado,
                        updated_at: new Date()
                    });

                if (error) throw error;

                // 3. Atualiza a tela (o init() removerá a classe ao renderizar o novo estado)
                await this.init(); 

            } catch (error) {
                console.error("Erro:", error);
                icon.classList.remove('bell-animating'); // Remove animação em caso de erro
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