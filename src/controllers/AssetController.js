import { AssetService } from '../services/assetService.js';
import { AssetView } from '../views/AssetView.js';
import { AddAssetView } from '../views/AddAssetView.js';
import { AuthService } from '../services/authService.js';

export const AssetController = {
    async init() {
        const user = await AuthService.getUser();

        // 1. Busca os ativos do usuário no Supabase
        const userAssets = await AssetService.getAssets();

        // 2. Extrai apenas os tickers para consultar a Brapi
        const tickers = userAssets.map(a => a.ticker);

        // 3. Busca os preços atuais de mercado
        const marketPrices = await AssetService.getMarketPrices(tickers);

        // 4. Une os dados: adiciona o preço atual a cada objeto de ativo
        const enrichedAssets = userAssets.map(asset => ({
            ...asset,
            currentPrice: marketPrices[asset.ticker] || 0
        }));

        // 5. Renderiza a View com os dados completos
        AssetView.render(enrichedAssets, user);
        AddAssetView.render();

        this.setupEventListeners();
    },

    setupEventListeners() {
        document.querySelector('#btn-logout')?.addEventListener('click', async () => {
            await AuthService.signOut();
            window.location.reload();
        });

        const form = document.querySelector('#form-asset');
        form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tickerInput = document.querySelector('#ticker');
    const tickerValue = tickerInput.value.toUpperCase().trim();
    
    // Mostra um feedback visual de "carregando" se quiser
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Validando...";
    submitBtn.disabled = true;

    try {
        // 1. Valida o Ticker na API antes de qualquer coisa
        const isValid = await AssetService.validateTicker(tickerValue);

        if (!isValid) {
            alert(`O ticker "${tickerValue}" não foi encontrado na Bolsa.`);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            return; // Interrompe a execução aqui
        }

        // 2. Se for válido, prepara o objeto
        const newAsset = {
            ticker: tickerValue,
            quantity: Number(document.querySelector('#quantity').value),
            averagePrice: parseFloat(document.querySelector('#averagePrice').value)
        };

        // 3. Salva no Supabase
        await AssetService.addAsset(newAsset);
        
        // 4. Limpa o formulário e recarrega a lista
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
        // Dentro de setupEventListeners
        const assetsDeleteButtons = document.querySelectorAll('.btn-delete');
        assetsDeleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                // e.currentTarget garante que pegamos o botão, não o ícone interno
                const idDoAtivo = e.currentTarget.dataset.id;

                if (confirm('Deseja realmente excluir este ativo?')) {
                    try {
                        await AssetService.deleteAsset(idDoAtivo);

                        // Feedback visual antes de recarregar (opcional mas bom)
                        console.log("Deletado com sucesso!");

                        await this.init(); // Recarrega a tela
                    } catch (error) {
                        alert('Erro ao deletar: ' + error.message);
                    }
                }
            });
        });
    }
};