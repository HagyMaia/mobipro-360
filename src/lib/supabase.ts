import { createBrowserClient } from '@supabase/ssr'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(rawUrl && supabaseAnonKey)

// Normalize a URL para garantir que não exista um sufixo como `/rest/v1`
function normalizeSupabaseUrl(url: string) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch (_) {
    // fallback simples: remove /rest/v1 ou qualquer path após o domínio
    return url.replace(/\/rest\/v1.*$/i, '').replace(/\/+$/g, '');
  }
}

export const browserUrl = isSupabaseConfigured ? normalizeSupabaseUrl(rawUrl as string) : 'https://placeholder.supabase.co'
const browserKey = supabaseAnonKey || 'placeholder-anon-key'

// Cria o cliente cliente-side sincronizado com os cookies do middleware
export const supabase = createBrowserClient(browserUrl, browserKey)