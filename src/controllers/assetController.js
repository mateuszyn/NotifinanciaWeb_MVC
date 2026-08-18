import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/assetView.js';
import { AddAssetView } from '../views/addAssetView.js';
import { AuthService } from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';
import { TickerDictionary } from '../utils/tickerDictionary.js';
import { Profile } from '../models/profile.js';

export const AssetController = {
    state: {
        assets: [],
        profile: null,
        user: null,
        isEventsDelegated: false
    },

    async init() {
        const user = await AuthService.getUser();

        const { data: prof } = await supabase
            .from('profiles')
            .eq('id', user.id)
            .maybeSingle();
        
        const profile = Profile.fromJson(prof);

        user.notifications_enabled = profile?.notificationsEnabled || false;
        user.sort_by = profile?.sortBy || 'pm_asc';
        user.preferred_broker = profile?.preferedBroker || 'Nubank'; 

        this.state.user = user;
        this.state.profile = profile;
        this.renderLocalState();

        const userAssets = await AssetService.getAssets();

        if (userAssets.length > 0) {
            const allTickers = userAssets.map(asset => `${asset.ticker.replace(/\.SA$/i, '')}.SA`);
            let apiResults = {};

            try {
                const response = await fetch(`/api/market-data?tickers=${allTickers.join(',')}`);
                if (response.ok) {
                    const data = await response.json();
                    apiResults = data.results || {};
                }
            } catch (error) {
                console.error('Erro ao buscar dados da API de mercado:', error);
            }

            const enrichedAssets = userAssets.map(asset => {
                const normalizedTicker = asset.ticker.replace(/\.SA$/i, '').replace(/\.sa$/i, '').toUpperCase();
                const apiAsset = apiResults[normalizedTicker] || apiResults[`${normalizedTicker}.SA`] || {};
                const hasApiData = Boolean(apiAsset && Object.keys(apiAsset).length > 0);
                const hasMeaningfulValues = hasApiData && (Number(apiAsset.price) > 0 || Number(apiAsset.changePercent) !== 0 || Number(apiAsset.yieldpct) > 0);
                const currentPrice = apiAsset.price ?? asset.averagePrice ?? 0;
                const dailyChange = apiAsset.changePercent ?? 0;
                const yieldpct = apiAsset.yieldpct ?? 0;
                const divAnual = currentPrice * (yieldpct / 100) * asset.quantity;
                const divMensal = divAnual / 12;
                const variacaoPM = asset.averagePrice > 0 
                    ? ((currentPrice / asset.averagePrice) - 1) * 100 
                    : 0;

                return {
                    ...asset,
                    currentPrice,
                    dailyChange,
                    variacaoPM,
                    totalValue: currentPrice * asset.quantity,
                    yieldpct,
                    divAnual,
                    divMensal,
                    dataError: !hasMeaningfulValues
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

    showLoading(message) {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    },

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message
        });
    },

    setupDelegatedEvents() {
        const appContainer = document.querySelector('#app');
        if (!appContainer) return;

        appContainer.addEventListener('click', async (e) => {
            
            // --- NOVO: BOTÃO DE RECARREGAR PREÇO ---
            const btnRetryPrice = e.target.closest('#btn-retry-price');
            if (btnRetryPrice) {
                const tickerInput = document.querySelector('#asset-ticker');
                const priceInput = document.querySelector('#averagePrice');
                const ticker = tickerInput ? tickerInput.value.toUpperCase().trim() : '';
                
                if (ticker && ticker.length >= 4) {
                    const originalPlaceholder = priceInput.placeholder;
                    priceInput.value = ''; // Limpa o valor antigo
                    priceInput.placeholder = "Buscando Valor Atual... (Altere para o Seu P.M Real)...";
                    priceInput.disabled = true; 
                    
                    try {
                        const data = await AssetService.getPrice(ticker);
                        if (data && data.price > 0) {
                            priceInput.value = data.price.toFixed(2);

                            const yieldAnual = Number(data.yieldPct || 0);
                            if (yieldAnual > 0) {
                                const rendaMensalPorCota = (data.price * (yieldAnual / 100)) / 12;
                                const cotasParaBolaDeNeve = rendaMensalPorCota > 0 ? Math.ceil(data.price / rendaMensalPorCota) : 0;
                                AddAssetView.injectSnowballInfo(cotasParaBolaDeNeve);
                            } else {
                                AddAssetView.clearSnowballInfo();
                            }
                        } else {
                            AddAssetView.clearSnowballInfo();
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'warning',
                                title: 'Preço não encontrado. Digite manualmente.',
                                showConfirmButton: false,
                                timer: 3000
                            });
                        }
                    } catch (err) {
                        AddAssetView.clearSnowballInfo();
                        console.error("Erro ao forçar busca de preço:", err);
                    } finally {
                        priceInput.placeholder = originalPlaceholder;
                        priceInput.disabled = false;
                        priceInput.focus(); // Devolve o foco para facilitar a digitação manual
                    }
                } else {
                    AddAssetView.clearSnowballInfo();
                    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Digite um Ticker primeiro.', showConfirmButton: false, timer: 2000 });
                }
                return;
            }

            // Quick quantity buttons in update modal (+1, -1, +10, -10)
            const btnQuickQty = e.target.closest('.btn-quick-qty');
            if (btnQuickQty) {
                const delta = Number(btnQuickQty.dataset.val) || 0;
                const qtyInput = document.querySelector('#update-quantity');
                if (!qtyInput) return;
                let current = Number(qtyInput.value) || 0;
                current = current + delta;
                if (current < 0) current = 0;
                qtyInput.value = current;
                qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }

            // Quick price buttons in update modal (R$ adjustments)
            const btnQuickPrice = e.target.closest('.btn-quick-price');
            if (btnQuickPrice) {
                const deltaRaw = btnQuickPrice.dataset.val;
                if (typeof deltaRaw === 'undefined') return;
                const delta = parseFloat(String(deltaRaw).replace(',', '.')) || 0;
                const priceInput = document.querySelector('#update-averagePrice');
                if (!priceInput) return;
                let current = parseFloat(priceInput.value) || 0;
                current = current + delta;
                if (current < 0) current = 0;
                // Keep two decimal places
                priceInput.value = current.toFixed(2);
                priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }

            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete) {
                const idDoAtivo = btnDelete.dataset.id;
                const asset = this.state.assets.find(a => a.id == idDoAtivo);
                
                if (!asset) {
                    this.showError('Ativo não encontrado.');
                    return;
                }

                // Função interna para calcular o último dia útil do mês seguinte
                const getLastBusinessDay = () => {
                    const today = new Date();
                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                    let dayOfWeek = nextMonth.getDay();
                    
                    if (dayOfWeek === 0) nextMonth.setDate(nextMonth.getDate() - 2);
                    else if (dayOfWeek === 6) nextMonth.setDate(nextMonth.getDate() - 1);
                    
                    const day = String(nextMonth.getDate()).padStart(2, '0');
                    const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
                    const year = nextMonth.getFullYear();
                    return `${day}/${month}/${year}`;
                };

                // Verifica se é FII (ticker termina em '11') e calcula lucro/prejuízo
                const isFII = asset.ticker.endsWith('11');
                const lucro = (asset.currentPrice - asset.averagePrice) * asset.quantity;
                const temLucro = lucro > 0;
                const temPrejuizo = lucro < 0;

                let alertConfig;

                if (isFII && temLucro) {
                    // Mantém comportamento existente para FIIs com lucro (imposto)
                    const imposto = lucro * 0.20;
                    const lucroFormatado = lucro.toFixed(2).replace('.', ',');
                    const impostoFormatado = imposto.toFixed(2).replace('.', ',');
                    const dataVencimento = getLastBusinessDay();

                    alertConfig = {
                        title: 'Atenção: Imposto Devido',
                        icon: 'warning',
                        html: `
    <div class="mb-3">
        Lucro apurado: <b>R$ ${lucroFormatado}</b><br>
        Imposto a pagar (20%): <b><span class="text-danger">R$ ${impostoFormatado}</span></b>
    </div>
    <div class="text-start">
        <p class="small text-secondary mb-2"><b>1.</b> Efetue a venda na sua corretora.</p>
        <p class="small text-secondary mb-1"><b>2.</b> Acesse o <a href="https://sicalc.receita.economia.gov.br/sicalc/principal" target="_blank" class="fw-bold text-primary text-decoration-underline">SicalcWeb <i class="bi bi-box-arrow-up-right"></i></a> e siga o caminho:</p>
        <div class="p-2 rounded mb-2" style="background-color: rgba(255,255,255,0.05); border: 1px dashed #6c757d; font-size: 0.75rem;">
            <i class="bi bi-arrow-return-right text-success"></i> Preenchimento rápido<br>
            <i class="bi bi-arrow-return-right text-success"></i> Pessoa Física (CPF)<br>
            <i class="bi bi-arrow-return-right text-success"></i> Código da Receita: <b>6015</b><br>
            <i class="bi bi-arrow-return-right text-success"></i> Vencimento: <b>${dataVencimento}</b>
        </div>
    </div>
`,
                        showCloseButton: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showCancelButton: true,
                        confirmButtonColor: '#dc3545',
                        confirmButtonText: 'Sim, remover da carteira',
                        cancelButtonText: 'Cancelar',
                        preConfirm: async () => {
                            Swal.showLoading();
                            try {
                                await AssetService.deleteAsset(idDoAtivo);
                                this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                                this.renderLocalState();

                                Swal.hideLoading();
                                Swal.update({
                                    title: 'Ativo Removido!',
                                    icon: 'success',
                                    showConfirmButton: false,
                                    showCancelButton: false
                                });

                                const confirmBtn = Swal.getConfirmButton();
                                const cancelBtn = Swal.getCancelButton();
                                if (confirmBtn) confirmBtn.style.display = 'none';
                                if (cancelBtn) cancelBtn.style.display = 'none';

                                return false;
                            } catch (error) {
                                Swal.showValidationMessage('Erro ao deletar: ' + error.message);
                                return false;
                            }
                        }
                    };

                } else if (isFII && temPrejuizo) {
                    // Novo alerta para FIIs vendidos com prejuízo
                    const prejuizoFormatado = Math.abs(lucro).toFixed(2).replace('.', ',');
                    alertConfig = {
                        title: 'Venda com Prejuízo (Sem Imposto)',
                        icon: 'info',
                        html: `
    <div class="mb-3">
        Prejuízo apurado: <b class="text-danger">R$ ${prejuizoFormatado}</b>
    </div>
    <div class="text-start">
        <p class="small text-secondary mb-2">Como a operação gerou prejuízo, não há DARF a pagar sobre essa venda.</p>
        <p class="small text-secondary mb-1">Recomendamos anotar este prejuízo para abater de futuros lucros com FIIs na sua declaração anual.</p>
    </div>
`,
                        showCloseButton: true,
                        allowOutsideClick: false,
                        showCancelButton: true,
                        confirmButtonColor: '#dc3545',
                        confirmButtonText: 'Entendi, remover ativo',
                        cancelButtonText: 'Cancelar',
                        preConfirm: async () => {
                            Swal.showLoading();
                            try {
                                await AssetService.deleteAsset(idDoAtivo);
                                this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                                this.renderLocalState();

                                Swal.hideLoading();
                                Swal.update({
                                    title: 'Ativo Removido!',
                                    icon: 'success',
                                    showConfirmButton: false,
                                    showCancelButton: false
                                });

                                const confirmBtn = Swal.getConfirmButton();
                                const cancelBtn = Swal.getCancelButton();
                                if (confirmBtn) confirmBtn.style.display = 'none';
                                if (cancelBtn) cancelBtn.style.display = 'none';

                                return false;
                            } catch (error) {
                                Swal.showValidationMessage('Erro ao deletar: ' + error.message);
                                return false;
                            }
                        }
                    };

                } else {
                    // Alerta padrão para ações ou FIIs empatados
                    alertConfig = {
                        title: 'Excluir Ativo?',
                        text: "Você não poderá reverter isso!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#dc3545',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: 'Sim, excluir!',
                        cancelButtonText: 'Cancelar'
                    };
                }

                Swal.fire(alertConfig).then(async (result) => {
                    // Para FIIs com lucro ou prejuízo, o preConfirm já trata a exclusão.
                    if ((isFII && temLucro) || (isFII && temPrejuizo)) {
                        return;
                    }

                    // Para outros ativos, processa a exclusão após confirmação
                    if (result.isConfirmed) {
                        this.showLoading('Excluindo ativo...');
                        try {
                            await AssetService.deleteAsset(idDoAtivo);
                            this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                            this.renderLocalState();
                            this.showSuccess('Ativo removido da carteira.');
                        } catch (error) {
                            this.showError('Erro ao deletar: ' + error.message);
                        }
                    }
                });
                return;
            }

            const btnRetryAsset = e.target.closest('.btn-retry-asset');
            if (btnRetryAsset) {
                const ticker = btnRetryAsset.dataset.ticker;
                if (!ticker) return;

                const assetIndex = this.state.assets.findIndex(asset => asset.ticker.toUpperCase() === ticker.toUpperCase());
                if (assetIndex === -1) return;

                const button = btnRetryAsset;
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-arrow-repeat"></i> Carregando...';

                try {
                    const data = await AssetService.getMarketPrices([ticker]);
                    const result = data.results?.[0] || data.results?.[ticker.toUpperCase()] || data.results?.[`${ticker.toUpperCase()}.SA`] || null;

                    if (result && (Number(result.price) > 0 || Number(result.changePercent) !== 0 || Number(result.yieldpct) > 0)) {
                        const asset = this.state.assets[assetIndex];
                        const normalizedTicker = ticker.replace(/\.SA$/i, '').replace(/\.sa$/i, '').toUpperCase();
                        const currentPrice = result.price ?? asset.averagePrice ?? 0;
                        const dailyChange = result.changePercent ?? 0;
                        const yieldpct = result.yieldpct ?? 0;
                        const divAnual = currentPrice * (yieldpct / 100) * asset.quantity;
                        const divMensal = divAnual / 12;
                        const variacaoPM = asset.averagePrice > 0 
                            ? ((currentPrice / asset.averagePrice) - 1) * 100 
                            : 0;

                        this.state.assets[assetIndex] = {
                            ...asset,
                            currentPrice,
                            dailyChange,
                            variacaoPM,
                            totalValue: currentPrice * asset.quantity,
                            yieldpct,
                            divAnual,
                            divMensal,
                            dataError: false
                        };
                    } else {
                        this.state.assets[assetIndex] = {
                            ...this.state.assets[assetIndex],
                            dataError: true
                        };
                    }

                    this.renderLocalState();
                } catch (error) {
                    console.error('Erro ao recarregar ativo individual:', error);
                    this.state.assets[assetIndex] = {
                        ...this.state.assets[assetIndex],
                        dataError: true
                    };
                    this.renderLocalState();
                }

                return;
            }

            const btnEdit = e.target.closest('.btn-edit');
            if (btnEdit) {
                document.querySelector('#update-id').value = btnEdit.dataset.id;
                document.querySelector('#modal-ticker-title').innerText = btnEdit.dataset.ticker;
                document.querySelector('#update-quantity').value = btnEdit.dataset.qty;
                document.querySelector('#update-averagePrice').value = btnEdit.dataset.price;
                document.querySelector('#update-modal-overlay')?.classList.add('active');
                return;
            }

            const overlay = document.querySelector('#update-modal-overlay');
            const btnCloseModal = e.target.closest('#btn-close-modal');
            if (btnCloseModal || e.target === overlay) {
                overlay?.classList.remove('active');
                return;
            }

            const btnNotif = e.target.closest('#btn-toggle-notif');
            if (btnNotif) {
                const icon = btnNotif.querySelector('i');
                try {
                    icon.classList.add('bell-animating');
                    const novoEstado = !this.state.user.notifications_enabled;
                    await supabase.from('profiles').upsert({ id: this.state.user.id, email: this.state.user.email, notifications_enabled: novoEstado, updated_at: new Date() });
                    
                    this.state.user.notifications_enabled = novoEstado;
                    this.renderLocalState();

                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: novoEstado ? 'success' : 'info',
                        title: novoEstado ? 'Notificações Ativadas' : 'Notificações Desativadas',
                        showConfirmButton: false,
                        timer: 2000
                    });

                } catch (error) {
                    icon.classList.remove('bell-animating');
                    this.showError("Erro ao atualizar notificações.");
                }
                return;
            }

            if (e.target.closest('#btn-logout')) {
                await AuthService.signOut();
                window.location.reload();
                return;
            }
        });

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

        appContainer.addEventListener('submit', async (e) => {
            const formUpdate = e.target.closest('#form-update-asset');
            if (formUpdate) {
                e.preventDefault();
                
                const id = document.querySelector('#update-id').value;
                const qtyInput = document.querySelector('#update-quantity');
                const priceInput = document.querySelector('#update-averagePrice');

                if (!qtyInput.value || !priceInput.value) {
                    this.showError('Por favor, preencha a quantidade e o preço médio.');
                    return;
                }

                const data = {
                    quantity: Number(qtyInput.value),
                    averagePrice: parseFloat(priceInput.value)
                };

                const editButton = document.querySelector(`.btn-edit[data-id="${id}"]`);
                const deleteButton = document.querySelector(`.btn-delete[data-id="${id}"]`);
                const ticker = editButton?.dataset.ticker || '';
                const loadingIcon = ticker ? document.getElementById(`loading-${ticker}`) : null;

                // --- MAGIA ACONTECENDO AQUI ---
                // Mostra o ícone girando removendo a classe d-none que o Bootstrap força
                if (loadingIcon) {
                    loadingIcon.classList.remove('d-none');
                    loadingIcon.classList.add('d-inline-block');
                }
                
                // Esconde os botões normais para evitar múltiplos cliques
                if (editButton) editButton.style.display = 'none';
                if (deleteButton) deleteButton.style.display = 'none';

                // Fecha o modal imediatamente! O usuário vai ver a tela principal com o ícone rodando
                document.querySelector('#update-modal-overlay')?.classList.remove('active');

                try {
                    await AssetService.updateAsset(id, data);

                    const asset = this.state.assets.find(a => Number(a.id) === Number(id));
                    if (asset) {
                        asset.quantity = data.quantity;
                        asset.averagePrice = data.averagePrice;
                        const currentPrice = Number(asset.currentPrice) || Number(asset.averagePrice) || 0;
                        const yieldpct = Number(asset.yieldpct) || 0;
                        const divAnual = currentPrice * (yieldpct / 100) * asset.quantity;
                        const divMensal = divAnual / 12;

                        asset.variacaoPM = asset.averagePrice > 0 ? ((currentPrice / asset.averagePrice) - 1) * 100 : 0;
                        asset.totalValue = currentPrice * asset.quantity;
                        asset.divAnual = divAnual;
                        asset.divMensal = divMensal;
                    }

                    // Ao chamar o renderLocalState(), ele refaz o HTML do zero.
                    // Ou seja: a roldana some e os botões originais voltam automaticamente!
                    this.renderLocalState();
                    
                    // Um aviso sutil de sucesso no canto, para não travar a tela
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Ativo atualizado!',
                        showConfirmButton: false,
                        timer: 2000
                    });

                } catch (error) {
                    // Se der erro, voltamos os botões para o estado inicial
                    if (loadingIcon) {
                        loadingIcon.classList.add('d-none');
                        loadingIcon.classList.remove('d-inline-block');
                    }
                    if (editButton) editButton.style.display = 'inline-block';
                    if (deleteButton) deleteButton.style.display = 'inline-block';
                    
                    this.showError("Erro: " + error.message);
                }
                return;
            }

            const formCreate = e.target.closest('#form-asset');
            if (formCreate) {
                e.preventDefault();
                
                const tickerInput = document.querySelector('#asset-ticker');
                const qtyInput = document.querySelector('#quantity');
                const priceInput = document.querySelector('#averagePrice');
                
                const tickerValue = tickerInput ? tickerInput.value.toUpperCase().trim() : '';
                const qtyValue = qtyInput ? qtyInput.value : '';
                const priceValue = priceInput ? priceInput.value : '';

                if (!tickerValue || !qtyValue || !priceValue) {
                    this.showError('Por favor, preencha o Ticker, a Quantidade e o Preço Médio.');
                    return;
                }

                this.showLoading('Buscando e validando ativo...');

                try {
                    const alreadyExists = this.state.assets.some(asset => asset.ticker === tickerValue);
                    if (alreadyExists) {
                        this.showError(`O ativo ${tickerValue} já está cadastrado. Use a edição.`);
                        return;
                    }

                    const isValid = await AssetService.validateTicker(tickerValue);
                    if (!isValid) {
                        this.showError(`O ticker "${tickerValue}" não foi encontrado na B3.`);
                        return;
                    }

                    Swal.fire({
                        title: 'Salvando na carteira...',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                    });

                    const newAsset = {
                        ticker: tickerValue,
                        quantity: Number(qtyValue),
                        averagePrice: parseFloat(priceValue)
                    };

                    await AssetService.addAsset(newAsset);

                    if (!TickerDictionary.list.includes(tickerValue)) {
                        supabase.from('tickers_descobertos').insert([{ ticker: tickerValue }]).then();
                    }

                    document.querySelector('#add-asset-drawer')?.classList.add('collapsed');
                    
                    if (tickerInput) tickerInput.value = '';
                    if (qtyInput) qtyInput.value = '';
                    if (priceInput) priceInput.value = '';

                    await this.init();
                    this.showSuccess(`${tickerValue} adicionado com sucesso!`);
                } catch (error) {
                    this.showError('Erro ao processar sua solicitação.');
                }
            }
        });

        appContainer.addEventListener('focusout', async (e) => {
            if (e.target && e.target.id === 'asset-ticker') {
                const ticker = e.target.value.toUpperCase().trim();
                const priceInput = document.querySelector('#averagePrice');

                if (!ticker || ticker.length < 4) {
                    AddAssetView.clearSnowballInfo();
                    return;
                }
                
                if (priceInput && !priceInput.value) {
                    const originalPlaceholder = priceInput.placeholder;
                    priceInput.placeholder = "Buscando Valor Atual... (Altere para o Seu P.M Real)...";
                    priceInput.disabled = true; 
                    
                    try {
                        const data = await AssetService.getPrice(ticker);
                        if (data && data.price > 0 && !priceInput.value) {
                            priceInput.value = data.price.toFixed(2);
                        }

                        if (data && data.price > 0) {
                            const yieldAnual = Number(data.yieldPct || 0);
                            if (yieldAnual > 0) {
                                const rendaMensalPorCota = (data.price * (yieldAnual / 100)) / 12;
                                const cotasParaBolaDeNeve = rendaMensalPorCota > 0 ? Math.ceil(data.price / rendaMensalPorCota) : 0;
                                AddAssetView.injectSnowballInfo(cotasParaBolaDeNeve);
                            } else {
                                AddAssetView.clearSnowballInfo();
                            }
                        } else {
                            AddAssetView.clearSnowballInfo();
                        }
                    } catch (err) {
                        AddAssetView.clearSnowballInfo();
                        console.error("Erro ao buscar preço no Google:", err);
                    } finally {
                        priceInput.placeholder = originalPlaceholder;
                        priceInput.disabled = false;
                    }
                }
            }
        });
    }
};