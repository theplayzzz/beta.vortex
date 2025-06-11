import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/backend'

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

// 🚀 CACHE IN-MEMORY PARA MAXIMUM PERFORMANCE
interface UserCache {
  approvalStatus: string;
  role: string;
  isAdmin: boolean;
  timestamp: number;
  source: 'sessionClaims' | 'clerkAPI';
}

const userCache = new Map<string, UserCache>();
const CACHE_TTL = 60000; // 1 minuto de cache
const MAX_CACHE_SIZE = 1000; // Máximo 1000 usuários em cache

// 🧹 Limpeza automática do cache
function cleanCache() {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  for (const [userId, data] of Array.from(userCache.entries())) {
    if (now - data.timestamp > CACHE_TTL) {
      expiredKeys.push(userId);
    }
  }
  
  expiredKeys.forEach(key => userCache.delete(key));
  
  // Se cache muito grande, remover entradas mais antigas
  if (userCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(userCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, userCache.size - MAX_CACHE_SIZE);
    
    entries.forEach(([key]) => userCache.delete(key));
  }
}

// 🚀 FALLBACK OTIMIZADO: Consulta Clerk com cache inteligente
async function getApprovalStatusOptimized(userId: string): Promise<UserCache> {
  // 🏎️ VERIFICAR CACHE PRIMEIRO
  const cached = userCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('[MIDDLEWARE CACHE] Cache hit para userId:', userId);
    return cached;
  }

  try {
    console.log('[MIDDLEWARE FALLBACK] Cache miss, consultando Clerk API para userId:', userId);
    
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY! 
    });
    
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as any;
    
    const result: UserCache = {
      approvalStatus: metadata?.approvalStatus || 'PENDING',
      role: metadata?.role || 'USER',
      isAdmin: metadata?.role === 'ADMIN' || metadata?.role === 'SUPER_ADMIN',
      timestamp: Date.now(),
      source: 'clerkAPI'
    };

    // 🏎️ SALVAR NO CACHE
    userCache.set(userId, result);
    
    // 🧹 Limpeza periódica
    if (Math.random() < 0.1) { // 10% chance de limpeza
      cleanCache();
    }
    
    console.log('[MIDDLEWARE FALLBACK] Resultado cachado:', {
      userId,
      ...result,
      cacheSize: userCache.size
    });
    
    return result;
  } catch (error) {
    console.error('[MIDDLEWARE FALLBACK] Erro ao consultar Clerk:', error);
    
    // Em caso de erro, retornar dados seguros
    const fallbackResult: UserCache = {
      approvalStatus: 'PENDING',
      role: 'USER',
      isAdmin: false,
      timestamp: Date.now(),
      source: 'clerkAPI'
    };
    
    return fallbackResult;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const currentPath = req.nextUrl.pathname
  
  // ⚡ ULTRA-OTIMIZAÇÃO: Pular processamento para rotas estáticas
  if (currentPath.startsWith('/_next') || 
      currentPath.includes('.') ||
      currentPath.startsWith('/api/webhooks') ||
      currentPath.startsWith('/api/external') ||
      currentPath.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // ⚡ VERIFICAR AUTENTICAÇÃO
  let userId = null
  let sessionClaims = null
  
  try {
    const authResult = auth()
    userId = authResult.userId
    sessionClaims = authResult.sessionClaims
  } catch (error) {
    if (isPublicRoute(req)) {
      return NextResponse.next()
    }
    
    if (isApiRoute(req)) {
      return NextResponse.json({ error: 'Erro de autenticação' }, { status: 401 })
    }
    
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (!userId && !isPublicRoute(req)) {
    if (isApiRoute(req)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // 🚀 LÓGICA PRINCIPAL OTIMIZADA
  if (userId) {
    let userStatus: UserCache;
    
    // 🏆 TENTATIVA 1: sessionClaims (ZERO API CALLS - MÁXIMA PERFORMANCE)
    const publicMetadata = (sessionClaims?.publicMetadata as any) || {}
    
    if (Object.keys(publicMetadata).length > 0 && publicMetadata.approvalStatus) {
      // ✅ sessionClaims funcionando - PERFORMANCE MÁXIMA
      userStatus = {
        approvalStatus: publicMetadata.approvalStatus,
        role: publicMetadata.role || 'USER',
        isAdmin: publicMetadata.role === 'ADMIN' || publicMetadata.role === 'SUPER_ADMIN',
        timestamp: Date.now(),
        source: 'sessionClaims'
      };
      
      console.log('[MIDDLEWARE FAST] sessionClaims funcionando:', {
        userId,
        approvalStatus: userStatus.approvalStatus,
        source: 'sessionClaims',
        performance: 'MAXIMUM'
      });
    } else {
      // 🔄 TENTATIVA 2: Fallback com cache (MÍNIMAS API CALLS)
      console.log('[MIDDLEWARE] sessionClaims vazios, usando fallback otimizado');
      userStatus = await getApprovalStatusOptimized(userId);
    }
    
    const { approvalStatus, role, isAdmin } = userStatus;
    
    // ⚡ VERIFICAÇÕES RÁPIDAS
    if (isAdminRoute(req) && !isAdmin) {
      if (isApiRoute(req)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }

    // ⚡ ADMINS: Acesso instantâneo
    if (isAdmin) {
      if (currentPath === '/pending-approval') {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.next()
    }

    // ⚡ USUÁRIOS: Verificação de status
    if (!isPublicRoute(req)) {
      switch (approvalStatus) {
        case 'APPROVED':
          if (['/pending-approval', '/account-rejected', '/account-suspended'].includes(currentPath)) {
            return NextResponse.redirect(new URL('/', req.url))
          }
          break

        case 'REJECTED':
          if (currentPath !== '/account-rejected') {
            return NextResponse.redirect(new URL('/account-rejected', req.url))
          }
          break

        case 'SUSPENDED':
          if (currentPath !== '/account-suspended') {
            return NextResponse.redirect(new URL('/account-suspended', req.url))
          }
          break

        case 'PENDING':
        default:
          if (currentPath !== '/pending-approval') {
            return NextResponse.redirect(new URL('/pending-approval', req.url))
          }
          break
      }
    }

    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 