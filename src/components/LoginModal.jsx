import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const modalRef = useRef(null);

  useEffect(() => {
    // Só mostramos o modal se NÃO estiver autenticado
    if (!isAuthenticated && modalRef.current) {
      // Como estamos usando Bootstrap via CDN/JS Global, chamamos a API dele
      const modal = window.bootstrap.Modal.getOrCreateInstance(modalRef.current);
      modal.show();
    } else if (isAuthenticated && modalRef.current) {
      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      if (modal) modal.hide();
    }
  }, [isAuthenticated]);

  return (
    <div 
      className="modal fade" 
      id="loginModal" 
      tabIndex="-1" 
      aria-labelledby="loginModalLabel" 
      aria-hidden="true" 
      data-bs-backdrop="static" 
      data-bs-keyboard="false"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark border border-secondary shadow-lg">
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold text-success" id="loginModalLabel">Notifinancia</h5>
          </div>
          <div className="modal-body text-center p-5">
            <h3 className="fw-bold text-white mb-3">Notificações do Seu portfólio.</h3>
            
            <p className="text-secondary mb-4">Gerencie sua carteira real de <strong>Ações e FIIs</strong>. Acesse gratuitamente para receber <strong>alertas de Preço Médio</strong> e <strong>relatórios de dividendos</strong> no seu e-mail.</p>
            
            <button 
              onClick={signInWithGoogle}
              className="btn btn-outline-light w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-google text-success fs-5"></i> Acessar com Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
