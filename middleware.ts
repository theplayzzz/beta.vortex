import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/backend'
import { getEnvironment } from '@/utils/approval-system'
import { triggerAutoApprovalCheckEdge } from '@/utils/login-auto-approval-check'

// 🆕 PLAN-028: Cache inteligente otimizado para connection pool
const userStatusCache = new Map<string, {
  approvalStatus: string;
  role: string;
  isAdmin: boolean;
  timestamp: number;
  retryCount?: number;
}>()

const CACHE_TTL = 30000 // 30 segundos - reduzido para dados mais frescos
const MAX_CACHE_SIZE = 1000 // Limitar tamanho do cache

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

// 🆕 PLAN-028: Fallback otimizado com retry e cache inteligente
async function getApprovalStatusDirect(userId: string): Promise<{ approvalStatus: string; role: string; isAdmin: boolean }> {
  try {
    // ⚡ VERIFICAR CACHE PRIMEIRO
    const cached = userStatusCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log('[MIDDLEWARE CACHE] Hit para usuário:', userId);
      return {
        approvalStatus: cached.approvalStatus,
        role: cached.role,
        isAdmin: cached.isAdmin
      };
    }
    
    // 🧹 LIMPEZA DE CACHE: Remover entradas antigas se cache muito grande
    if (userStatusCache.size > MAX_CACHE_SIZE) {
      const oldestEntries = Array.from(userStatusCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(MAX_CACHE_SIZE * 0.3)) // Remove 30% das mais antigas
      
      oldestEntries.forEach(([key]) => userStatusCache.delete(key))
      console.log(`[MIDDLEWARE CACHE] Limpeza: removidas ${oldestEntries.length} entradas antigas`)
    }
    
    // 🔥 CACHE MISS: Consultar Clerk API com retry
    console.log('[MIDDLEWARE CACHE] Miss para usuário:', userId);
    
    // Importar retry utility dinamicamente
    const { withRetry } = await import('./utils/retry-mechanism');
    
    const result = await withRetry(async () => {
      const clerkClient = createClerkClient({ 
        secretKey: process.env.CLERK_SECRET_KEY! 
      });
      
      const user = await clerkClient.users.getUser(userId);
      const metadata = user.publicMetadata as any;
      
      return {
        approvalStatus: metadata?.approvalStatus || 'PENDING',
        role: metadata?.role || 'USER',
        isAdmin: metadata?.role === 'ADMIN' || metadata?.role === 'SUPER_ADMIN'
      };
    }, {
      maxRetries: 2,
      baseDelay: 1000,
      retryCondition: (error) => 
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.status >= 500
    });
    
    // ⚡ SALVAR NO CACHE
    userStatusCache.set(userId, {
      ...result,
      timestamp: now,
      retryCount: 0
    });
    
    console.log('[MIDDLEWARE FALLBACK] Direct Clerk query successful:', {
      userId,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
    return result;
    
  } catch (error) {
    console.error('[MIDDLEWARE FALLBACK] All attempts failed:', error);
    
    // 🛡️ FALLBACK GRACIOSO: Usar cache expirado se disponível
    const staleCache = userStatusCache.get(userId);
    if (staleCache) {
      console.warn('[MIDDLEWARE FALLBACK] Usando cache expirado devido a erro:', userId);
      return {
        approvalStatus: staleCache.approvalStatus,
        role: staleCache.role,
        isAdmin: staleCache.isAdmin
      };
    }
    
    // 🛡️ ÚLTIMO RECURSO: Status seguro
    return {
      approvalStatus: 'PENDING',
      role: 'USER',
      isAdmin: false
    };
  }
}

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
    let approvalStatus = publicMetadata.approvalStatus || 'PENDING'
    let userRole = publicMetadata.role || 'USER'
    let isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    
    // 🚀 FALLBACK: Se sessionClaims estão vazios, consultar Clerk diretamente
    if (Object.keys(publicMetadata).length === 0 || !approvalStatus || approvalStatus === 'PENDING') {
      console.log('[MIDDLEWARE] sessionClaims vazios, usando fallback direto ao Clerk');
      
      const directStatus = await getApprovalStatusDirect(userId);
      approvalStatus = directStatus.approvalStatus;
      userRole = directStatus.role;
      isAdmin = directStatus.isAdmin;
      
      console.log('[MIDDLEWARE] Fallback result:', {
        userId,
        approvalStatus,
        userRole,
        isAdmin,
        currentPath
      });
    }
    
    // 🔍 DEBUG: Log detalhado para identificar problema
    console.log('[MIDDLEWARE DEBUG]', {
      userId,
      currentPath,
      hasSessionClaims: !!sessionClaims,
      publicMetadata,
      approvalStatus,
      userRole,
      isAdmin,
      usedFallback: Object.keys(publicMetadata).length === 0,
      timestamp: new Date().toISOString()
    })
    
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

    // 🆕 PLAN-025: Para usuários PENDING, agendar verificação diretamente (sem HTTP)
    if (approvalStatus === 'PENDING') {
      // 🛡️ Fire and forget: Não aguardar para não bloquear middleware
      triggerAutoApprovalCheckEdge(userId, req.nextUrl.origin)
    }

    // ⚡ ULTRA-FAST: Retorno sem headers extras para performance máxima
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // ⚡ OTIMIZADO: Matcher simples que funciona com Next.js
    '/((?!api/webhooks|api/health|api/external|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}