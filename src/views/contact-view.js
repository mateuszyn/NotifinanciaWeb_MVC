export const ContactView = {
    render(user) {
        window.scrollTo(0, 0);
        
        // Extrai os dados se o usuário estiver logado
        const userName = user?.user_metadata?.full_name || '';
        const userEmail = user?.email || '';
        
        // Trava o campo de e-mail para evitar que o usuário digite um e-mail diferente da conta
        const emailReadOnly = userEmail ? 'readonly style="background-color: #0a0c10; cursor: not-allowed; opacity: 0.7;"' : '';

        return `
            <div class="container mt-5 mb-5 pb-5" style="max-width: 600px;">
                <button onclick="window.location.hash=''" class="btn btn-outline-secondary mb-4">
                    <i class="bi bi-arrow-left"></i> Voltar para a Carteira
                </button>
                
                <h1 class="text-success fw-bold mb-3">Suporte e Contato</h1>
                <p class="text-secondary mb-4">Tem alguma dúvida, encontrou um erro no cálculo de dividendos ou quer sugerir uma nova funcionalidade? Mande uma mensagem pra gente!</p>
                
                <div class="card bg-dark border-secondary p-4">
                    <!-- Substitua o link abaixo pelo seu endpoint do Formspree -->
                    <form action="https://formspree.io/f/xyeyyaqq" method="POST">
                        <div class="mb-3">
                            <label for="name" class="form-label text-white small fw-bold">Seu Nome</label>
                            <input type="text" class="form-control bg-black text-white border-secondary" id="name" name="name" required placeholder="Ex: Anderson Mateus" value="${userName}">
                        </div>
                        
                        <div class="mb-3">
                            <label for="email" class="form-label text-white small fw-bold">Seu E-mail</label>
                            <input type="email" class="form-control bg-black text-white border-secondary" id="email" name="email" required placeholder="Ex: anderson@ufersa.edu.br" value="${userEmail}" ${emailReadOnly}>
                        </div>
                        
                        <div class="mb-3">
                            <label for="message" class="form-label text-white small fw-bold">Como podemos te ajudar?</label>
                            <textarea class="form-control bg-black text-white border-secondary" id="message" name="message" rows="5" required placeholder="Digite sua mensagem, feedback ou relato de erro aqui..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100 fw-bold py-2 mt-2">
                            Enviar Mensagem <i class="bi bi-send ms-2"></i>
                        </button>
                    </form>
                    
                    <div class="text-center mt-4 pt-4 border-top border-secondary">
                        <p class="text-secondary small mb-1">Ou, se preferir, envie um e-mail direto para:</p>
                        <a href="mailto:contato@notifinancia.online?subject=[Feedback Notifinancia]%20-%20Contato" class="text-success fw-bold text-decoration-none">
                            contato@notifinancia.online
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
};