import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Mantém a aplicação renderizável quando o ambiente local ainda não foi configurado.
const browserUrl = supabaseUrl || 'https://placeholder.supabase.co'
const browserKey = supabaseAnonKey || 'placeholder-anon-key'

// Cria o cliente cliente-side sincronizado com os cookies do middleware
export const supabase = createBrowserClient(browserUrl, browserKey)