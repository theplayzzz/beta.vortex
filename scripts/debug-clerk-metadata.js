#!/usr/bin/env node

const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

async function debugClerkMetadata() {
  try {
    console.log('🔍 Verificando metadados do Clerk...\n')
    
    const targetUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    
    // Inicializar cliente do Clerk
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // Buscar usuário no Clerk
    const user = await clerkClient.users.getUser(targetUserId)
    
    console.log('📋 Dados do usuário no Clerk:')
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.emailAddresses[0]?.emailAddress}`)
    console.log(`First Name: ${user.firstName}`)
    console.log(`Last Name: ${user.lastName}`)
    console.log(`Created: ${user.createdAt}`)
    console.log(`Updated: ${user.updatedAt}`)
    
    console.log('\n🔧 Metadados públicos:')
    console.log('publicMetadata:', JSON.stringify(user.publicMetadata, null, 2))
    
    console.log('\n🔒 Metadados privados:')
    console.log('privateMetadata:', JSON.stringify(user.privateMetadata, null, 2))
    
    console.log('\n🔓 Metadados inseguros:')
    console.log('unsafeMetadata:', JSON.stringify(user.unsafeMetadata, null, 2))
    
    // Verificar se faltam metadados
    if (!user.publicMetadata.role || !user.publicMetadata.approvalStatus) {
      console.log('\n⚠️  PROBLEMA: Metadados não estão definidos!')
      console.log('Verificando base de dados para obter dados corretos...')
      
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkUserId: targetUserId }
        })
        
        if (dbUser) {
          console.log('\n📊 Dados no banco de dados:')
          console.log(`ID: ${dbUser.id}`)
          console.log(`Clerk ID: ${dbUser.clerkUserId}`)
          console.log(`Email: ${dbUser.email}`)
          console.log(`Role: ${dbUser.role}`)
          console.log(`Status: ${dbUser.approvalStatus}`)
          console.log(`Credits: ${dbUser.credits}`)
          
          console.log('\n🔄 Sincronizando metadados...')
          
          await clerkClient.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
              role: dbUser.role,
              approvalStatus: dbUser.approvalStatus,
              credits: dbUser.credits
            }
          })
          
          console.log('✅ Metadados sincronizados com sucesso!')
          
          // Verificar novamente
          const updatedUser = await clerkClient.users.getUser(targetUserId)
          console.log('\n📋 Novos metadados públicos:')
          console.log(JSON.stringify(updatedUser.publicMetadata, null, 2))
          
        } else {
          console.log('\n❌ Usuário não encontrado no banco de dados!')
        }
        
      } finally {
        await prisma.$disconnect()
      }
    } else {
      console.log('\n✅ Metadados parecem estar corretos')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

if (require.main === module) {
  debugClerkMetadata()
}

module.exports = debugClerkMetadata 