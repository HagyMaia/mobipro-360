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

  // Rotas públicas acessíveis sem login
  const isPublicPage =
    pathname === '/welcome' ||
    pathname === '/cadastro' ||
    pathname === '/sr-logistica.apk' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/recuperar-senha')

  // Se o Supabase NÃO estiver configurado (Preview Vercel / Modo Demo Local)
  if (!isSupabaseConfigured) {
    const hasDemoAuth = request.cookies.get('sb-demo-token')?.value || request.cookies.get('mobipro-demo-session')?.value

    if (!hasDemoAuth && !isPublicPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/welcome'
      return NextResponse.redirect(url)
    }

    if (hasDemoAuth && (pathname === '/welcome' || pathname === '/login' || pathname === '/cadastro')) {
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

    if (user && (pathname === '/welcome' || pathname === '/login' || pathname === '/cadastro')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } catch (e) {
    console.error('[Middleware] Erro ao verificar autenticação:', e)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}