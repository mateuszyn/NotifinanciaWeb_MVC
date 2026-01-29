export const LoginView = {
    render() {
        const app = document.querySelector('#app');
        app.innerHTML = `
            <div class="login-container">
                <h1>Notifinancia</h1>
                <p>Sua carteira de investimentos simplificada.</p>
                <button id="btn-login" class="btn-google">
                    Entrar com Google
                </button>
            </div>
        `;
    }
};