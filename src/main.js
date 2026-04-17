import './assets/style.css';
import { AuthService } from './services/authService.js';
import { AssetController } from './controllers/AssetController.js';
import { AssetView } from './views/AssetView.js';
import { supabase } from './services/supabaseClient.js'; // Necessário para escutar o estado

// Escuta as mudanças de estado de autenticação em tempo real
supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user;

    if (user) {
        // --- USUÁRIO LOGADO: Inicia o sistema real ---
        const modalElement = document.getElementById('loginModal');
        if (modalElement) {
            // Usa getOrCreateInstance para garantir que o modal feche sem erros
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();
        }
        
        // Garante que a gaveta de "Novo Ativo" volte a aparecer para o usuário logado
        const drawer = document.getElementById('add-asset-drawer');
        if (drawer) drawer.style.display = 'block';

        AssetController.init();
    } else {
        // --- VISITANTE: Mostra a vitrine de demonstração e o modal ---
        renderGuestMode();
    }
});

// Função separada para manter a organização
function renderGuestMode() {
    // 1. Cria um usuário fictício
    const demoUser = {
        email: 'visitante@notifinancia',
        isGuest: true, // Tag essencial para a View saber que é fake
        preferred_broker: 'Nubank',
        notifications_enabled: true
    };

    // 2. Cria ativos fictícios rentáveis e no prejuízo para mostrar as cores
    const demoAssets = [
        { id: 1, ticker: 'MXRF11', quantity: 150, averagePrice: 10.20, currentPrice: 10.55, variacaoPM: 3.43, dailyChange: 0.5 },
        { id: 2, ticker: 'PETR4', quantity: 100, averagePrice: 38.50, currentPrice: 36.20, variacaoPM: -5.97, dailyChange: -1.2 },
        { id: 3, ticker: 'KLBN4', quantity: 500, averagePrice: 4.10, currentPrice: 4.35, variacaoPM: 6.09, dailyChange: 1.1 }
    ];

    // 3. Renderiza a tela principal com os dados falsos
    AssetView.render(demoAssets, demoUser);

    // 4. Esconde a gaveta de "Novo Ativo" para não confundir o visitante
    const drawer = document.getElementById('add-asset-drawer');
    if (drawer) drawer.style.display = 'none';

    // 5. Exibe o Modal de Login por cima do dashboard
    const modalElement = document.getElementById('loginModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }

    // 6. Ativa o botão do Google (verificando se o listener já não foi adicionado)
    const btnLogin = document.querySelector('#btn-login-google');
    if (btnLogin && !btnLogin.hasAttribute('data-listener')) {
        btnLogin.addEventListener('click', () => {
            AuthService.signInWithGoogle();
        });
        btnLogin.setAttribute('data-listener', 'true');
    }
}