import { supabase } from './supabaseClient.js';

export const AuthService = {
    // Abre a janelinha do Google
    async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Isso garante que o Google redirecione de volta para o seu localhost no desenvolvimento
                redirectTo: window.location.origin 
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