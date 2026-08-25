import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase não foram encontradas.')
}

// Cria o cliente cliente-side sincronizado com os cookies do middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)