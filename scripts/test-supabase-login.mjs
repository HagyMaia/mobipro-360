import fs from 'fs';
import path from 'path';

function parseDotEnv(content) {
  return content.split(/\r?\n/).filter(Boolean).reduce((acc, line) => {
    const idx = line.indexOf('=');
    if (idx === -1) return acc;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    acc[key] = value;
    return acc;
  }, {});
}

function normalizeSupabaseUrl(url) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch (_) {
    return url.replace(/\/rest\/v1.*$/i, '').replace(/\/+$/g, '');
  }
}

async function main() {
  // load .env.local if present
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    Object.assign(env, parseDotEnv(fs.readFileSync(envPath, 'utf8')));
  }

  const supabaseUrlRaw = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrlRaw || !anonKey) {
    console.error('Faltam variáveis: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (no .env.local ou na env).');
    process.exit(2);
  }

  const supabaseUrl = normalizeSupabaseUrl(supabaseUrlRaw);

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node scripts/test-supabase-login.mjs <email> <password>');
    process.exit(2);
  }

  const tokenEndpoint = `${supabaseUrl}/auth/v1/token`;

  const body = new URLSearchParams({ grant_type: 'password', email, password });

  console.log('[test-supabase] url', supabaseUrl);

  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: body.toString(),
    });

    const data = await res.json();
    console.log('[test-supabase] status', res.status);
    console.log('[test-supabase] response', JSON.stringify(data, null, 2));

    if (res.ok && data.access_token) {
      console.log('[test-supabase] Login bem-sucedido — token recebido.');
      process.exit(0);
    } else {
      console.error('[test-supabase] Falha no login. Verifique email/senha e configuração do Supabase.');
      process.exit(1);
    }
  } catch (err) {
    console.error('[test-supabase] Erro de requisição:', err);
    process.exit(1);
  }
}

main();
