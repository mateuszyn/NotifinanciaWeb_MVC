import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { AuthService } from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';
import { TickerDictionary } from '../models/TickerDictionary.js';

export const AssetController = {
    // 1. ESTADO LOCAL (O Cérebro da Micro-renderização)
    state: {
        assets: [],
        user: null,
        isEventsDelegated: false
    },

    async init() {
        const user = await AuthService.getUser();

        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_enabled, sort_by, preferred_broker') 
            .eq('id', user.id)
            .maybeSingle();

        user.notifications_enabled = profile?.notifications_enabled || false;
        user.sort_by = profile?.sort_by || 'pm_asc';
        user.preferred_broker = profile?.preferred_broker || 'Nubank'; 

        this.state.user = user;

        const userAssets = await AssetService.getAssets();

        if (userAssets.length > 0) {
            // 1. Extrai apenas os tickers de toda a carteira
            const allTickers = userAssets.map(a => a.ticker);

            // 2. Faz UMA ÚNICA requisição gigante para economizar a cota do Google
            const marketData = await AssetService.getMarketPrices(allTickers);
            
            // 3. Cria um dicionário com os preços para acharmos mais rápido
            const livePrices = {};
            if (marketData.results) {
                marketData.results.forEach(res => {
                    livePrices[res.symbol] = res;
                });
            }

            // 4. Enriquecemos os ativos da carteira com os dados da memória
            const enrichedAssets = userAssets.map(asset => {
                const live = livePrices[asset.ticker] || { regularMarketPrice: 0, regularMarketChangePercent: 0 };
                
                const currentPrice = live.regularMarketPrice || 0;
                const dailyChange = live.regularMarketChangePercent || 0;
                const variacaoPM = asset.averagePrice > 0 
                    ? ((currentPrice / asset.averagePrice) - 1) * 100 
                    : 0;

                return {
                    ...asset,
                    currentPrice,
                    dailyChange,
                    variacaoPM,
                    totalValue: currentPrice * asset.quantity
                };
            });

            this.state.assets = enrichedAssets;
        } else {
            this.state.assets = [];
        }

        this.renderLocalState();

        if (!this.state.isEventsDelegated) {
            this.setupDelegatedEvents();
            this.state.isEventsDelegated = true;
        }
    },

    // 2. FUNÇÃO DE MICRO-RENDERIZAÇÃO (Desenha a tela sem bater em nenhuma API externa)
    renderLocalState() {
        const sortedAssets = this.sortAssets(this.state.assets, this.state.user.sort_by);
        AssetView.render(sortedAssets, this.state.user);
        AddAssetView.render();
    },

    sortAssets(assets, criteria) {
        const sorted = [...assets];
        switch (criteria) {
            case 'name_asc': return sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
            case 'name_desc': return sorted.sort((a, b) => b.ticker.localeCompare(a.ticker));
            case 'day_desc': return sorted.sort((a, b) => (b.dailyChange || 0) - (a.dailyChange || 0));
            case 'day_asc': return sorted.sort((a, b) => (a.dailyChange || 0) - (b.dailyChange || 0));
            case 'pm_asc': return sorted.sort((a, b) => (a.variacaoPM || 0) - (b.variacaoPM || 0));
            case 'pm_desc': return sorted.sort((a, b) => (b.variacaoPM || 0) - (a.variacaoPM || 0));
            case 'total_desc': return sorted.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
            case 'total_asc': return sorted.sort((a, b) => (a.totalValue || 0) - (b.totalValue || 0));
            case 'qty_desc': return sorted.sort((a, b) => b.quantity - a.quantity);
            case 'qty_asc': return sorted.sort((a, b) => a.quantity - b.quantity);
            default: return sorted;
        }
    },

    // 3. DELEGAÇÃO DE EVENTOS (À prova de quebras e redesenhos)
    setupDelegatedEvents() {
        const appContainer = document.querySelector('#app');
        if (!appContainer) return;

        // --- Cliques Genéricos ---
        appContainer.addEventListener('click', async (e) => {
            
            // EXCLUSÃO (Micro-renderização)
            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete) {
                const idDoAtivo = btnDelete.dataset.id;
                if (confirm('Deseja realmente excluir este ativo?')) {
                    try {
                        await AssetService.deleteAsset(idDoAtivo);
                        
                        // Remove apenas da memória e atualiza a tela na velocidade da luz
                        this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                        this.renderLocalState();
                    } catch (error) {
                        alert('Erro ao deletar: ' + error.message);
                    }
                }
                return;
            }

            // ABRIR MODAL EDIÇÃO
            const btnEdit = e.target.closest('.btn-edit');
            if (btnEdit) {
                document.querySelector('#update-id').value = btnEdit.dataset.id;
                document.querySelector('#modal-ticker-title').innerText = btnEdit.dataset.ticker;
                document.querySelector('#update-quantity').value = btnEdit.dataset.qty;
                document.querySelector('#update-averagePrice').value = btnEdit.dataset.price;
                document.querySelector('#update-modal-overlay')?.classList.add('active');
                return;
            }

            // FECHAR MODAL
            const overlay = document.querySelector('#update-modal-overlay');
            const btnCloseModal = e.target.closest('#btn-close-modal');
            if (btnCloseModal || e.target === overlay) {
                overlay?.classList.remove('active');
                return;
            }

            // TOGGLE NOTIFICAÇÕES (Micro-renderização)
            const btnNotif = e.target.closest('#btn-toggle-notif');
            if (btnNotif) {
                const icon = btnNotif.querySelector('i');
                try {
                    icon.classList.add('bell-animating');
                    const novoEstado = !this.state.user.notifications_enabled;
                    await supabase.from('profiles').upsert({ id: this.state.user.id, email: this.state.user.email, notifications_enabled: novoEstado, updated_at: new Date() });
                    
                    this.state.user.notifications_enabled = novoEstado;
                    this.renderLocalState();
                } catch (error) {
                    icon.classList.remove('bell-animating');
                    alert("Erro ao atualizar notificações.");
                }
                return;
            }

            // LOGOUT
            if (e.target.closest('#btn-logout')) {
                await AuthService.signOut();
                window.location.reload();
                return;
            }
        });

        // --- Filtros e Corretoras (Eventos Change via Delegação) ---
        appContainer.addEventListener('change', async (e) => {
            const sortSelect = e.target.closest('#sort-select');
            if (sortSelect) {
                const newSort = sortSelect.value;
                sortSelect.disabled = true;
                try {
                    await supabase.from('profiles').update({ sort_by: newSort }).eq('id', this.state.user.id);
                    this.state.user.sort_by = newSort;
                    this.renderLocalState();
                } catch (err) { console.error(err); }
                return;
            }

            const brokerSelect = e.target.closest('#broker-select');
            if (brokerSelect) {
                const newBroker = brokerSelect.value;
                brokerSelect.disabled = true;
                try {
                    await supabase.from('profiles').update({ preferred_broker: newBroker }).eq('id', this.state.user.id);
                    this.state.user.preferred_broker = newBroker;
                    this.renderLocalState();
                } catch (err) { console.error(err); }
                return;
            }
        });

        // --- Formulários (Submit) ---
        appContainer.addEventListener('submit', async (e) => {
            
            // SALVAR EDIÇÃO (Micro-renderização com recálculo matemático local)
            const formUpdate = e.target.closest('#form-update-asset');
            if (formUpdate) {
                e.preventDefault();
                const id = document.querySelector('#update-id').value;
                const data = {
                    quantity: Number(document.querySelector('#update-quantity').value),
                    averagePrice: parseFloat(document.querySelector('#update-averagePrice').value)
                };
                
                try {
                    await AssetService.updateAsset(id, data);
                    document.querySelector('#update-modal-overlay')?.classList.remove('active');
                    
                    // Acha o ativo na memória e atualiza sem chamar o Google Finance
                    const asset = this.state.assets.find(a => a.id == id);
                    if (asset) {
                        asset.quantity = data.quantity;
                        asset.averagePrice = data.averagePrice;
                        asset.variacaoPM = asset.averagePrice > 0 ? ((asset.currentPrice / asset.averagePrice) - 1) * 100 : 0;
                        asset.totalValue = asset.currentPrice * asset.quantity;
                    }
                    this.renderLocalState();
                } catch (error) {
                    alert("Erro: " + error.message);
                }
                return;
            }

            // ADICIONAR NOVO ATIVO
            const formCreate = e.target.closest('#form-asset');
            if (formCreate) {
                e.preventDefault();
                const tickerInput = document.querySelector('#asset-ticker');
                const tickerValue = tickerInput ? tickerInput.value.toUpperCase().trim() : '';
                const submitBtn = formCreate.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;

                submitBtn.innerText = "Validando...";
                submitBtn.disabled = true;

                try {
                    const alreadyExists = this.state.assets.some(asset => asset.ticker === tickerValue);
                    if (alreadyExists) {
                        alert(`O ativo ${tickerValue} já está cadastrado. Use a edição.`);
                        submitBtn.innerText = originalText; submitBtn.disabled = false;
                        return;
                    }

                    const isValid = await AssetService.validateTicker(tickerValue);
                    if (!isValid) {
                        alert(`O ticker "${tickerValue}" não foi encontrado.`);
                        submitBtn.innerText = originalText; submitBtn.disabled = false;
                        return;
                    }

                    const newAsset = {
                        ticker: tickerValue,
                        quantity: Number(document.querySelector('#quantity').value),
                        averagePrice: parseFloat(document.querySelector('#averagePrice').value)
                    };

                    await AssetService.addAsset(newAsset);

                    // Motor de descoberta corrigido
                    if (!TickerDictionary.list.includes(tickerValue)) {
                        supabase.from('tickers_descobertos').insert([{ ticker: tickerValue }]).then();
                    }

                    document.querySelector('#add-asset-drawer')?.classList.add('collapsed');
                    
                    // Como é um ativo novo, refazemos o init() para buscar seu preço real no backend
                    await this.init();
                } catch (error) {
                    alert('Erro ao processar sua solicitação.');
                    submitBtn.innerText = originalText; submitBtn.disabled = false;
                }
            }
        });

        // --- Perda de foco para autocompletar preço ---
        appContainer.addEventListener('focusout', async (e) => {
            const tickerInput = e.target.closest('#asset-ticker');
            if (tickerInput) {
                const ticker = tickerInput.value.toUpperCase().trim();
                if (ticker && ticker.length >= 4) {
                    try {
                        const data = await AssetService.getPrice(ticker);
                        if (data && data.price > 0) {
                            // Preenche o input do formulário
                            const priceInput = document.querySelector('#averagePrice');
                            if (priceInput && !priceInput.value) {
                                priceInput.value = data.price.toFixed(2);
                            }
                        }
                    } catch (err) {
                        console.error("Erro ao buscar preço no Google Finance:", err);
                    }
                }
            }
        });
    }
};