#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

async function fixUserRole() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Corrigindo role do usuário admin...\n')
    
    const targetClerkId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB'
    
    // 1. Verificar usuário atual
    console.log('1️⃣ Verificando usuário atual...')
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: targetClerkId }
    })
    
    if (!currentUser) {
      console.log('❌ Usuário não encontrado!')
      return
    }
    
    console.log(`   📧 Email: ${currentUser.email}`)
    console.log(`   🎭 Role atual: ${currentUser.role}`)
    console.log(`   ✅ Status: ${currentUser.approvalStatus}`)
    
    // 2. Atualizar role para ADMIN
    console.log('\n2️⃣ Atualizando role para ADMIN...')
    
    const updatedUser = await prisma.user.update({
      where: { clerkId: targetClerkId },
      data: { 
        role: 'ADMIN',
        approvalStatus: 'APPROVED' // garantir que está aprovado também
      }
    })
    
    console.log('   ✅ Role atualizado com sucesso!')
    console.log(`   🎭 Novo role: ${updatedUser.role}`)
    console.log(`   ✅ Status: ${updatedUser.approvalStatus}`)
    
    // 3. Verificar outros usuários
    console.log('\n3️⃣ Verificando todos os usuários...')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true,
        clerkId: true
      }
    })
    
    console.log('\n📋 Lista de usuários:')
    allUsers.forEach((user, index) => {
      const isTargetUser = user.clerkId === targetClerkId
      console.log(`   ${index + 1}. ${user.email}`)
      console.log(`      🎭 Role: ${user.role} ${isTargetUser ? '👑' : ''}`)
      console.log(`      ✅ Status: ${user.approvalStatus}`)
      console.log(`      🆔 Clerk: ${user.clerkId}`)
      console.log('')
    })
    
    console.log('✅ Correção concluída!')
    console.log('\n🔄 Próximos passos:')
    console.log('   1. Sincronizar metadata no Clerk')
    console.log('   2. Testar middleware')
    console.log('   3. Usuário deve fazer logout/login')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixUserRole()
}

module.exports = fixUserRole 