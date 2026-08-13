export const LoginView = {
    render() {
        const app = document.querySelector('#app');
        app.innerHTML = `
            <div class="login-wrapper py-5">
                <div class="container">
                    <div class="row justify-content-center align-items-center g-5">
                        
                        <div class="col-12 col-lg-6 text-center text-lg-start animate__animated animate__fadeInLeft">
                            <h1 class="display-4 fw-bold text-success mb-3">Seu portfólio no seu radar.</h1>
                            <p class="lead text-secondary mb-4">
                                Receba relatórios diários da sua carteira de investimentos <b>B3 e FIIs</b> diretamente no seu e-mail. Saiba o momento exato de aportar.
                            </p>
                            
                            <div class="features-list d-flex flex-column gap-3 mb-5 mb-lg-0">
                                <div class="d-flex align-items-center gap-3 justify-content-center justify-content-lg-start">
                                    <i class="bi bi-check-circle-fill text-success fs-4"></i>
                                    <span class="text-light">Notificações Diárias às 18h</span>
                                </div>
                                <div class="d-flex align-items-center gap-3 justify-content-center justify-content-lg-start">
                                    <i class="bi bi-check-circle-fill text-success fs-4"></i>
                                    <span class="text-light">Alertas de Ativos abaixo do Preço Médio</span>
                                </div>
                                <div class="d-flex align-items-center gap-3 justify-content-center justify-content-lg-start">
                                    <i class="bi bi-check-circle-fill text-success fs-4"></i>
                                    <span class="text-light">Atalhos para operar na sua Corretora</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-8 col-lg-5 col-xl-4">
                            <div class="login-card animate__animated animate__fadeInRight shadow-lg">
                                <div class="text-center mb-4">
                                    <i class="bi bi-graph-up-arrow fs-1 text-success"></i>
                                    <h2 class="mt-2 fw-bold text-white">Acesse o Notifinancia</h2>
                                    <p class="text-secondary small">Comece a monitorar seus ativos agora.</p>
                                </div>
                                
                                <button id="btn-login" class="btn btn-google-login w-100 d-flex align-items-center justify-content-center gap-2 py-3 fw-bold">
                                    <i class="bi bi-google"></i>
                                    Entrar com Google
                                </button>
                                
                                <div class="mt-4 text-center">
                                    <small class="text-muted">Desenvolvido pela <b>Sertão Devs</b>.</small>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div class="row mt-5 pt-5 text-center border-top border-secondary">
                        <div class="col-12">
                            <h3 class="text-success fw-bold mb-4">Por que usar o Notifinancia?</h3>
                            <div class="row g-4">
                                <div class="col-md-4">
                                    <h4 class="text-white fs-5">Foco em Dividendos</h4>
                                    <p class="text-secondary small">Ideal para quem segue a metodologia Barsi e foca em renda passiva.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4 class="text-white fs-5">Preço Médio (PM)</h4>
                                    <p class="text-secondary small">Cálculo automático de rentabilidade baseado no seu custo de aquisição.</p>
                                </div>
                                <div class="col-md-4">
                                    <h4 class="text-white fs-5">Mobile First</h4>
                                    <p class="text-secondary small">Acesse de qualquer lugar, direto do seu smartphone ou notebook.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
};