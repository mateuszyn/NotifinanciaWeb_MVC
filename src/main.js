import './styles/style.css';
import { AuthService } from './services/authService.js';
import { AssetController } from './controllers/assetController.js';
import { AssetView } from './views/assetView.js';
import { supabase } from './services/supabaseClient.js';

supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user;

    if (user) {
        const modalElement = document.getElementById('loginModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();
        }

        const seoFooter = document.getElementById('seo-footer');
        if (seoFooter) seoFooter.style.display = 'none';
        
        const drawer = document.getElementById('add-asset-drawer');
        if (drawer) drawer.style.display = 'block';

        AssetController.init();
    } else {
        renderGuestMode();
    }
});

function renderGuestMode() {
    const demoUser = {
        email: 'visitante@notifinancia',
        isGuest: true,
        preferred_broker: 'Nubank',
        notifications_enabled: true
    };

    const demoAssets = [
        { id: 1, ticker: 'MXRF11', quantity: 150, averagePrice: 10.20, currentPrice: 10.55, variacaoPM: 3.43, dailyChange: 0.5 },
        { id: 2, ticker: 'PETR4', quantity: 100, averagePrice: 38.50, currentPrice: 36.20, variacaoPM: -5.97, dailyChange: -1.2 },
        { id: 3, ticker: 'KLBN4', quantity: 500, averagePrice: 4.10, currentPrice: 4.35, variacaoPM: 6.09, dailyChange: 1.1 }
    ];

    AssetView.render(demoAssets, demoUser);

    const drawer = document.getElementById('add-asset-drawer');
    if (drawer) drawer.style.display = 'none';

    const seoFooter = document.getElementById('seo-footer');
    if (seoFooter) seoFooter.style.display = 'block';

    const modalElement = document.getElementById('loginModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }

    const btnLogin = document.querySelector('#btn-login-google');
    if (btnLogin && !btnLogin.hasAttribute('data-listener')) {
        btnLogin.addEventListener('click', () => {
            AuthService.signInWithGoogle();
        });
        btnLogin.setAttribute('data-listener', 'true');
    }
}