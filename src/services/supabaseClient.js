import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Ou como estiver a sua variável
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,       // Obriga a salvar a sessão
        autoRefreshToken: true,     // Tenta renovar o token sozinho sempre que possível
        detectSessionInUrl: true,   // Necessário para o login do Google funcionar direito
        storage: window.localStorage // FORÇA o uso do armazenamento físico do navegador, que não é limpo facilmente
    }
});