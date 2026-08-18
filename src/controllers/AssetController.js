import { assetRepository } from '../infrastructure/assetRepository.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { authRepository } from '../infrastructure/authRepository.js';
import { supabase } from '../infrastructure/supabaseClient.js';
import { TickerDictionary } from '../logic/tickerDictionary.js';
import { TaxCalculator } from '../domain/taxCalculator.js';

export const AssetController = {
    state: {
        assets: [],
        user: null,
        isEventsDelegated: false
    },

    async init() {
        const user = await authRepository.getUser();

        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_enabled, sort_by, preferred_broker')
            .eq('id', user.id)
            .maybeSingle();

        user.notifications_enabled = profile?.notifications_enabled || false;
        user.sort_by = profile?.sort_by || 'pm_asc';
        user.preferred_broker = profile?.preferred_broker || 'Nubank';

        this.state.user = user;

        const userAssets = await assetRepository.getAssets();
        this.state.assets = userAssets;
        this.renderLocalState();

        if (!this.state.isEventsDelegated) {
            this.setupDelegatedEvents();
            this.state.isEventsDelegated = true;
        }

        if (userAssets.length === 0) {
            return;
        }

        const allTickers = userAssets.map(asset => asset.ticker);
        const marketData = await assetRepository.getMarketPrices(allTickers);
        const results = Array.isArray(marketData?.results)
            ? marketData.results
            : Object.values(marketData?.results ?? {});

        const livePrices = {};
        results.forEach(result => {
            const symbol = result.symbol || result.ticker;
            if (symbol) {
                livePrices[symbol] = result;
            }
        });

        userAssets.forEach(asset => {
            const live = livePrices[asset.ticker] || {
                price: 0,
                changePercent: 0,
                yieldpct: 0
            };

            const currentPrice = Number(live.price ?? live.regularMarketPrice ?? 0) || 0;
            const dailyChange = Number(live.changePercent ?? live.regularMarketChangePercent ?? 0) || 0;
            const yieldPct = Number(live.yieldpct ?? 0) || 0;

            asset.setMarketData(currentPrice, dailyChange, yieldPct);
        });

        this.renderLocalState();
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
            didOpen: () => { Swal.showLoading(); }
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
        const handlers = {
            onRetryPrice: async (ticker) => {
                if (!ticker || ticker.length < 4) {
                    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Digite um Ticker primeiro.', showConfirmButton: false, timer: 2000 });
                    return;
                }
                
                AssetView.setPriceLoading(true);
                try {
                    const data = await assetRepository.getPrice(ticker);
                    if (data && data.price > 0) {
                        AssetView.setPriceValue(data.price.toFixed(2));
                    } else {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Preço não encontrado. Digite manualmente.', showConfirmButton: false, timer: 3000 });
                    }
                } catch (err) {
                    console.error("Erro ao forçar busca de preço:", err);
                } finally {
                    AssetView.setPriceLoading(false);
                    AssetView.focusPriceInput();
                }
            },

            onDeleteAsset: (idDoAtivo) => {
                const asset = this.state.assets.find(a => a.id == idDoAtivo);
                if (!asset) {
                    this.showError('Ativo não encontrado.');
                    return;
                }

                const taxInfo = TaxCalculator.calculateFIITax(asset, asset.currentPrice);
                let alertConfig;

                if (taxInfo.isTaxable) {
                    const lucroFormatado = taxInfo.lucro.toFixed(2).replace('.', ',');
                    const impostoFormatado = taxInfo.imposto.toFixed(2).replace('.', ',');
                    
                    alertConfig = {
                        title: 'Atenção: Imposto Devido',
                        icon: 'info',
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
                                    <i class="bi bi-arrow-return-right text-success"></i> Vencimento: <b>${taxInfo.dataVencimento}</b>
                                </div>
                            </div>`,
                        showCloseButton: true,
                        allowOutsideClick: false,
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Sim, remover',
                        cancelButtonText: 'Cancelar',
                        preConfirm: async () => {
                            Swal.showLoading();
                            try {
                                await assetRepository.deleteAsset(idDoAtivo);
                                this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                                this.renderLocalState();
                                Swal.update({ title: 'Removido!', icon: 'success', showConfirmButton: false });
                                return false;
                            } catch (error) {
                                Swal.showValidationMessage('Erro: ' + error.message);
                                return false;
                            }
                        }
                    };
                } else {
                    alertConfig = {
                        title: 'Excluir Ativo?',
                        text: "Você não poderá reverter isso!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: 'Sim, excluir!'
                    };
                }

                Swal.fire(alertConfig).then(async (result) => {
                    if (taxInfo.isTaxable) return;
                    if (result.isConfirmed) {
                        this.showLoading('Excluindo ativo...');
                        try {
                            await assetRepository.deleteAsset(idDoAtivo);
                            this.state.assets = this.state.assets.filter(a => a.id != idDoAtivo);
                            this.renderLocalState();
                            this.showSuccess('Ativo removido.');
                        } catch (error) {
                            this.showError('Erro: ' + error.message);
                        }
                    }
                });
            },

            onUpdateAsset: async (id, qty, price) => {
                if (!qty || !price) {
                    this.showError('Preencha a quantidade e o preço médio.');
                    return;
                }
                
                const data = { quantity: Number(qty), averagePrice: parseFloat(price) };
                this.showLoading('Atualizando...');

                try {
                    await assetRepository.updateAsset(id, data);
                    AssetView.closeUpdateModal();
                    
                    const asset = this.state.assets.find(a => a.id == id);
                    if (asset) {
                        asset.quantity = data.quantity;
                        asset.averagePrice = data.averagePrice;
                    }
                    this.renderLocalState();
                    this.showSuccess('Ativo atualizado!');
                } catch (error) {
                    this.showError("Erro: " + error.message);
                }
            },

            onCreateAsset: async (ticker, qty, price) => {
                if (!ticker || !qty || !price) {
                    this.showError('Preencha Ticker, Quantidade e Preço Médio.');
                    return;
                }

                this.showLoading('Buscando e validando...');

                try {
                    const alreadyExists = this.state.assets.some(asset => asset.ticker === ticker);
                    if (alreadyExists) {
                        this.showError(`O ativo ${ticker} já está cadastrado.`);
                        return;
                    }

                    const isValid = await assetRepository.validateTicker(ticker);
                    if (!isValid) {
                        this.showError(`O ticker "${ticker}" não foi encontrado na B3.`);
                        return;
                    }

                    this.showLoading('Salvando na carteira...');
                    
                    const newAsset = { ticker, quantity: Number(qty), averagePrice: parseFloat(price) };
                    await assetRepository.addAsset(newAsset);

                    if (!TickerDictionary.list.includes(ticker)) {
                        supabase.from('tickers_descobertos').insert([{ ticker }]).then();
                    }

                    AssetView.closeAddDrawer();
                    AssetView.clearAddForm();
                    await this.init();
                    this.showSuccess(`${ticker} adicionado!`);
                } catch (error) {
                    this.showError('Erro ao processar sua solicitação.');
                }
            },

            onToggleNotif: async (icon) => {
                if (icon) icon.classList.add('bell-animating');
                try {
                    const novoEstado = !this.state.user.notifications_enabled;
                    await supabase.from('profiles').upsert({ id: this.state.user.id, email: this.state.user.email, notifications_enabled: novoEstado, updated_at: new Date() });
                    
                    this.state.user.notifications_enabled = novoEstado;
                    this.renderLocalState();

                    Swal.fire({ toast: true, position: 'top-end', icon: novoEstado ? 'success' : 'info', title: novoEstado ? 'Notificações Ativadas' : 'Desativadas', showConfirmButton: false, timer: 2000 });
                } catch (error) {
                    if (icon) icon.classList.remove('bell-animating');
                    this.showError("Erro ao atualizar notificações.");
                }
            },

            onLogout: async () => {
                await authRepository.signOut();
                window.location.reload();
            },

            onSortChange: async (newSort) => {
                try {
                    await supabase.from('profiles').update({ sort_by: newSort }).eq('id', this.state.user.id);
                    this.state.user.sort_by = newSort;
                    this.renderLocalState();
                } catch (err) { console.error(err); }
            },

            onBrokerChange: async (newBroker) => {
                try {
                    await supabase.from('profiles').update({ preferred_broker: newBroker }).eq('id', this.state.user.id);
                    this.state.user.preferred_broker = newBroker;
                    this.renderLocalState();
                } catch (err) { console.error(err); }
            },

            onTickerFocusOut: async (ticker) => {
                if (ticker && ticker.length >= 4) {
                    AssetView.setPriceLoading(true);
                    try {
                        const data = await assetRepository.getPrice(ticker);
                        if (data && data.price > 0) {
                            AssetView.setPriceValue(data.price.toFixed(2));
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        AssetView.setPriceLoading(false);
                    }
                }
            }
        };

        AssetView.bindEvents(handlers);
    }
};