import './styles/style.css';
import { authRepository } from './infrastructure/authRepository.js';
import { AssetController } from './controllers/assetController.js';
import { AssetView } from './views/assetView.js';
import { supabase } from './infrastructure/supabaseClient.js';

// O "Vigia": Escuta as mudanças de estado de autenticação em tempo real
supabase.auth.onAuthStateChange((event, session) => {
    // Esse evento dispara sozinho assim que a página carrega e o Supabase valida o token
    const user = session?.user;

    if (user) {
        // --- USUÁRIO LOGADO E CONFIRMADO ---
        
        // 1. Fecha o modal de login se ele tiver piscado na tela
        const modalElement = document.getElementById('loginModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();
        }

        // 2. Esconde o rodapé de SEO (que fizemos antes)
        const seoFooter = document.getElementById('seo-footer');
        if (seoFooter) seoFooter.style.display = 'none';
        
        // 3. Garante que a gaveta de "Novo Ativo" volte a aparecer
        const drawer = document.getElementById('add-asset-drawer');
        if (drawer) drawer.style.display = 'block';

        // 4. Inicia a busca dos dados reais do usuário
        AssetController.init();
        
    } else {
        // --- VISITANTE / DESLOGADO ---
        renderGuestMode();
    }
});

// Separamos a lógica do visitante para manter o código limpo
function renderGuestMode() {
    const demoUser = {
        email: 'visitante@notifinancia',
        isGuest: true, // Tag essencial para a View saber que é fake
        preferred_broker: 'Nubank',
        notifications_enabled: true
    };

    // Carteira de demonstração
    const demoAssets = [
        { id: 1, ticker: 'MXRF11', quantity: 150, averagePrice: 10.20, currentPrice: 10.55, variacaoPM: 3.43, dailyChange: 0.5 },
        { id: 2, ticker: 'PETR4', quantity: 100, averagePrice: 38.50, currentPrice: 36.20, variacaoPM: -5.97, dailyChange: -1.2 },
        { id: 3, ticker: 'KLBN4', quantity: 500, averagePrice: 4.10, currentPrice: 4.35, variacaoPM: 6.09, dailyChange: 1.1 }
    ];

    AssetView.render(demoAssets, demoUser);

    const drawer = document.getElementById('add-asset-drawer');
    if (drawer) drawer.style.display = 'none';

    // Garante que o rodapé de SEO apareça para os bots da Google
    const seoFooter = document.getElementById('seo-footer');
    if (seoFooter) seoFooter.style.display = 'block';

    const modalElement = document.getElementById('loginModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }

    // Adiciona o evento de login apenas uma vez (evita duplicação de cliques)
    const btnLogin = document.querySelector('#btn-login-google');
    if (btnLogin && !btnLogin.hasAttribute('data-listener')) {
        btnLogin.addEventListener('click', () => {
            authRepository.signInWithGoogle();
        });
        btnLogin.setAttribute('data-listener', 'true');
    }
}