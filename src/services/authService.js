import { supabase } from './supabaseClient.js';

export const AuthService = {
    // Abre a janelinha do Google
    async signInWithGoogle() {
    // Se estiver rodando no PC (npm run dev), usa o localhost. Se estiver na Vercel, usa o site oficial.
    const redirectURL = import.meta.env.DEV 
        ? 'http://localhost:5173' 
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