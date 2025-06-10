import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definir rotas públicas que não precisam de autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/proposals/webhook',
  '/api/health',
  '/api/debug(.*)',
  '/api/external(.*)', // APIs externas com autenticação via API key
  '/pending-approval',
  '/account-rejected',
  '/account-suspended'
])

// APIs que devem retornar JSON errors em vez de redirecionar
const isApiRoute = createRouteMatcher([
  '/api/(.*)'
])

// Rotas que são acessíveis apenas para admins
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'  // Incluir APIs de admin também
])

export default clerkMiddleware(async (auth, req) => {
  const currentPath = req.nextUrl.pathname
  
  // ⚡ OTIMIZAÇÃO: Pular processamento para rotas estáticas e APIs específicas
  if (currentPath.startsWith('/_next') || 
      currentPath.includes('.') ||
      currentPath.startsWith('/api/webhooks') ||
      currentPath.startsWith('/api/external') ||
      currentPath.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // ⚡ ULTRA-FAST: Verificar autenticação usando apenas sessionClaims (sem API calls)
  let userId = null
  let sessionClaims = null
  let isAuthenticated = false
  
  try {
    const authResult = auth()
    userId = authResult.userId
    sessionClaims = authResult.sessionClaims
    isAuthenticated = !!userId
  } catch (error) {
    // Em caso de erro de auth, permitir acesso apenas a rotas públicas
    if (isPublicRoute(req)) {
      return NextResponse.next()
    }
    
    // Para APIs, retornar erro JSON
    if (isApiRoute(req)) {
      return NextResponse.json(
        { error: 'Erro de autenticação' },
        { status: 401 }
      )
    }
    
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Se não autenticado e rota não é pública
  if (!userId && !isPublicRoute(req)) {
    // Para APIs, retornar erro JSON em vez de redirecionar
    if (isApiRoute(req)) {
      return NextResponse.json(
        { error: 'Não autorizado - Login necessário' },
        { status: 401 }
      )
    }
    
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // ⚡ ULTRA-FAST: Se autenticado, usar APENAS sessionClaims (sem DB queries, sem API calls)
  if (userId) {
    // Extrair dados diretamente do sessionClaims para máxima performance
    const publicMetadata = (sessionClaims?.publicMetadata as any) || {}
    const approvalStatus = publicMetadata.approvalStatus || 'PENDING'
    const userRole = publicMetadata.role || 'USER'
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    
    // 🔍 DEBUG: Log detalhado para identificar problema
    console.log('[MIDDLEWARE DEBUG]', {
      userId,
      currentPath,
      hasSessionClaims: !!sessionClaims,
      publicMetadata,
      approvalStatus,
      userRole,
      isAdmin,
      timestamp: new Date().toISOString()
    })
    
    // ⚡ PERFORMANCE LOG: Log apenas em desenvolvimento e sem dados sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] Fast Path - Role: ${userRole}, Status: ${approvalStatus}, Path: ${currentPath}`)
    }
    
    // ⚡ ULTRA-FAST: Verificação de admin instantânea
    if (isAdminRoute(req) && !isAdmin) {
      // Para APIs de admin, retornar erro JSON
      if (isApiRoute(req)) {
        return NextResponse.json(
          { error: 'Acesso negado - Apenas administradores' },
          { status: 403 }
        )
      }
      
      console.log('[MIDDLEWARE] Redirecionando não-admin de rota admin:', { userId, currentPath, userRole })
      return NextResponse.redirect(new URL('/', req.url))
    }

    // ⚡ ULTRA-FAST: Admins têm acesso instantâneo a tudo
    if (isAdmin) {
      // Se admin está em página de pending, redirecionar para home
      if (currentPath === '/pending-approval') {
        console.log('[MIDDLEWARE] Redirecionando admin de pending-approval para home:', { userId, userRole })
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      // Admins têm acesso livre a tudo sem headers extras para performance
      return NextResponse.next()
    }

    // ⚡ ULTRA-FAST: Para não-admins, verificação instantânea de status baseada em sessionClaims
    if (!isPublicRoute(req)) {
      console.log('[MIDDLEWARE] Verificando status de aprovação:', { 
        userId, 
        approvalStatus, 
        currentPath,
        isPublicRoute: isPublicRoute(req)
      })
      
      switch (approvalStatus) {
        case 'APPROVED':
          // Usuários aprovados: se estão em páginas de estado, redirecionar para home
          if (['/pending-approval', '/account-rejected', '/account-suspended'].includes(currentPath)) {
            console.log('[MIDDLEWARE] Redirecionando usuário aprovado de página de status para home:', { 
              userId, 
              approvalStatus, 
              currentPath 
            })
            return NextResponse.redirect(new URL('/', req.url))
          }
          console.log('[MIDDLEWARE] Usuário aprovado acessando rota protegida:', { userId, currentPath })
          break

        case 'REJECTED':
          if (currentPath !== '/account-rejected') {
            console.log('[MIDDLEWARE] Redirecionando usuário rejeitado para account-rejected:', { userId, currentPath })
            return NextResponse.redirect(new URL('/account-rejected', req.url))
          }
          break

        case 'SUSPENDED':
          if (currentPath !== '/account-suspended') {
            console.log('[MIDDLEWARE] Redirecionando usuário suspenso para account-suspended:', { userId, currentPath })
            return NextResponse.redirect(new URL('/account-suspended', req.url))
          }
          break

        case 'PENDING':
        default:
          // Usuários pending ou sem status: redirecionar para pending-approval
          if (currentPath !== '/pending-approval') {
            console.log('[MIDDLEWARE] Redirecionando usuário pendente para pending-approval:', { 
              userId, 
              approvalStatus, 
              currentPath,
              publicMetadata 
            })
            return NextResponse.redirect(new URL('/pending-approval', req.url))
          }
          break
      }
    }

    // ⚡ ULTRA-FAST: Retorno sem headers extras para performance máxima
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Incluir todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 