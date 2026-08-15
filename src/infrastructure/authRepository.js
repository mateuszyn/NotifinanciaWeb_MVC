import { supabase } from './supabaseClient.js';

export const authRepository = {
    // Abre a janelinha do Google
    async signInWithGoogle() {
        // Pega a URL dinamicamente no PC (ex: http://localhost:3000) ou usa a de produção
        const redirectURL = import.meta.env.DEV 
            ? window.location.origin 
            : 'https://notifinancia.online';

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