export const AddAssetView = {
    render() {
        const container = document.querySelector('#form-container');
        
        container.innerHTML = `
            <section class="mt-5 pb-5">
                <div class="asset-card">
                    <h5 class="mb-4 text-primary">Adicionar Novo Ativo à Carteira</h5>
                    <form id="form-asset" class="row g-3">
                        <div class="col-md-4">
                            <label for="ticker" class="price-label">Ticker do Ativo</label>
                            <input type="text" id="ticker" class="form-control bg-dark text-white border-secondary" 
                                placeholder="Ex: PETR4" required>
                        </div>
                        
                        <div class="col-md-4">
                            <label for="quantity" class="price-label">Quantidade</label>
                            <input type="number" id="quantity" class="form-control bg-dark text-white border-secondary" 
                                placeholder="0" required>
                        </div>
                        
                        <div class="col-md-4">
                            <label for="averagePrice" class="price-label">Preço Médio (R$)</label>
                            <input type="number" step="0.01" id="averagePrice" class="form-control bg-dark text-white border-secondary" 
                                placeholder="0.00" required>
                        </div>
                        
                        <div class="col-12 mt-4">
                            <button type="submit" class="btn btn-primary w-100 fw-bold">
                                SALVAR NA CARTEIRA
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        `;
    }
};