import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { AuthService } from '../services/authService.js';

export const AssetController = {
    async init() {
        const user = await AuthService.getUser();
        const userAssets = await AssetService.getAssets();
        const tickers = userAssets.map(a => a.ticker);
        const marketPrices = await AssetService.getMarketPrices(tickers);

        const enrichedAssets = userAssets.map(asset => ({
            ...asset,
            currentPrice: marketPrices[asset.ticker] || 0
        }));

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

        // --- NOVO: BOTÕES DE ATALHO DE QUANTIDADE (+1, +10...) ---
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const inputQty = document.querySelector('#quantity');
                const addValue = parseInt(e.currentTarget.dataset.add);
                const currentValue = parseInt(inputQty.value) || 0;
                inputQty.value = currentValue + addValue;
            });
        });

        // --- NOVO: RECOMENDAÇÃO DE TICKERS (AUTOCOMPLETE) ---
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

        // --- NOVO: BUSCA DE PREÇO ATUAL AO DIGITAR TICKER ---
        tickerInput?.addEventListener('blur', async (e) => {
            const ticker = e.target.value.toUpperCase().trim();
            if (ticker) {
                const price = await AssetService.getPrice(ticker);
                if (price > 0) {
                    const priceInput = document.querySelector('#averagePrice');
                    const priceDisplay = document.querySelector('#live-price');
                    const infoSpan = document.querySelector('#current-price-info');

                    // Preenche o campo automaticamente se estiver vazio
                    if (!priceInput.value) priceInput.value = price.toFixed(2);
                    
                    // Atualiza o pequeno indicador de "Preço Atual" no label
                    if (priceDisplay) priceDisplay.innerText = price.toFixed(2);
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
                console.error('Erro ao salvar:', error.message);
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