import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Contato() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const userName = user?.user_metadata?.full_name || '';
    const userEmail = user?.email || '';

    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="container mt-5 mb-5 pb-5" style={{ maxWidth: '600px' }}>
            <button onClick={() => navigate('/')} className="btn btn-outline-secondary mb-4">
                <i className="bi bi-arrow-left"></i> Voltar para a Carteira
            </button>

            <h1 className="text-success fw-bold mb-3">Suporte e Contato</h1>
            <p className="text-secondary mb-4">Tem alguma dúvida, encontrou um erro no cálculo de dividendos ou quer sugerir uma nova funcionalidade? Mande uma mensagem pra gente!</p>

            <div className="card bg-dark border-secondary p-4">
                <form action="https://formspree.io/f/xyeyyaqq" method="POST">
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label text-white small fw-bold">Seu Nome</label>
                        <input
                            type="text"
                            className="form-control bg-black text-white border-secondary"
                            id="name"
                            name="name"
                            required
                            placeholder="Ex: Anderson Mateus"
                            defaultValue={userName}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email" className="form-label text-white small fw-bold">Seu E-mail</label>
                        <input
                            type="email"
                            className="form-control bg-black text-white border-secondary"
                            id="email"
                            name="email"
                            required
                            placeholder="Ex: anderson@email.com"
                            defaultValue={userEmail}
                            // Trava o e-mail se o usuário estiver logado (evita enviar e-mail diferente da conta)
                            readOnly={!!userEmail}
                            style={userEmail ? { backgroundColor: '#0a0c10', cursor: 'not-allowed', opacity: 0.7 } : {}}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="message" className="form-label text-white small fw-bold">Como podemos te ajudar?</label>
                        <textarea
                            className="form-control bg-black text-white border-secondary"
                            id="message"
                            name="message"
                            rows="5"
                            required
                            placeholder="Digite sua mensagem, feedback ou relato de erro aqui..."
                        />
                    </div>

                    <button type="submit" className="btn btn-success w-100 fw-bold py-2 mt-2">
                        Enviar Mensagem <i className="bi bi-send ms-2"></i>
                    </button>
                </form>

                <div className="text-center mt-4 pt-4 border-top border-secondary">
                    <p className="text-secondary small mb-1">Ou, se preferir, envie um e-mail direto para:</p>
                    <a
                        href="mailto:contato@notifinancia.online?subject=[Feedback Notifinancia]%20-%20Contato"
                        className="text-success fw-bold text-decoration-none"
                    >
                        contato@notifinancia.online
                    </a>
                </div>
            </div>
        </div>
    );
}
