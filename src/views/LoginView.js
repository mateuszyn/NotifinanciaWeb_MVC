export const LoginView = {
    render() {
        const app = document.querySelector('#app');
        app.innerHTML = `
            <div class="login-wrapper">
                <div class="login-card animate__animated animate__fadeIn">
                    <div class="text-center mb-4">
                        <i class="bi bi-graph-up-arrow fs-1 text-primary"></i>
                        <h1 class="mt-2 fw-bold">Notifinancia</h1>
                        <p class="text-secondary">Sua carteira de investimentos simplificada.</p>
                    </div>
                    
                    <button id="btn-login" class="btn btn-google-login w-100 d-flex align-items-center justify-content-center gap-2">
                        <i class="bi bi-google"></i>
                        Entrar com Google
                    </button>
                    
                    <div class="mt-4 text-center">
                        <small class="text-muted">Acesse para gerenciar seus ativos em tempo real.</small>
                    </div>
                </div>
            </div>
        `;
    }
};