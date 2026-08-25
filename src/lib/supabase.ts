import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.https://lvdplhnbkkmlcxeuqhdo.supabase.co/rest/v1/ || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.sb_publishable_CoC8vHLwAQ3kGsXwWBlaoA_4LB5SzsK || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);