import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/assetView.js';
import { AddAssetView } from '../views/addAssetView.js';
import { AuthService } from '../services/authService.js';
import { supabase } from '../infrastructure/supabaseClient.js';
import { TickerDictionary } from '../utils/tickerDictionary.js';
import { Profile } from '../models/profile.js';

export const AssetController = {
    state: {
        assets: [],
        profile: null,
        user: null,
        isEventsDelegated: false,
        validatedTickers: new Set() // MEMÓRIA: Guarda ativos já validados no form
    },

    // ==========================================
    // 1. INICIALIZAÇÃO E ESTADO (SWR CACHE)
    // ==========================================
    async init() {
        const user = await AuthService.getUser();

        const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        
        const profile = Profile.fromJson(prof);

        user.notifications_enabled = profile?.notificationsEnabled || false;
        user.sort_by = profile?.sortBy || 'pm_asc';
        user.preferred_broker = profile?.preferedBroker || 'Nubank'; 

        this.state.user = user;
        this.state.profile = profile;
        
        const userAssets = await AssetService.getAssets();
        this.state.assets = userAssets || [];
        
        this.renderLocalState(); 

        if (!this.state.isEventsDelegated) {
            this.setupDelegatedEvents();
            this.state.isEventsDelegated = true;
        }

        if (this.state.assets.length > 0) {
            const allTickers = this.state.assets.map(asset => `${asset.ticker.replace(/\.SA$/i, '')}.SA`);
            
            try {
                const data = await AssetService.getMarketPrices(allTickers);
                const apiResults = data.results || [];

                this.state.assets.forEach(asset => {
                    const normalizedTicker = asset.ticker.replace(/\.SA$/i, '').toUpperCase();
                    let marketData = {};
                    if (Array.isArray(apiResults)) {
                        marketData = apiResults.find(item => 
                            item.symbol === normalizedTicker || item.symbol === `${normalizedTicker}.SA`
                        ) || {};
                    } else {
                        marketData = apiResults[normalizedTicker] || apiResults[`${normalizedTicker}.SA`] || {};
                    }
                    asset.enrich(marketData);
                });

                this.renderLocalState();
                AssetService.saveCacheBackground(this.state.assets);
            } catch (error) {
                console.error("SWR: Falha silenciosa ao revalidar preços no background.", error);
            }
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
            case 'pm_asc': return sorted.sort((a, b) => (a.variacaoPm || 0) - (b.variacaoPm || 0));
            case 'pm_desc': return sorted.sort((a, b) => (b.variacaoPm || 0) - (a.variacaoPm || 0));
            case 'total_desc': return sorted.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
            case 'total_asc': return sorted.sort((a, b) => (a.totalValue || 0) - (b.totalValue || 0));
            case 'qty_desc': return sorted.sort((a, b) => b.quantity - a.quantity);
            case 'qty_asc': return sorted.sort((a, b) => a.quantity - b.quantity);
            default: return sorted;
        }
    },

    // ==========================================
    // 2. DESPACHANTE DE EVENTOS (EVENT DISPATCHER)
    // ==========================================
    setupDelegatedEvents() {
        const appContainer = document.querySelector('#app');
        if (!appContainer) return;

        appContainer.addEventListener('click', (e) => this.handleClicks(e));
        appContainer.addEventListener('change', (e) => this.handleChanges(e));
        appContainer.addEventListener('submit', (e) => this.handleSubmits(e));
        appContainer.addEventListener('focusout', (e) => this.handleFocusOut(e));
    },

    // ==========================================
    // 3. ROTEADORES DE EVENTOS
    // ==========================================
    handleClicks(e) {
        if (e.target.closest('#btn-retry-price')) this.onRetryPriceForm(e);
        if (e.target.closest('.btn-quick-qty')) this.onQuickQty(e);
        if (e.target.closest('.btn-quick-price')) this.onQuickPrice(e);
        if (e.target.closest('.btn-delete')) this.onDeleteAsset(e.target.closest('.btn-delete'));
        if (e.target.closest('.btn-retry-asset')) this.onRetrySingleAsset(e.target.closest('.btn-retry-asset'));
        if (e.target.closest('.btn-edit')) this.onEditModalOpen(e.target.closest('.btn-edit'));
        if (e.target.closest('#btn-close-modal') || e.target === document.querySelector('#update-modal-overlay')) this.onEditModalClose();
        if (e.target.closest('#btn-toggle-notif')) this.onToggleNotif(e.target.closest('#btn-toggle-notif'));
        if (e.target.closest('#btn-logout')) this.onLogout();
    },

    handleChanges(e) {
        if (e.target.closest('#sort-select')) this.onChangeSort(e.target.closest('#sort-select'));
        if (e.target.closest('#broker-select')) this.onChangeBroker(e.target.closest('#broker-select'));
    },

    handleSubmits(e) {
        if (e.target.closest('#form-update-asset')) this.onUpdateSubmit(e, e.target.closest('#form-update-asset'));
        if (e.target.closest('#form-asset')) this.onCreateSubmit(e, e.target.closest('#form-asset'));
    },

    handleFocusOut(e) {
        if (e.target && e.target.id === 'asset-ticker') this.onTickerFocusOut(e.target);
    },

    // ==========================================
    // 4. LÓGICA DE NEGÓCIO (AÇÕES)
    // ==========================================
    
    async onRetryPriceForm(e) {
        const tickerInput = document.querySelector('#asset-ticker');
        const priceInput = document.querySelector('#averagePrice');
        const ticker = tickerInput ? tickerInput.value.toUpperCase().trim() : '';
        
        if (ticker && ticker.length >= 4) {
            const originalPlaceholder = priceInput.placeholder;
            priceInput.value = ''; 
            priceInput.placeholder = "Buscando Valor Atual...";
            priceInput.disabled = true; 
            
            try {
                const data = await AssetService.getPrice(ticker);
                if (data && data.price > 0) {
                    priceInput.value = data.price.toFixed(2);
                    
                    // FAST-PATH: Memoriza que o ativo é válido na API!
                    this.state.validatedTickers.add(ticker);

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
                    Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Preço não encontrado. Digite manualmente.', showConfirmButton: false, timer: 3000 });
                }
            } catch (err) {
                AddAssetView.clearSnowballInfo();
            } finally {
                priceInput.placeholder = originalPlaceholder;
                priceInput.disabled = false;
                priceInput.focus(); 
            }
        } else {
            AddAssetView.clearSnowballInfo();
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Digite um Ticker primeiro.', showConfirmButton: false, timer: 2000 });
        }
    },

    onQuickQty(e) {
        const delta = Number(e.target.closest('.btn-quick-qty').dataset.val) || 0;
        const qtyInput = document.querySelector('#update-quantity');
        if (!qtyInput) return;
        let current = Number(qtyInput.value) || 0;
        current = Math.max(0, current + delta);
        qtyInput.value = current;
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
    },

    onQuickPrice(e) {
        const deltaRaw = e.target.closest('.btn-quick-price').dataset.val;
        if (typeof deltaRaw === 'undefined') return;
        const delta = parseFloat(String(deltaRaw).replace(',', '.')) || 0;
        const priceInput = document.querySelector('#update-averagePrice');
        if (!priceInput) return;
        let current = parseFloat(priceInput.value) || 0;
        current = Math.max(0, current + delta);
        priceInput.value = current.toFixed(2);
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
    },

    onDeleteAsset(btnDelete) {
        const idDoAtivo = btnDelete.dataset.id;
        const asset = this.state.assets.find(a => a.id == idDoAtivo);
        if (!asset) return this.showError('Ativo não encontrado.');

        const getLastBusinessDay = () => {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            let dayOfWeek = nextMonth.getDay();
            if (dayOfWeek === 0) nextMonth.setDate(nextMonth.getDate() - 2);
            else if (dayOfWeek === 6) nextMonth.setDate(nextMonth.getDate() - 1);
            return `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
        };

        const isFII = asset.ticker.endsWith('11');
        const lucro = (asset.currentPrice - asset.averagePrice) * asset.quantity;
        const temLucro = lucro > 0;
        const temPrejuizo = lucro < 0;

        let alertConfig;

        if (isFII && temLucro) {
            const imposto = lucro * 0.20;
            alertConfig = {
                title: 'Atenção: Imposto Devido',
                icon: 'warning',
                html: `
                    <div class="mb-3">
                        Lucro apurado: <b>R$ ${lucro.toFixed(2).replace('.', ',')}</b><br>
                        Imposto a pagar (20%): <b><span class="text-danger">R$ ${imposto.toFixed(2).replace('.', ',')}</span></b>
                    </div>
                    <div class="text-start">
                        <p class="small text-secondary mb-2"><b>1.</b> Efetue a venda na sua corretora.</p>
                        <p class="small text-secondary mb-1"><b>2.</b> Acesse o <a href="https://sicalc.receita.economia.gov.br/sicalc/principal" target="_blank" class="fw-bold text-primary text-decoration-underline">SicalcWeb <i class="bi bi-box-arrow-up-right"></i></a> e siga o caminho:</p>
                        <div class="p-2 rounded mb-2" style="background-color: rgba(255,255,255,0.05); border: 1px dashed #6c757d; font-size: 0.75rem;">
                            <i class="bi bi-arrow-return-right text-success"></i> Preenchimento rápido<br>
                            <i class="bi bi-arrow-return-right text-success"></i> Pessoa Física (CPF)<br>
                            <i class="bi bi-arrow-return-right text-success"></i> Código da Receita: <b>6015</b><br>
                            <i class="bi bi-arrow-return-right text-success"></i> Vencimento: <b>${getLastBusinessDay()}</b>
                        </div>
                    </div>
                `,
                showCloseButton: true, allowOutsideClick: false, allowEscapeKey: false, showCancelButton: true,
                confirmButtonColor: '#dc3545', confirmButtonText: 'Sim, remover da carteira', cancelButtonText: 'Cancelar',
                preConfirm: async () => this.executeDelete(idDoAtivo)
            };
        } else if (isFII && temPrejuizo) {
            alertConfig = {
                title: 'Venda com Prejuízo (Sem Imposto)',
                icon: 'info',
                html: `
                    <div class="mb-3">Prejuízo apurado: <b class="text-danger">R$ ${Math.abs(lucro).toFixed(2).replace('.', ',')}</b></div>
                    <div class="text-start">
                        <p class="small text-secondary mb-2">Como a operação gerou prejuízo, não há DARF a pagar sobre essa venda.</p>
                        <p class="small text-secondary mb-1">Recomendamos anotar este prejuízo para abater de futuros lucros com FIIs na sua declaração anual.</p>
                    </div>
                `,
                showCloseButton: true, allowOutsideClick: false, showCancelButton: true,
                confirmButtonColor: '#dc3545', confirmButtonText: 'Entendi, remover ativo', cancelButtonText: 'Cancelar',
                preConfirm: async () => this.executeDelete(idDoAtivo)
            };
        } else {
            alertConfig = {
                title: 'Excluir Ativo?', text: "Você não poderá reverter isso!", icon: 'warning',
                showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sim, excluir!', cancelButtonText: 'Cancelar'
            };
        }

        Swal.fire(alertConfig).then(async (result) => {
            if ((isFII && temLucro) || (isFII && temPrejuizo)) return; 
            if (result.isConfirmed) {
                this.showLoading('Excluindo ativo...');
                await this.executeDelete(idDoAtivo);
                this.showSuccess('Ativo removido da carteira.');
            }
        });
    },

    async executeDelete(idDoAtivo) {
        try {
            await AssetService.deleteAsset(idDoAtivo);
            this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
            this.renderLocalState();
            Swal.hideLoading();
            Swal.update({ title: 'Ativo Removido!', icon: 'success', showConfirmButton: false, showCancelButton: false });
            const confirmBtn = Swal.getConfirmButton();
            const cancelBtn = Swal.getCancelButton();
            if (confirmBtn) confirmBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
        } catch (error) {
            Swal.showValidationMessage('Erro ao deletar: ' + error.message);
        }
    },

    async onRetrySingleAsset(btn) {
        const ticker = btn.dataset.ticker;
        if (!ticker) return;
        const assetIndex = this.state.assets.findIndex(asset => asset.ticker.toUpperCase() === ticker.toUpperCase());
        if (assetIndex === -1) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Carregando...';

        try {
            const data = await AssetService.getMarketPrices([ticker]);
            const apiResults = data.results || [];
            let marketData = {};
            if (Array.isArray(apiResults)) {
                marketData = apiResults.find(item => item.symbol.toUpperCase() === ticker.toUpperCase() || item.symbol.toUpperCase() === `${ticker.toUpperCase()}.SA`) || {};
            } else {
                marketData = apiResults[ticker.toUpperCase()] || apiResults[`${ticker.toUpperCase()}.SA`] || {};
            }
            this.state.assets[assetIndex].enrich(marketData);
        } catch (error) {
            this.state.assets[assetIndex].dataError = true;
        } finally {
            this.renderLocalState();
        }
    },

    onEditModalOpen(btn) {
        document.querySelector('#update-id').value = btn.dataset.id;
        document.querySelector('#modal-ticker-title').innerText = btn.dataset.ticker;
        document.querySelector('#update-quantity').value = btn.dataset.qty;
        document.querySelector('#update-averagePrice').value = btn.dataset.price;
        document.querySelector('#update-modal-overlay')?.classList.add('active');
    },

    onEditModalClose() {
        document.querySelector('#update-modal-overlay')?.classList.remove('active');
    },

    async onToggleNotif(btn) {
        const icon = btn.querySelector('i');
        try {
            icon.classList.add('bell-animating');
            const novoEstado = !this.state.user.notifications_enabled;
            await supabase.from('profiles').upsert({ id: this.state.user.id, email: this.state.user.email, notifications_enabled: novoEstado, updated_at: new Date() });
            this.state.user.notifications_enabled = novoEstado;
            this.renderLocalState();
            Swal.fire({ toast: true, position: 'top-end', icon: novoEstado ? 'success' : 'info', title: novoEstado ? 'Notificações Ativadas' : 'Notificações Desativadas', showConfirmButton: false, timer: 2000 });
        } catch (error) {
            icon.classList.remove('bell-animating');
            this.showError("Erro ao atualizar notificações.");
        }
    },

    async onLogout() {
        await AuthService.signOut();
        window.location.reload();
    },

    async onChangeSort(select) {
        const newSort = select.value;
        select.disabled = true;
        try {
            await supabase.from('profiles').update({ sort_by: newSort }).eq('id', this.state.user.id);
            this.state.user.sort_by = newSort;
            this.renderLocalState();
        } catch (err) { console.error(err); }
    },

    async onChangeBroker(select) {
        const newBroker = select.value;
        select.disabled = true;
        try {
            await supabase.from('profiles').update({ preferred_broker: newBroker }).eq('id', this.state.user.id);
            this.state.user.preferred_broker = newBroker;
            this.renderLocalState();
        } catch (err) { console.error(err); }
    },

    async onUpdateSubmit(e, form) {
        e.preventDefault();
        const id = document.querySelector('#update-id').value;
        const qtyInput = document.querySelector('#update-quantity');
        const priceInput = document.querySelector('#update-averagePrice');

        if (!qtyInput.value || !priceInput.value) return this.showError('Preencha a quantidade e o preço médio.');

        const data = { quantity: Number(qtyInput.value), averagePrice: parseFloat(priceInput.value) };
        const editButton = document.querySelector(`.btn-edit[data-id="${id}"]`);
        const deleteButton = document.querySelector(`.btn-delete[data-id="${id}"]`);
        const ticker = editButton?.dataset.ticker || '';
        const loadingIcon = ticker ? document.getElementById(`loading-${ticker}`) : null;

        if (loadingIcon) { loadingIcon.classList.remove('d-none'); loadingIcon.classList.add('d-inline-block'); }
        if (editButton) editButton.style.display = 'none';
        if (deleteButton) deleteButton.style.display = 'none';
        this.onEditModalClose();

        try {
            await AssetService.updateAsset(id, data);
            const asset = this.state.assets.find(a => Number(a.id) === Number(id));
            if (asset) {
                asset.quantity = data.quantity;
                asset.averagePrice = data.averagePrice;
                asset.enrich({ price: asset.currentPrice, changePercent: asset.dailyChange, yieldPct: asset.yieldPct });
            }
            this.renderLocalState();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ativo atualizado!', showConfirmButton: false, timer: 2000 });
        } catch (error) {
            if (loadingIcon) { loadingIcon.classList.add('d-none'); loadingIcon.classList.remove('d-inline-block'); }
            if (editButton) editButton.style.display = 'inline-block';
            if (deleteButton) deleteButton.style.display = 'inline-block';
            this.showError("Erro: " + error.message);
        }
    },

    async onCreateSubmit(e, form) {
        e.preventDefault();
        const tickerInput = document.querySelector('#asset-ticker');
        const qtyInput = document.querySelector('#quantity');
        const priceInput = document.querySelector('#averagePrice');
        
        const tickerValue = tickerInput ? tickerInput.value.toUpperCase().trim() : '';
        const qtyValue = qtyInput ? qtyInput.value : '';
        const priceValue = priceInput ? priceInput.value : '';

        // Validações RÁPIDAS (Antes de travar a tela com Spinner)
        if (!tickerValue || !qtyValue || !priceValue) return this.showError('Preencha o Ticker, a Quantidade e o Preço Médio.');
        if (this.state.assets.some(asset => asset.ticker === tickerValue)) return this.showError(`O ativo ${tickerValue} já está cadastrado.`);

        this.showLoading('Buscando e validando ativo...');

        try {
            // FAST-PATH: Se já validamos o ticker no focusOut, pula a requisição dupla na B3!
            let isValid = this.state.validatedTickers.has(tickerValue);
            
            if (!isValid) {
                isValid = await AssetService.validateTicker(tickerValue);
                if (isValid) this.state.validatedTickers.add(tickerValue);
            }

            if (!isValid) return this.showError(`O ticker "${tickerValue}" não foi encontrado na B3.`);

            // Muda apenas o texto, não refaz o spinner do zero para evitar bugs visuais
            Swal.update({ title: 'Salvando na carteira...' });

            await AssetService.addAsset({ ticker: tickerValue, quantity: Number(qtyValue), averagePrice: parseFloat(priceValue) });

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
    },

    // --- LÓGICA DE FOCUS OUT ---
    async onTickerFocusOut(input) {
        const ticker = input.value.toUpperCase().trim();
        const priceInput = document.querySelector('#averagePrice');

        if (!ticker || ticker.length < 4) return AddAssetView.clearSnowballInfo();
        
        if (priceInput && !priceInput.value) {
            const originalPlaceholder = priceInput.placeholder;
            priceInput.placeholder = "Buscando Valor Atual...";
            priceInput.disabled = true; 
            
            try {
                const data = await AssetService.getPrice(ticker);
                if (data && data.price > 0 && !priceInput.value) {
                    priceInput.value = data.price.toFixed(2);
                    
                    // FAST-PATH: Memoriza o ativo validado para acelerar o salvamento depois
                    this.state.validatedTickers.add(ticker);
                }
                
                if (data && data.price > 0) {
                    const yieldAnual = Number(data.yieldPct || 0);
                    if (yieldAnual > 0) {
                        const rendaMensal = (data.price * (yieldAnual / 100)) / 12;
                        AddAssetView.injectSnowballInfo(rendaMensal > 0 ? Math.ceil(data.price / rendaMensal) : 0);
                    } else {
                        AddAssetView.clearSnowballInfo();
                    }
                } else {
                    AddAssetView.clearSnowballInfo();
                }
            } catch (err) {
                AddAssetView.clearSnowballInfo();
            } finally {
                priceInput.placeholder = originalPlaceholder;
                priceInput.disabled = false;
            }
        }
    },

    // ==========================================
    // 5. HELPERS DE INTERFACE
    // ==========================================
    showLoading(message) { 
        Swal.fire({ title: message, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); 
    },
    showSuccess(message) { 
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: message, timer: 2000, showConfirmButton: false }); 
    },
    showError(message) { 
        Swal.hideLoading(); // Desliga o spinner fantasma
        Swal.fire({ icon: 'error', title: 'Oops...', text: message }); 
    }
};