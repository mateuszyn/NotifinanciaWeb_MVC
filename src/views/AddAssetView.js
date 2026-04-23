export const AddAssetView = {
    render() {
        const container = document.querySelector('#form-container');
        
        container.innerHTML = `
            <form id="form-asset" class="mt-2">
                <div class="row g-2 align-items-end">
                    <div class="form-group mb-3 position-relative">
                        <label class="small text-secondary fw-bold mb-1">Ticker</label>
                        
                        <input type="text" id="asset-ticker" class="form-control bg-black text-white border-secondary text-uppercase" autocomplete="off" placeholder="Ex: PETR4" required>

                        <ul id="ticker-suggestions" class="dropdown-menu w-100 shadow-lg bg-dark border-secondary" style="display: none; position: absolute; top: 100%; z-index: 1000;">
                        </ul>
                    </div>

                    <div class="col-8 col-md-4">
                        <label for="quantity" class="small text-secondary fw-bold mb-1">Quantidade</label>
                        <div class="input-group input-group-sm">
                            <input type="number" id="quantity" 
                                   class="form-control bg-black text-white border-secondary" 
                                   placeholder="0" required style="flex: 1.5;">
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="1">+1</button>
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="10">+10</button>
                            <button type="button" class="btn btn-dark border-secondary qty-btn px-2" data-add="100">+100</button>
                        </div>
                    </div>

                    <div class="col-8 col-md-3">
                        <label for="averagePrice" class="small text-secondary fw-bold mb-1">P. Médio (R$)</label>
                        <input type="number" step="0.01" id="averagePrice" 
                               class="form-control bg-black text-white border-secondary form-control-sm" 
                               placeholder="0.00" required>
                    </div>

                    <div class="col-4 col-md-2">
                        <label class="small d-block mb-1" style="visibility: hidden;">Confirmar</label>
                        <button type="submit" class="btn btn-success w-100 fw-bold btn-sm py-2" style="height: 40px;">
                            ADICIONAR
                        </button>
                    </div>
                </div>
            </form>
        `;
    }
};