import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isSupabaseConfigured = Boolean(
    rawUrl &&
    rawKey &&
    !rawUrl.includes('placeholder') &&
    !rawUrl.includes('example') &&
    !rawKey.includes('placeholder') &&
    rawUrl.startsWith('http')
  )

  const { pathname } = request.nextUrl
  const isResetFlow =
    request.nextUrl.searchParams.get('mode') === 'reset' ||
    request.nextUrl.searchParams.get('type') === 'recovery' ||
    pathname.startsWith('/atualizar-senha')

  // Rotas públicas acessíveis sem login
  const isPublicPage =
    pathname === '/welcome' ||
    pathname === '/cadastro' ||
    pathname === '/sr-logistica.apk' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/.well-known') ||
    pathname.endsWith('.apk') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/atualizar-senha')

  // Se o Supabase NÃO estiver configurado (Preview Vercel / Modo Demo Local)
  if (!isSupabaseConfigured) {
    const hasDemoAuth = request.cookies.get('sb-demo-token')?.value || request.cookies.get('mobipro-demo-session')?.value

    if (!hasDemoAuth && !isPublicPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/welcome'
      return NextResponse.redirect(url)
    }

    if (hasDemoAuth && (pathname === '/welcome' || (pathname === '/login' && !isResetFlow) || pathname === '/cadastro')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // Supabase configurado em produção
  try {
    const supabase = createServerClient(
      rawUrl!,
      rawKey!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isPublicPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/welcome'
      return NextResponse.redirect(url)
    }

    if (user && !isPublicPage && !isResetFlow) {
      const { data: motorista } = await supabase
        .from('motoristas')
        .select('id, status')
        .eq('id', user.id)
        .maybeSingle()

      // Se a rota for /status ou /admin, permite o acesso sem expulsar o usuário
      if (pathname.startsWith('/status') || pathname.startsWith('/admin')) {
        return supabaseResponse
      }

      // Se for um motorista pendente tentando acessar rotas de corrida, redireciona para /status
      if (motorista && motorista.status && motorista.status.toLowerCase() !== 'aprovado') {
        const url = request.nextUrl.clone()
        url.pathname = '/status'
        return NextResponse.redirect(url)
      }
    }

    if (user && (pathname === '/welcome' || (pathname === '/login' && !isResetFlow) || pathname === '/cadastro')) {
      const { data: motorista } = await supabase
        .from('motoristas')
        .select('id, status')
        .eq('id', user.id)
        .maybeSingle()

      const url = request.nextUrl.clone()
      if (motorista && motorista.status && motorista.status.toLowerCase() !== 'aprovado') {
        url.pathname = '/status'
      } else {
        url.pathname = '/'
      }
      return NextResponse.redirect(url)
    }
  } catch (e) {
    console.error('[Middleware] Erro ao verificar autenticação:', e)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk|webmanifest|json|js|ico|txt)$).*)',
  ],
}