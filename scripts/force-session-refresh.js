#!/usr/bin/env node

const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

async function forceSessionRefresh() {
  try {
    console.log('🔄 Forçando refresh da sessão do usuário...\n')
    
    const targetUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // 1. Atualizar metadados para forçar refresh
    console.log('1️⃣ Forçando update de metadados...')
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        dbUserId: 'cmbmazoja000909yox6gv567p',
        lastForceRefresh: new Date().toISOString(),
        sessionRefreshToken: Date.now()
      }
    })
    console.log('   ✅ Metadados atualizados')
    
    // 2. Listar e invalidar todas as sessões do usuário
    console.log('\n2️⃣ Invalidando sessões ativas...')
    try {
      const sessions = await clerkClient.sessions.getSessionList({
        userId: targetUserId
      })
      
      console.log(`   📋 Encontradas ${sessions.totalCount} sessões`)
      
      for (const session of sessions.data) {
        if (session.status === 'active') {
          console.log(`   🔄 Revogando sessão: ${session.id}`)
          await clerkClient.sessions.revokeSession(session.id)
        }
      }
      
      console.log('   ✅ Todas as sessões foram invalidadas')
      
    } catch (sessionError) {
      console.log('   ⚠️  Erro ao invalidar sessões:', sessionError.message)
      console.log('   💡 Usuário pode precisar fazer logout manual')
    }
    
    // 3. Verificar metadados atualizados
    console.log('\n3️⃣ Verificando metadados finais...')
    const updatedUser = await clerkClient.users.getUser(targetUserId)
    
    console.log('   📋 Metadados atuais:')
    console.log(`      🎭 Role: ${updatedUser.publicMetadata.role}`)
    console.log(`      ✅ Status: ${updatedUser.publicMetadata.approvalStatus}`)
    console.log(`      🔄 Último refresh: ${updatedUser.publicMetadata.lastForceRefresh}`)
    
    console.log('\n✅ Refresh completo!')
    console.log('\n📝 Instruções para o usuário:')
    console.log('   1. 🚪 Fazer LOGOUT da aplicação')
    console.log('   2. 🔄 Limpar cache do navegador (Ctrl+Shift+R)')
    console.log('   3. 🚪 Fazer LOGIN novamente')
    console.log('   4. ✅ Deve ir direto para a página principal')
    
    console.log('\n🧪 Para testar se funcionou:')
    console.log('   node scripts/test-middleware-final.js')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

if (require.main === module) {
  forceSessionRefresh()
}

module.exports = forceSessionRefresh 