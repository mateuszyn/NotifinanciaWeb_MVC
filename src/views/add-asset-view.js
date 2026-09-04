import { Security } from '../infrastructure/security.js';

export const AddAssetView = {
    render() {
        const container = document.querySelector('#form-container');
        const currentForm = container?.querySelector('#form-asset');
        const currentValues = currentForm ? {
            ticker: currentForm.querySelector('#asset-ticker')?.value || '',
            quantity: currentForm.querySelector('#quantity')?.value || '',
            averagePrice: currentForm.querySelector('#averagePrice')?.value || ''
        } : null;
        container.innerHTML = `
            <form id="form-asset" class="mt-2">
                <div class="row g-2 align-items-end">
                    <div class="form-group mb-3 position-relative">
                        <label class="small text-secondary fw-bold mb-1">Ticker</label>
                        <input type="text" id="asset-ticker" class="form-control bg-black text-white border-secondary text-uppercase" autocomplete="off" placeholder="Ex: PETR4" required>
                        <ul id="ticker-suggestions" class="dropdown-menu w-100 shadow-lg bg-dark border-secondary" style="display: none; position: absolute; top: 100%; z-index: 1000;"></ul>
                    </div>

                    <div class="col-8 col-md-4">
                        <label for="quantity" class="small text-secondary fw-bold mb-1 d-flex align-items-center gap-2">Quantidade</label>
                        <div class="input-group input-group-sm">
                            <input type="number" id="quantity" class="form-control bg-black text-white border-secondary" placeholder="0" step="any" style="flex: 1.5;">
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="1">+1</button>
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="10">+10</button>
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="100">+100</button>
                        </div>
                    </div>

                    <div class="col-8 col-md-3">
                        <label for="averagePrice" class="small text-secondary fw-bold mb-1">P. Médio (R$)</label>
                        <div class="input-group input-group-sm">
                            <input type="number" step="0.01" id="averagePrice"
                                   class="form-control bg-black text-white border-secondary"
                                   placeholder="0.00">
                            <button type="button" id="btn-retry-price" class="btn btn-outline-primary px-2" title="Preencher com o valor atual" aria-label="Preencher com o valor atual">
                                <i class="bi bi-arrow-clockwise"></i> $ Atual
                            </button>
                            </button>
                        </div>
                    </div>

                    <div class="col-4 col-md-2">
                        <label class="small d-block mb-1" style="visibility: hidden;">Confirmar</label>
                        <button type="submit" class="btn btn-success w-100 fw-bold btn-sm py-2" style="height: 40px;">ADICIONAR</button>
                    </div>
                </div>
            </form>
        `;
        if (currentValues) {
            container.querySelector('#asset-ticker').value = currentValues.ticker;
            container.querySelector('#quantity').value = currentValues.quantity;
            container.querySelector('#averagePrice').value = currentValues.averagePrice;
        }

        this.setupEventListeners();
    },

    injectSnowballInfo(cotasParaBolaDeNeve) {
        const quantityLabel = document.querySelector('label[for="quantity"]');
        if (!quantityLabel) return;
        this.clearSnowballInfo();

        if (!Number.isFinite(cotasParaBolaDeNeve) || cotasParaBolaDeNeve <= 0) return;

        const span = document.createElement('span');
        span.className = 'snowball-add-info';
        span.style.cssText = 'color: #8fe3a7; font-size: 0.85em; margin-left: 5px;';
        span.textContent = `(Compre ${cotasParaBolaDeNeve} para a bola de neve)`;
        quantityLabel.appendChild(span);
    },

    clearSnowballInfo() {
        document.querySelectorAll('.snowball-add-info').forEach((el) => el.remove());
    }
};