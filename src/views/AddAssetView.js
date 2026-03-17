export const AddAssetView = {
    render() {
        const container = document.querySelector('#form-container');
        
        // Removemos as divs duplicadas de fundo, a barrinha e o espaçador de 180px.
        // Injetamos apenas o formulário diretamente.
        container.innerHTML = `
            <form id="form-asset" class="row g-2 align-items-end mt-2">
                
                <div class="col-12 col-md-3">
                    <label for="ticker" class="small text-secondary fw-bold mb-1">Ticker do Ativo</label>
                    <input type="text" id="ticker" list="ticker-suggestions" 
                           class="form-control bg-black text-white border-secondary text-uppercase" 
                           placeholder="Ex: PETR4" required>
                    <datalist id="ticker-suggestions">
                    </datalist>
                </div>

                <div class="col-12 col-md-4">
                    <label for="quantity" class="small text-secondary fw-bold mb-1">Quantidade</label>
                    <div class="input-group">
                        <input type="number" id="quantity" class="form-control bg-black text-white border-secondary" 
                               placeholder="0" required>
                        <button type="button" class="btn btn-outline-secondary btn-sm qty-btn" data-add="1">+1</button>
                        <button type="button" class="btn btn-outline-secondary btn-sm qty-btn" data-add="10">+10</button>
                        <button type="button" class="btn btn-outline-secondary btn-sm qty-btn" data-add="100">+100</button>
                    </div>
                </div>

                <div class="col-12 col-md-3">
                    <label for="averagePrice" class="small text-secondary fw-bold mb-1 d-flex justify-content-between">
                        Preço Médio (R$)
                        <span id="current-price-info" class="text-info small" style="display: none;">
                            Atual: <span id="live-price">0.00</span>
                        </span>
                    </label>
                    <input type="number" step="0.01" id="averagePrice" 
                           class="form-control bg-black text-white border-secondary" 
                           placeholder="0.00" required>
                </div>

                <div class="col-12 col-md-2 mt-3">
                    <button type="submit" class="btn btn-success w-100 fw-bold py-2">
                        ADICIONAR ATIVO
                    </button>
                </div>
            </form>
        `;
    }
};