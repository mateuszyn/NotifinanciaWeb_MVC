import './assets/style.css';
import { AuthService } from './services/authService.js';
import { AssetController } from './controllers/AssetController.js';
import { LoginView } from './views/LoginView.js';

async function initApp() {
    const user = await AuthService.getUser();

    if (user) {
        // Usuário logado: inicia o fluxo de ativos
        AssetController.init();
    } else {
        // Usuário deslogado: mostra tela de login
        LoginView.render();
        
        // Adiciona o evento de clique ao botão que acabamos de renderizar
        document.querySelector('#btn-login').addEventListener('click', () => {
            AuthService.signInWithGoogle();
        });
    }
}

initApp();