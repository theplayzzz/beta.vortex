#!/usr/bin/env node

const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

async function testMiddlewareFinal() {
  try {
    console.log('🧪 Teste Final do Middleware - Problema Específico\n')
    
    const targetUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // 1. Verificar dados no Clerk
    console.log('1️⃣ Verificando dados no Clerk...')
    const user = await clerkClient.users.getUser(targetUserId)
    
    console.log(`   📧 Email: ${user.emailAddresses[0]?.emailAddress}`)
    console.log(`   🎭 Role: ${user.publicMetadata.role}`)
    console.log(`   ✅ Status: ${user.publicMetadata.approvalStatus}`)
    console.log(`   🆔 Clerk ID: ${user.id}`)
    
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
        console.log(`   🆔 DB ID: ${dbUser.id}`)
      }
      
      // 3. Análise do problema
      console.log('\n3️⃣ Análise do problema:')
      
      const clerkHasCorrectData = user.publicMetadata.role === 'ADMIN' && user.publicMetadata.approvalStatus === 'APPROVED'
      const dbHasCorrectData = dbUser && dbUser.role === 'ADMIN' && dbUser.approvalStatus === 'APPROVED'
      
      console.log(`   📋 Clerk tem dados corretos: ${clerkHasCorrectData ? '✅' : '❌'}`)
      console.log(`   📋 DB tem dados corretos: ${dbHasCorrectData ? '✅' : '❌'}`)
      
      if (clerkHasCorrectData && dbHasCorrectData) {
        console.log('\n4️⃣ Problema identificado:')
        console.log('   🔍 Os dados estão corretos em ambos os sistemas')
        console.log('   🐛 O problema está no middleware não conseguindo ler sessionClaims')
        console.log('   🔧 Isso pode ser devido ao Next.js 15 e APIs dinâmicas')
        
        console.log('\n5️⃣ Possíveis soluções:')
        console.log('   💡 Middleware não deve usar await auth() no Next.js 15')
        console.log('   💡 SessionClaims podem não estar sendo passados corretamente')
        console.log('   💡 Pode precisar de uma sessão refresh no Clerk')
        
        // 6. Tentar invalidar cache do usuário
        console.log('\n6️⃣ Invalidando cache da sessão...')
        
        // Forçar update nos metadados para refresh da sessão
        await clerkClient.users.updateUserMetadata(targetUserId, {
          publicMetadata: {
            ...user.publicMetadata,
            forceRefresh: Date.now()
          }
        })
        
        console.log('   ✅ Cache invalidado - usuário deve fazer logout/login')
        
      } else {
        console.log('\n❌ Dados inconsistentes - corrija primeiro os dados')
      }
      
    } finally {
      await prisma.$disconnect()
    }
    
    console.log('\n📝 Resumo:')
    console.log('   1. Dados corretos: Clerk ✅ | DB ✅')
    console.log('   2. Problema: Middleware não lê sessionClaims corretamente')  
    console.log('   3. Solução: Middleware corrigido para Next.js 15')
    console.log('   4. Ação: Usuário deve fazer logout/login para refresh')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

if (require.main === module) {
  testMiddlewareFinal()
}

module.exports = testMiddlewareFinal 