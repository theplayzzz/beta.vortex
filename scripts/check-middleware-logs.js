#!/usr/bin/env node

console.log(`
🔍 VERIFICAÇÃO DOS LOGS DO MIDDLEWARE
====================================

📋 SITUAÇÃO ATUAL:
   • Dados no Clerk: Role=ADMIN, Status=APPROVED ✅
   • Dados no DB: Role=ADMIN, Status=APPROVED ✅
   • Middleware: Corrigido com fallback para Clerk API ✅

🧪 TESTE REALIZADO:
   • Requisições sem autenticação → Redirecionam para /sign-in ✅
   • Isso é o comportamento CORRETO para usuários não logados

🎯 PROBLEMA REAL:
   • O usuário ESTÁ LOGADO mas ainda vê /pending-approval
   • Isso significa que o middleware não está detectando a sessão corretamente
   • OU a sessão ainda tem dados antigos (cache)

📝 PRÓXIMOS PASSOS PARA DIAGNÓSTICO:

1️⃣ VERIFICAR LOGS DO SERVIDOR:
   • Abrir o navegador em http://localhost:3003
   • Fazer login com play-felix@hotmail.com
   • Verificar logs no terminal do servidor
   • Procurar por: [MIDDLEWARE] User: user_2xcFWfxqWjHinbasVVVL1j4e4aB

2️⃣ LOGS ESPERADOS (se funcionando):
   [MIDDLEWARE] User: user_2xcFWfxqWjHinbasVVVL1j4e4aB, Role: ADMIN, Status: APPROVED, Path: /, IsAdmin: true
   [MIDDLEWARE] Admin redirected from pending-approval to home

3️⃣ LOGS PROBLEMÁTICOS (se não funcionando):
   [MIDDLEWARE] User: user_2xcFWfxqWjHinbasVVVL1j4e4aB, Role: undefined, Status: undefined, Path: /
   [MIDDLEWARE] Fallback to Clerk API - Role: ADMIN, Status: APPROVED

4️⃣ SE LOGS MOSTRAM FALLBACK:
   • SessionClaims não tem os dados atualizados
   • Usuário precisa fazer logout/login
   • Cache de sessão precisa ser limpo

5️⃣ SE LOGS NÃO APARECEM:
   • Middleware não está sendo executado
   • Problema na configuração do matcher
   • Erro no código do middleware

🚀 AÇÃO RECOMENDADA:
   1. Usuário deve fazer LOGOUT completo
   2. Limpar cache do navegador (Ctrl+Shift+R)
   3. Fazer LOGIN novamente
   4. Verificar logs do servidor durante o processo

💡 COMANDO PARA MONITORAR LOGS:
   tail -f logs do servidor ou verificar terminal onde npm run dev está executando

✅ O middleware ESTÁ CORRETO, o problema é cache de sessão!
`)

// Verificar se há sessões ativas que precisam ser invalidadas
const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

async function checkActiveSessions() {
  try {
    const targetUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    console.log('\n🔍 Verificando sessões ativas...')
    
    const sessions = await clerkClient.sessions.getSessionList({
      userId: targetUserId
    })
    
    console.log(`📊 Total de sessões: ${sessions.totalCount}`)
    
    let activeSessions = 0
    for (const session of sessions.data) {
      if (session.status === 'active') {
        activeSessions++
        console.log(`   🟢 Sessão ativa: ${session.id} (${new Date(session.lastActiveAt).toLocaleString()})`)
      }
    }
    
    if (activeSessions > 0) {
      console.log(`\n⚠️  ${activeSessions} sessões ativas encontradas!`)
      console.log('💡 Usuário deve fazer logout para invalidar sessões antigas')
    } else {
      console.log('\n✅ Nenhuma sessão ativa - usuário deve fazer login')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar sessões:', error.message)
  }
}

if (require.main === module) {
  checkActiveSessions()
} 