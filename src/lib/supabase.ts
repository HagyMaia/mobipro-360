// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Acessa as variáveis de ambiente com um valor de fallback (placeholder)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Inicializa o cliente Supabase com os valores corretos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);