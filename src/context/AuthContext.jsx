import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../infrastructure/supabase-client'; // Importando do arquivo antigo

// 1. Criação do Contexto
const AuthContext = createContext();

// 2. Criação do Provider (Componente que vai abraçar a nossa aplicação)
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial

  useEffect(() => {
    // Busca a sessão inicial quando o React monta
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchSession();

    // Escuta mudanças em tempo real (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup da inscrição quando o componente desmontar
    return () => subscription.unsubscribe();
  }, []);

  // Valores e funções que queremos deixar disponíveis para toda a aplicação React
  const value = {
    session,
    user,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account' // Força o Google a perguntar qual conta usar
          }
        }
      });
    },
    signOut: async () => {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Só renderiza os filhos quando terminar de checar a sessão, 
          evitando "piscadas" na tela de login */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Hook customizado para facilitar o uso nos componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
