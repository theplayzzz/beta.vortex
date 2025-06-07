#!/usr/bin/env node

/**
 * Script de Sincronização Automática Clerk ↔ Supabase
 * 
 * Este script pode ser executado periodicamente para garantir
 * que todos os usuários do Clerk estejam sincronizados no Supabase.
 * 
 * Uso:
 * - node scripts/sync-users-auto.js
 * - npm run sync-users (se adicionado ao package.json)
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

// Importar função de migração
const { migrateExistingUsers } = require('./migrate-existing-users.js');

// Constantes
const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
};

async function checkAndSync() {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  try {
    console.log('🔄 VERIFICAÇÃO AUTOMÁTICA DE SINCRONIZAÇÃO');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // 1. Contar usuários em ambas as plataformas
    const [supabaseUsers, clerkUsers] = await Promise.all([
      prisma.user.findMany({ select: { clerkId: true } }),
      clerkClient.users.getUserList({ limit: 100 })
    ]);
    
    const supabaseCount = supabaseUsers.length;
    const clerkCount = clerkUsers.data.length;
    
    console.log(`\n📊 Status atual:`);
    console.log(`   Usuários no Clerk: ${clerkCount}`);
    console.log(`   Usuários no Supabase: ${supabaseCount}`);
    
    // 2. Verificar se há diferenças
    if (supabaseCount === clerkCount) {
      // Verificar se todos os IDs coincidem
      const existingClerkIds = new Set(supabaseUsers.map(u => u.clerkId));
      const unsyncedUsers = clerkUsers.data.filter(u => !existingClerkIds.has(u.id));
      
      if (unsyncedUsers.length === 0) {
        console.log('✅ Sincronização perfeita! Nenhuma ação necessária.');
        return { status: 'synced', message: 'Todos os usuários estão sincronizados' };
      }
    }
    
    // 3. Há usuários para sincronizar
    const existingClerkIds = new Set(supabaseUsers.map(u => u.clerkId));
    const usersToSync = clerkUsers.data.filter(u => !existingClerkIds.has(u.id));
    
    console.log(`\n⚠️  Encontrados ${usersToSync.length} usuários não sincronizados`);
    
    if (usersToSync.length > 0) {
      console.log('🔗 Usuários que serão sincronizados:');
      usersToSync.forEach((user, index) => {
        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        console.log(`   ${index + 1}. ${email} (${user.id})`);
      });
      
      console.log('\n🚀 Iniciando sincronização automática...');
      
      // Executar migração
      await migrateExistingUsers();
      
      return { 
        status: 'migrated', 
        message: `${usersToSync.length} usuários foram sincronizados com sucesso` 
      };
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    return { 
      status: 'error', 
      message: error.message 
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Função para uso em cron jobs ou APIs
async function syncUsersQuiet() {
  try {
    const result = await checkAndSync();
    return result;
  } catch (error) {
    return { 
      status: 'error', 
      message: error.message 
    };
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  checkAndSync()
    .then(result => {
      console.log(`\n🎉 Processo concluído: ${result?.message || 'Sincronização finalizada'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha na sincronização:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  checkAndSync, 
  syncUsersQuiet 
}; 