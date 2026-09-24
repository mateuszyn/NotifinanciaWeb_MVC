import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
    const navigate = useNavigate();

    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="container mt-5 mb-5 pb-5" style={{ maxWidth: '800px' }}>
            <button onClick={() => navigate('/')} className="btn btn-outline-secondary mb-4">
                <i className="bi bi-arrow-left"></i> Voltar para a Carteira
            </button>

            <h1 className="text-success fw-bold mb-4">Política de Privacidade</h1>
            <p className="text-secondary">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <div className="card bg-dark border-secondary p-4 text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>

                <h4 className="text-white mb-3 mt-2">1. Coleta e Finalidade dos Dados</h4>
                <p>Coletamos Dados Pessoais (como endereço de e-mail e informações da sua carteira de investimentos) na medida do necessário para fornecer uma experiência segura, tranquila, eficiente e personalizada. O objetivo principal no tratamento destes dados é fornecer os serviços da plataforma, como os relatórios diários, e viabilizar o suporte ao Usuário.</p>

                <h4 className="text-white mb-3 mt-4">2. Compartilhamento de Informações</h4>
                <p>Garantimos total sigilo do seu patrimônio. Os seus Dados Pessoais não são vendidos ou alugados para terceiros em nenhuma hipótese. O compartilhamento de dados ocorre estritamente com provedores de infraestrutura de tecnologia (como servidores em nuvem) necessários para a operação do sistema, exigindo-se destes o mesmo nível de proteção legal.</p>

                <h4 className="text-white mb-3 mt-4">3. Direitos do Titular (LGPD)</h4>
                <p>Em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD), o Usuário possui o direito de solicitar a confirmação da existência do tratamento, o acesso aos dados, a correção de informações desatualizadas, e a anonimização, bloqueio ou eliminação de seus Dados Pessoais de nossos servidores.</p>

                <h4 className="text-white mb-3 mt-4">4. Armazenamento e Segurança</h4>
                <p>O Notifinancia adota medidas técnicas, físicas e organizacionais adequadas para evitar incidentes e proteger os dados contra acessos não autorizados. Os dados são armazenados apenas pelo tempo exigido por lei, para preservar interesses legítimos da plataforma, ou até que a finalidade pela qual foram coletados seja alcançada e o Usuário solicite a exclusão.</p>

                <h4 className="text-white mb-3 mt-4">5. Uso de Cookies</h4>
                <p>A Plataforma pode utilizar "cookies" para coletar informações de navegação, com o objetivo de adequar o site ao perfil e às necessidades de seus Usuários, bem como garantir que o sistema seja carregado corretamente.</p>

            </div>
        </div>
    );
}
