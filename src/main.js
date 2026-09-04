import { AssetController } from './controllers/asset-controller.js';
import { supabase } from './infrastructure/supabase-client.js';
import { AuthService } from './services/auth-service.js';
import { AssetView } from './views/asset-view.js';
import { ContactView } from './views/contact-view.js';
import { PrivacyView } from './views/privacy-view.js';
import { TermsView } from './views/terms-view.js';
import './styles/style.css';
import { AuthService } from './services/auth-service.js';
import { AssetController } from './controllers/asset-controller.js';
import { PortfolioView } from './views/portfolio-view.js';
import { TermosView } from './views/termos-view.js';
import { PrivacidadeView } from './views/privacidade-view.js';
import { ContatoView } from './views/contato-view.js';
import { supabase } from './infrastructure/supabase-client.js';
import './styles/style.css';
import './styles/bottom.css';
import './styles/cards.css';
import './styles/login.css';
import './styles/modal.css';

async function handleRouting() {
    const hash = window.location.hash;
    const app = document.getElementById('app');
    const seoFooter = document.getElementById('seo-footer');
    const drawer = document.getElementById('add-asset-drawer');
    const modalElement = document.getElementById('loginModal');

    if (modalElement) bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    if (drawer) drawer.style.display = 'none';
    if (seoFooter) seoFooter.style.display = 'none';

    // Captura a sessão atual antes de desenhar a tela
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (hash === '#/termos') {
        app.innerHTML = TermsView.render();
    } else if (hash === '#/privacidade') {
        app.innerHTML = PrivacyView.render();
    } else if (hash === '#/contato') {
        app.innerHTML = ContactView.render(user); // Passamos o usuário como parâmetro
    } else {
        renderBasedOnSession(session);
    }
}

function checkAuthAndRenderDashboard() {
    supabase.auth.getSession().then(({ data: { session } }) => {
        renderBasedOnSession(session);
    });
}

function renderBasedOnSession(session) {
    const user = session?.user;
    const seoFooter = document.getElementById('seo-footer');
    const drawer = document.getElementById('add-asset-drawer');

    if (user) {
        if (seoFooter) seoFooter.style.display = 'none';
        if (drawer) drawer.style.display = 'block';
        AssetController.init();
    } else {
        renderGuestMode();
    }
}

// Escuta mudanças de login/logout em tempo real na rota principal
supabase.auth.onAuthStateChange((event, session) => {
    if (window.location.hash === '' || window.location.hash === '#/') {
        renderBasedOnSession(session);
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

    PortfolioView.render(demoAssets, demoUser);

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

// Inicializa o roteador ao carregar a página e ao mudar a URL
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);