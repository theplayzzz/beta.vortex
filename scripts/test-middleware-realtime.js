#!/usr/bin/env node

const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

async function testMiddlewareRealtime() {
  try {
    console.log('🧪 Teste em Tempo Real do Middleware\n')
    
    const targetUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // 1. Verificar dados atuais no Clerk
    console.log('1️⃣ Verificando dados no Clerk...')
    const user = await clerkClient.users.getUser(targetUserId)
    
    console.log(`   📧 Email: ${user.emailAddresses[0]?.emailAddress}`)
    console.log(`   🎭 Role: ${user.publicMetadata.role}`)
    console.log(`   ✅ Status: ${user.publicMetadata.approvalStatus}`)
    
    // 2. Verificar dados no banco
    console.log('\n2️⃣ Verificando dados no banco...')
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: targetUserId }
      })
      
      if (dbUser) {
        console.log(`   📧 Email: ${dbUser.email}`)
        console.log(`   🎭 Role: ${dbUser.role}`)
        console.log(`   ✅ Status: ${dbUser.approvalStatus}`)
      }
      
      // 3. Simular lógica do middleware
      console.log('\n3️⃣ Simulando lógica do middleware...')
      
      const clerkRole = user.publicMetadata.role
      const clerkStatus = user.publicMetadata.approvalStatus
      const dbRole = dbUser?.role
      const dbStatus = dbUser?.approvalStatus
      
      const isAdminClerk = clerkRole === 'ADMIN' || clerkRole === 'SUPER_ADMIN'
      const isAdminDB = dbRole === 'ADMIN' || dbRole === 'SUPER_ADMIN'
      
      console.log(`   🔍 Clerk: Role=${clerkRole}, Status=${clerkStatus}, IsAdmin=${isAdminClerk}`)
      console.log(`   🔍 DB: Role=${dbRole}, Status=${dbStatus}, IsAdmin=${isAdminDB}`)
      
      // 4. Resultado esperado do middleware
      console.log('\n4️⃣ Resultado esperado do middleware:')
      
      if (isAdminClerk || isAdminDB) {
        console.log('   ✅ ADMIN detectado - deve bypassar approval')
        console.log('   🎯 Se em /pending-approval → redirecionar para /')
        console.log('   🎯 Acesso livre a todas as rotas')
      } else if (clerkStatus === 'APPROVED' || dbStatus === 'APPROVED') {
        console.log('   ✅ APROVADO detectado - acesso normal')
        console.log('   🎯 Se em /pending-approval → redirecionar para /')
      } else {
        console.log('   ⏳ PENDENTE - deve ficar em /pending-approval')
        console.log('   🎯 Redirecionar para /pending-approval')
      }
      
      // 5. Teste de requisição real
      console.log('\n5️⃣ Testando requisição real...')
      
      const testUrls = [
        'http://localhost:3003/',
        'http://localhost:3003/pending-approval'
      ]
      
      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual'
          })
          
          console.log(`   📍 ${url}:`)
          console.log(`      Status: ${response.status}`)
          
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location')
            console.log(`      Redirect: ${location}`)
          }
          
        } catch (fetchError) {
          console.log(`   ❌ Erro ao testar ${url}: ${fetchError.message}`)
        }
      }
      
    } finally {
      await prisma.$disconnect()
    }
    
    console.log('\n📝 Resumo:')
    console.log('   • Se middleware funcionando: admin deve ir direto para /')
    console.log('   • Se ainda com problema: verificar logs do servidor')
    console.log('   • Usuário deve fazer logout/login para refresh da sessão')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

if (require.main === module) {
  testMiddlewareRealtime()
}

module.exports = testMiddlewareRealtime 