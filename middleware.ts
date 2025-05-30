import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definir rotas públicas que não precisam de autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/proposals/webhook',
  '/api/health'
])

export default clerkMiddleware(async (auth, req) => {
  // Usar try/catch para lidar com warnings de APIs dinâmicas
  let userId = null
  try {
    const authResult = await auth()
    userId = authResult.userId
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

  // Se o usuário está autenticado, sincronizar com o banco de dados
  if (userId) {
    // Adicionar header com userId para uso nas API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', userId)

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