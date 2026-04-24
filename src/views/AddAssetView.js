import { TickerDictionary } from '../models/TickerDictionary.js';
import { Security } from '../services/security.js'; // Importando o nosso escudo

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
                                   placeholder="0" required step="any" style="flex: 1.5;">
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

        // Ativa o Autocomplete e os botões de quantidade logo após renderizar o HTML
        this.setupEventListeners();
    },

    setupEventListeners() {
        const tickerInput = document.querySelector('#asset-ticker');
        const suggestionsBox = document.querySelector('#ticker-suggestions');

        // --- LÓGICA DO AUTOCOMPLETE BLINDADO ---
        if (tickerInput && suggestionsBox) {
            tickerInput.addEventListener('input', (e) => {
                const query = e.target.value;
                const results = TickerDictionary.search(query);

                if (results.length > 0 && query.length >= 2) {
                    // BLINDAGEM: Sanitizamos cada item sugerido antes de injetar no <li>
                    suggestionsBox.innerHTML = results.map(t => {
                        const safeSuggestedTicker = Security.escapeHTML(t);
                        return `<li><a class="dropdown-item text-white border-bottom border-secondary py-2 cursor-pointer hover-bg-light" href="#">${safeSuggestedTicker}</a></li>`;
                    }).join('');
                    
                    suggestionsBox.style.display = 'block';

                    // Seleciona as opções
                    suggestionsBox.querySelectorAll('.dropdown-item').forEach(item => {
                        item.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            tickerInput.value = ev.target.innerText;
                            suggestionsBox.style.display = 'none';
                            tickerInput.focus();
                        });
                    });
                } else {
                    suggestionsBox.style.display = 'none';
                }
            });

            // Esconde a lista se clicar fora
            document.addEventListener('click', (e) => {
                if (!tickerInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                    suggestionsBox.style.display = 'none';
                }
            });
        }

        // --- LÓGICA DOS BOTÕES RÁPIDOS DE QUANTIDADE (+1, +10, +100) ---
        const qtyInput = document.querySelector('#quantity');
        const qtyBtns = document.querySelectorAll('.qty-btn');

        qtyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const addValue = parseFloat(e.target.dataset.add);
                const currentValue = parseFloat(qtyInput.value) || 0;
                qtyInput.value = currentValue + addValue;
            });
        });
    }
};