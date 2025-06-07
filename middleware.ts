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
  '/pending-approval',
  '/account-rejected',
  '/account-suspended'
])

// Rotas que são acessíveis apenas para admins
const isAdminRoute = createRouteMatcher([
  '/admin(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const currentPath = req.nextUrl.pathname
  
  // Pular processamento para rotas estáticas e APIs
  if (currentPath.startsWith('/_next') || 
      currentPath.includes('.') ||
      currentPath.startsWith('/api/webhooks') ||
      currentPath.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // Verificar autenticação - método compatível com Next.js 15
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
    
    console.warn('[MIDDLEWARE] Auth error:', error instanceof Error ? error.message : 'Unknown error')
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Se não autenticado e rota não é pública, redirecionar para login
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Se autenticado, verificar permissões
  if (userId) {
    let publicMetadata = {}
    let approvalStatus = null
    let userRole = null
    
    // Tentar obter dados do sessionClaims primeiro
    if (sessionClaims?.publicMetadata) {
      publicMetadata = (sessionClaims.publicMetadata as any) || {}
      approvalStatus = (publicMetadata as any).approvalStatus
      userRole = (publicMetadata as any).role
    }
    
    // Se não temos dados na sessão, buscar diretamente do Clerk (fallback)
    if (!userRole || !approvalStatus) {
      try {
        const { createClerkClient } = await import('@clerk/backend')
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
        const user = await clerkClient.users.getUser(userId)
        const clerkMetadata = user.publicMetadata || {}
        
        approvalStatus = clerkMetadata.approvalStatus || approvalStatus
        userRole = clerkMetadata.role || userRole
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIDDLEWARE] Fallback to Clerk API - Role: ${userRole}, Status: ${approvalStatus}`)
        }
      } catch (clerkError) {
        console.warn('[MIDDLEWARE] Clerk API fallback failed:', clerkError instanceof Error ? clerkError.message : 'Unknown error')
      }
    }
    
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    
    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] User: ${userId}, Role: ${userRole}, Status: ${approvalStatus}, Path: ${currentPath}, IsAdmin: ${isAdmin}`)
    }
    
    // Verificar acesso admin
    if (isAdminRoute(req) && !isAdmin) {
      console.warn(`[MIDDLEWARE] Non-admin trying to access admin route: ${currentPath}`)
      return NextResponse.redirect(new URL('/', req.url))
    }

    // IMPORTANTE: Admins podem acessar qualquer coisa
    if (isAdmin) {
      // Se admin está em página de pending, redirecionar para home
      if (currentPath === '/pending-approval') {
        console.log('[MIDDLEWARE] Admin redirected from pending-approval to home')
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      // Admins têm acesso livre a tudo
      return NextResponse.next({
        request: {
          headers: new Headers({
            ...Object.fromEntries(req.headers.entries()),
            'x-user-id': userId,
            'x-approval-status': approvalStatus || 'APPROVED',
            'x-user-role': userRole || 'ADMIN',
            'x-is-admin': 'true'
          })
        }
      })
    }

    // Para não-admins, verificar status de aprovação
    if (!isPublicRoute(req)) {
      switch (approvalStatus) {
        case 'APPROVED':
          // Usuários aprovados: se estão em páginas de estado, redirecionar para home
          if (['/pending-approval', '/account-rejected', '/account-suspended'].includes(currentPath)) {
            console.log(`[MIDDLEWARE] Approved user redirected from ${currentPath} to home`)
            return NextResponse.redirect(new URL('/', req.url))
          }
          break

        case 'REJECTED':
          if (currentPath !== '/account-rejected') {
            console.log(`[MIDDLEWARE] Rejected user redirected to account-rejected`)
            return NextResponse.redirect(new URL('/account-rejected', req.url))
          }
          break

        case 'SUSPENDED':
          if (currentPath !== '/account-suspended') {
            console.log(`[MIDDLEWARE] Suspended user redirected to account-suspended`)
            return NextResponse.redirect(new URL('/account-suspended', req.url))
          }
          break

        case 'PENDING':
        default:
          // Usuários pending ou sem status: redirecionar para pending-approval
          if (currentPath !== '/pending-approval') {
            console.log(`[MIDDLEWARE] Pending user redirected to pending-approval`)
            return NextResponse.redirect(new URL('/pending-approval', req.url))
          }
          break
      }
    }

    // Passar informações via headers
    return NextResponse.next({
      request: {
        headers: new Headers({
          ...Object.fromEntries(req.headers.entries()),
          'x-user-id': userId,
          'x-approval-status': approvalStatus || 'PENDING',
          'x-user-role': userRole || 'USER',
          'x-is-admin': isAdmin ? 'true' : 'false'
        })
      }
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Incluir todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 