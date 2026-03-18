import { createClient } from '@supabase/supabase-js'

// Buscando as variáveis do arquivo .env através do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Criando a instância única de conexão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Renova o token sozinho
    persistSession: true,   // Salva no localStorage
    detectSessionInUrl: true // Importante para o redirecionamento do Google
  }
})