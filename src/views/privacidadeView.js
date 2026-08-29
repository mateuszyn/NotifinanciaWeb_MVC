export const PrivacidadeView = {
    render() {
        window.scrollTo(0, 0);
        
        return `
            <div class="container mt-5 mb-5 pb-5" style="max-width: 800px;">
                <button onclick="window.location.hash=''" class="btn btn-outline-secondary mb-4">
                    <i class="bi bi-arrow-left"></i> Voltar para a Carteira
                </button>
                
                <h1 class="text-success fw-bold mb-4">Política de Privacidade</h1>
                <p class="text-secondary">Última atualização: ${new Date().toLocaleDateString('pt-BR')}</p>
                
                <div class="card bg-dark border-secondary p-4 text-secondary" style="font-size: 0.9rem; line-height: 1.6;">
                    
                    <h4 class="text-white mb-3 mt-2">1. Coleta e Finalidade dos Dados</h4>
                    <p>Coletamos Dados Pessoais (como endereço de e-mail e informações da sua carteira de investimentos) na medida do necessário para fornecer uma experiência segura, tranquila, eficiente e personalizada[cite: 2]. O objetivo principal no tratamento destes dados é fornecer os serviços da plataforma, como os relatórios diários, e viabilizar o suporte ao Usuário[cite: 2].</p>
                    
                    <h4 class="text-white mb-3 mt-4">2. Compartilhamento de Informações</h4>
                    <p>Garantimos total sigilo do seu patrimônio. Os seus Dados Pessoais não são vendidos ou alugados para terceiros em nenhuma hipótese[cite: 2]. O compartilhamento de dados ocorre estritamente com provedores de infraestrutura de tecnologia (como servidores em nuvem) necessários para a operação do sistema, exigindo-se destes o mesmo nível de proteção legal[cite: 2].</p>
                    
                    <h4 class="text-white mb-3 mt-4">3. Direitos do Titular (LGPD)</h4>
                    <p>Em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD), o Usuário possui o direito de solicitar a confirmação da existência do tratamento, o acesso aos dados, a correção de informações desatualizadas, e a anonimização, bloqueio ou eliminação de seus Dados Pessoais de nossos servidores[cite: 2].</p>
                    
                    <h4 class="text-white mb-3 mt-4">4. Armazenamento e Segurança</h4>
                    <p>O Notifinancia adota medidas técnicas, físicas e organizacionais adequadas para evitar incidentes e proteger os dados contra acessos não autorizados[cite: 2]. Os dados são armazenados apenas pelo tempo exigido por lei, para preservar interesses legítimos da plataforma, ou até que a finalidade pela qual foram coletados seja alcançada e o Usuário solicite a exclusão[cite: 2].</p>
                    
                    <h4 class="text-white mb-3 mt-4">5. Uso de Cookies</h4>
                    <p>A Plataforma pode utilizar "cookies" para coletar informações de navegação, com o objetivo de adequar o site ao perfil e às necessidades de seus Usuários, bem como garantir que o sistema seja carregado corretamente[cite: 2].</p>

                </div>
            </div>
        `;
    }
};