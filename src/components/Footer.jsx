import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-dark text-center py-4 border-top border-secondary mt-auto">
            <div className="container" style={{ opacity: 0.7 }}>
                <p className="text-success fw-bold mb-1">Notifinancia - Notificações dos seus Investimentos</p>
                <p className="text-secondary small mb-3">
                    Sua plataforma definitiva para controle de <strong>ações</strong> e <strong>FIIs</strong> na <strong>B3</strong>.
                    Receba <strong>relatórios</strong> diários, acompanhe seus <strong>dividendos</strong> e configure
                    <strong> alertas</strong> de <strong>preço médio</strong>. Desenvolvido para maximizar seus aportes usando a estratégia <strong>Barsi</strong> e <strong>notificações</strong> inteligentes.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <Link to="/termos" className="text-secondary small text-decoration-none">
                        Termos de Uso
                    </Link>
                    <span className="text-secondary small">·</span>
                    <Link to="/privacidade" className="text-secondary small text-decoration-none">
                        Política de Privacidade
                    </Link>
                    <span className="text-secondary small">·</span>
                    <Link to="/contato" className="text-secondary small text-decoration-none">
                        Suporte e Contato
                    </Link>
                </div>
            </div>
        </footer>
    );
}
