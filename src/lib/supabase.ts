import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Exporta o cliente para ser usado em qualquer lugar do app (Login, Cadastro, etc) //
export const supabase = createClient(supabaseUrl, supabaseAnonKey);