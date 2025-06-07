import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definir rotas públicas que não precisam de autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/proposals/webhook',
  '/api/health',
  '/pending-approval',
  '/account-rejected'
])

// Rotas que são acessíveis apenas para admins
const isAdminRoute = createRouteMatcher([
  '/admin(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Usar try/catch para lidar com warnings de APIs dinâmicas
  let userId = null
  let sessionClaims = null
  
  try {
    const authResult = await auth()
    userId = authResult.userId
    sessionClaims = authResult.sessionClaims
  } catch (error) {
    // Se houver erro relacionado a APIs dinâmicas, continuar sem autenticação
    if (error instanceof Error && error.message.includes('headers()')) {
      console.warn('Warning: Dynamic API usage detected in middleware, continuing without auth')
    } else {
      throw error
    }
  }

  // Se a rota não é pública e o usuário não está autenticado, redirecionar para nossa página de sign-in
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Se o usuário está autenticado, verificar status de aprovação
  if (userId && sessionClaims) {
    const publicMetadata = sessionClaims.publicMetadata as any || {}
    const approvalStatus = publicMetadata.approvalStatus
    const userRole = publicMetadata.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    
    // Verificar se está tentando acessar rota de admin sem ser admin
    if (isAdminRoute(req) && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Proteger rotas baseado no status de aprovação (exceto admins)
    if (!isAdmin && !isPublicRoute(req)) {
      const currentPath = req.nextUrl.pathname

      switch (approvalStatus) {
        case 'PENDING':
          // Usuários pendentes só podem acessar a página de aguardo
          if (currentPath !== '/pending-approval') {
            return NextResponse.redirect(new URL('/pending-approval', req.url))
          }
          break

        case 'REJECTED':
          // Usuários rejeitados são redirecionados para página de conta rejeitada
          if (currentPath !== '/account-rejected') {
            return NextResponse.redirect(new URL('/account-rejected', req.url))
          }
          break

        case 'SUSPENDED':
          // Usuários suspensos são redirecionados para página de conta suspensa
          if (currentPath !== '/account-suspended') {
            return NextResponse.redirect(new URL('/account-suspended', req.url))
          }
          break

        case 'APPROVED':
          // Usuários aprovados têm acesso livre
          // Se estão em páginas de estado, redirecionar para home
          if (['/pending-approval', '/account-rejected', '/account-suspended'].includes(currentPath)) {
            return NextResponse.redirect(new URL('/', req.url))
          }
          break

        default:
          // Se não tem status definido, assumir como PENDING
          if (currentPath !== '/pending-approval') {
            return NextResponse.redirect(new URL('/pending-approval', req.url))
          }
          break
      }
    }

    // Adicionar headers com informações do usuário para uso nas API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', userId)
    requestHeaders.set('x-approval-status', approvalStatus || 'PENDING')
    requestHeaders.set('x-user-role', userRole || 'USER')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Pular arquivos estáticos e internos do Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre executar para rotas de API
    '/(api|trpc)(.*)',
  ],
} 