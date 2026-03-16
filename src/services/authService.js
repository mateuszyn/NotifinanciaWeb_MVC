import { supabase } from './supabaseClient.js';

export const AuthService = {
    // Abre a janelinha do Google
    async signInWithGoogle() {
    // Se o site estiver rodando em produção, usa o domínio, se não, usa o que estiver na barra de endereços
    const redirectURL = import.meta.env.PROD 
        ? 'https://notifinancia.online' 
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectURL
        }
    });

    if (error) console.error('Erro ao logar:', error.message);
},

    // Sai da conta
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erro ao sair:', error.message);
    },

    // Retorna os dados do usuário atual (se houver)
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};