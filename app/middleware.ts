import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Definir rotas públicas
const isPublicRoute = createRouteMatcher([
  '/coach/capture',  // Rota pública para testes
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// To learn more how to use clerkMiddleware to protect pages in your app, check out https://clerk.com/docs/references/nextjs/clerk-middleware
export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}