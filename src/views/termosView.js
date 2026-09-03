export const TermosView = {
    render() {
        window.scrollTo(0, 0);
        
        return `
            <div class="container mt-5 mb-5 pb-5" style="max-width: 800px;">
                <button onclick="window.location.hash=''" class="btn btn-outline-secondary mb-4">
                    <i class="bi bi-arrow-left"></i> Voltar para a Carteira
                </button>
                
                <h1 class="text-success fw-bold mb-4">Termos de Uso</h1>
                <p class="text-secondary">Última atualização: ${new Date().toLocaleDateString('pt-BR')}</p>
                
                <div class="card bg-dark border-secondary p-4 text-secondary" style="font-size: 0.9rem; line-height: 1.6;">
                    
                    <h4 class="text-white mb-3 mt-2">1. Objetivo da Plataforma</h4>
                    <p>O Notifinancia atua como uma ferramenta simplificada com proposta educativa, consolidando informações financeiras publicamente disponibilizadas pelo mercado financeiro e de capitais.</p>
                    
                    <h4 class="text-white mb-3 mt-4">2. Isenção de Responsabilidade e Recomendações</h4>
                    <p>Os conteúdos disponibilizados não representam oferta de negociação de valores mobiliários ou outros instrumentos financeiros e não constituem qualquer forma de recomendação de investimento ou aconselhamento financeiro. A utilização da Plataforma e dos conteúdos oferecidos é feita sob inteira responsabilidade do Usuário, que deverá utilizar seus próprios conhecimentos e técnicas para decidir sobre seus investimentos. O Notifinancia não se responsabiliza por eventuais perdas financeiras ou resultados negativos decorrentes das decisões tomadas pelo Usuário.</p>
                    
                    <h4 class="text-white mb-3 mt-4">3. Imprecisão e Atraso de Dados</h4>
                    <p>As informações e cotações apresentadas são obtidas a partir de fontes públicas e terceiros. O Notifinancia não garante e não se responsabiliza pela pontualidade, integridade, exatidão, omissão ou atualização de quaisquer informações e/ou dados contidos na Plataforma. A Plataforma e os conteúdos são fornecidos no estado em que se encontram ("as is"), estando sujeitos a atrasos ou imprecisões inerentes à distribuição eletrônica de dados.</p>
                    
                    <h4 class="text-white mb-3 mt-4">4. Obrigações do Usuário</h4>
                    <p>O Usuário compromete-se a não utilizar a Plataforma para fins ilegais, não realizar engenharia reversa, e não reproduzir ou distribuir os dados apresentados sem autorização expressa. O acesso é individual e intransferível.</p>
                    
                </div>
            </div>
        `;
    }
};