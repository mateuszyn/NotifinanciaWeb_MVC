import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Importando as páginas (por enquanto provisórias)
import Dashboard from './pages/Dashboard';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import Contato from './pages/Contato';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';

// O App.jsx é o esqueleto principal. 
// Ele engloba tudo com o AuthProvider (para liberar o login global)
// e o Router (para gerenciar as URLs).
export default function App() {
  
  // Efeito Global para fechar popovers nativos (<details>) ao clicar fora
  React.useEffect(() => {
    const closeDetailsOnClickOutside = (e) => {
      document.querySelectorAll('details[open]').forEach((details) => {
        if (!details.contains(e.target)) {
          details.removeAttribute('open');
        }
      });
    };

    document.addEventListener('click', closeDetailsOnClickOutside);
    return () => document.removeEventListener('click', closeDetailsOnClickOutside);
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* O flex-grow-1 empurra o Footer sempre pro fundo */}
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/contato" element={<Contato />} />
          </Routes>
        </div>
        <Footer />
      </Router>
      <LoginModal />
    </AuthProvider>
  );
}
