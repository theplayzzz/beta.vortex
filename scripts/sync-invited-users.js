require('dotenv').config({ path: '.env.local' });
const { clerkClient } = require('@clerk/nextjs/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🚨 PROTEÇÕES DE SEGURANÇA CONTRA EXECUÇÃO EM MASSA
const SECURITY_CHECKS = {
  MAX_USERS_PER_EXECUTION: 10, // Máximo 10 usuários por execução
  REQUIRE_CONFIRMATION: true,  // Exigir confirmação manual
  DRY_RUN_MODE: true,         // Modo simulação por padrão
  ADMIN_EMAIL_REQUIRED: true  // Exigir email do admin
};

// Configuração das chaves
const DEV_CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY_LEGACY;
const PROD_CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Função para criar cliente Clerk com chave específica
function createClerkClient(secretKey) {
  return clerkClient({ secretKey });
}

// 🛡️ FUNÇÃO DE VERIFICAÇÃO DE SEGURANÇA
async function performSecurityChecks() {
  console.log('🔒 ===== VERIFICAÇÕES DE SEGURANÇA =====');
  
  // 1. Verificar se é modo dry-run
  const isDryRun = process.argv.includes('--dry-run') || SECURITY_CHECKS.DRY_RUN_MODE;
  if (isDryRun) {
    console.log('✅ Modo simulação ativado - nenhuma alteração será feita');
  } else {
    console.log('⚠️ MODO PRODUÇÃO - alterações reais serão feitas!');
  }
  
  // 2. Verificar email do administrador
  const adminEmail = process.env.ADMIN_EMAIL || process.argv.find(arg => arg.startsWith('--admin='))?.split('=')[1];
  if (SECURITY_CHECKS.ADMIN_EMAIL_REQUIRED && !adminEmail) {
    throw new Error('🚨 Email do administrador é obrigatório. Use: --admin=seu@email.com');
  }
  
  // 3. Verificar limite de usuários
  const maxUsers = parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || SECURITY_CHECKS.MAX_USERS_PER_EXECUTION;
  if (maxUsers > 50) {
    throw new Error('🚨 Limite máximo de 50 usuários por execução para segurança');
  }
  
  // 4. Verificar sincronizações recentes
  const recentSyncs = await prisma.user.count({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
      }
    }
  });
  
  if (recentSyncs > 20) {
    throw new Error(`🚨 Muitas sincronizações recentes detectadas (${recentSyncs}). Aguarde 10 minutos antes de executar novamente.`);
  }
  
  console.log(`✅ Verificações de segurança aprovadas`);
  console.log(`📊 Configuração: maxUsers=${maxUsers}, dryRun=${isDryRun}, admin=${adminEmail || 'N/A'}`);
  
  return { isDryRun, adminEmail, maxUsers };
}

// 🔒 FUNÇÃO DE CONFIRMAÇÃO MANUAL
async function requireManualConfirmation(config) {
  if (!SECURITY_CHECKS.REQUIRE_CONFIRMATION || config.isDryRun) {
    return true;
  }
  
  console.log('\n🚨 ===== CONFIRMAÇÃO OBRIGATÓRIA =====');
  console.log('⚠️ ATENÇÃO: Este script irá modificar dados reais!');
  console.log(`📊 Máximo de ${config.maxUsers} usuários serão processados`);
  console.log(`👨‍💼 Administrador: ${config.adminEmail}`);
  console.log('\n❓ Tem certeza que deseja continuar? (digite "CONFIRMO" para prosseguir)');
  
  // Aguardar input do usuário
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      if (answer.trim().toUpperCase() === 'CONFIRMO') {
        console.log('✅ Confirmação recebida, prosseguindo...\n');
        resolve(true);
      } else {
        console.log('❌ Confirmação não recebida, cancelando execução.');
        resolve(false);
      }
    });
  });
}

async function syncInvitedUsers() {
  try {
    // 🔒 VERIFICAÇÕES DE SEGURANÇA OBRIGATÓRIAS
    const config = await performSecurityChecks();
    
    // 🔒 CONFIRMAÇÃO MANUAL OBRIGATÓRIA
    const confirmed = await requireManualConfirmation(config);
    if (!confirmed) {
      console.log('🛑 Execução cancelada pelo usuário.');
      return { cancelled: true };
    }
    
    console.log('🔄 ===== SINCRONIZAÇÃO SEGURA DE USUÁRIOS =====');
    console.log('🎯 Objetivo: Sincronizar usuários individuais que aceitaram convites');
    console.log('🔒 Modo: INDIVIDUAL E SEGURO (máx. 10 usuários por vez)');
    console.log('');

    // 1. Buscar usuários no Clerk Production (LIMITADO)
    console.log('🚀 1. Buscando usuários no Clerk PRODUÇÃO (limitado)...');
    const prodClerkClient = createClerkClient(PROD_CLERK_SECRET_KEY);
    const prodUserList = await prodClerkClient.users.getUserList({ limit: config.maxUsers });
    const prodUsers = Array.isArray(prodUserList) ? prodUserList : (prodUserList?.data || []);
    console.log(`👥 Total de usuários no PROD (limitado): ${prodUsers.length}`);

    // 2. Buscar usuários no banco de dados
    console.log('\n💾 2. Buscando usuários no BANCO DE DADOS...');
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        approvalStatus: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        _count: {
          select: {
            Client: true,
            StrategicPlanning: true,
            CommercialProposal: true
          }
        }
      }
    });
    console.log(`💾 Total de usuários no banco: ${dbUsers.length}`);

    // 3. Processar usuários individualmente e com segurança
    console.log('\n🔄 3. PROCESSAMENTO INDIVIDUAL E SEGURO:');
    console.log('═'.repeat(80));
    
    let processedCount = 0;
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const syncResults = [];

    // 🔒 PROCESSAR APENAS USUÁRIOS ESPECÍFICOS OU POUCOS
    const usersToProcess = prodUsers.slice(0, config.maxUsers);
    
    for (const prodUser of usersToProcess) {
      processedCount++;
      const email = prodUser.emailAddresses?.[0]?.emailAddress;
      
      if (!email) {
        console.log(`⚠️ ${processedCount}. Usuário ${prodUser.id} - sem email, pulando`);
        skippedCount++;
        continue;
      }
      
      console.log(`\n👤 ${processedCount}. ${email} (ID Prod: ${prodUser.id})`);
      
      // Buscar usuário no banco de dados por email
      const dbUser = dbUsers.find(db => db.email.toLowerCase() === email.toLowerCase());
      
      if (!dbUser) {
        console.log(`   ❌ Usuário não encontrado no banco de dados - pulando por segurança`);
        skippedCount++;
        continue;
      }
      
      console.log(`   💾 Usuário encontrado no banco: ${dbUser.id}`);
      console.log(`   📊 Dados: ${dbUser._count.Client} clientes, ${dbUser._count.StrategicPlanning} planejamentos, ${dbUser._count.CommercialProposal} propostas`);
      
      // Verificar se precisa sincronizar
      const needsSync = dbUser.clerkId !== prodUser.id;
      
      if (!needsSync) {
        console.log(`   ✅ Já sincronizado, pulando`);
        skippedCount++;
        continue;
      }
      
      console.log(`   🔄 Sincronização necessária: ${dbUser.clerkId} -> ${prodUser.id}`);
      
      // 🔒 MODO DRY-RUN: Apenas simular
      if (config.isDryRun) {
        console.log(`   🧪 [DRY-RUN] Simulando sincronização - nenhuma alteração feita`);
        syncResults.push({
          email,
          action: 'DRY_RUN_SYNC',
          prodClerkId: prodUser.id,
          oldClerkId: dbUser.clerkId,
          dbUserId: dbUser.id,
          dataPreserved: `${dbUser._count.Client} clientes, ${dbUser._count.StrategicPlanning} planejamentos`
        });
        syncedCount++;
        continue;
      }
      
      // 🔒 SINCRONIZAÇÃO REAL (apenas se não for dry-run)
      try {
        console.log(`   🔒 Executando sincronização segura...`);
        
        // Usar a função segura de sincronização
        const { syncUserWithDatabase } = require('../lib/auth/user-sync');
        const result = await syncUserWithDatabase(prodUser.id);
        
        if (result) {
          console.log(`   ✅ Sincronização segura concluída: ${result}`);
          syncedCount++;
          syncResults.push({
            email,
            action: 'SAFE_SYNC',
            prodClerkId: prodUser.id,
            oldClerkId: dbUser.clerkId,
            dbUserId: result,
            dataPreserved: `${dbUser._count.Client} clientes, ${dbUser._count.StrategicPlanning} planejamentos`
          });
        } else {
          throw new Error('Sincronização segura retornou null');
        }
        
      } catch (syncError) {
        console.log(`   ❌ Erro na sincronização segura: ${syncError.message}`);
        errorCount++;
        
        syncResults.push({
          email,
          action: 'ERROR',
          error: syncError.message
        });
      }
      
      // 🔒 Delay obrigatório entre sincronizações para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
    }

    // 4. Resumo final
    console.log('\n🏆 ===== RESUMO DA SINCRONIZAÇÃO SEGURA =====');
    console.log(`📊 Total de usuários processados: ${processedCount}`);
    console.log(`✅ Usuários sincronizados: ${syncedCount}`);
    console.log(`⚠️ Usuários pulados: ${skippedCount}`);
    console.log(`❌ Usuários com erro: ${errorCount}`);
    console.log(`🔒 Modo de execução: ${config.isDryRun ? 'DRY-RUN (simulação)' : 'PRODUÇÃO (real)'}`);
    console.log('');

    if (syncResults.length > 0) {
      console.log('📋 DETALHES DOS RESULTADOS:');
      syncResults.forEach((result, index) => {
        const actionIcon = result.action === 'SAFE_SYNC' ? '🔒' : result.action === 'DRY_RUN_SYNC' ? '🧪' : '❌';
        console.log(`   ${index + 1}. ${actionIcon} ${result.email}`);
        
        if (result.action === 'SAFE_SYNC' || result.action === 'DRY_RUN_SYNC') {
          console.log(`      🔗 ${result.oldClerkId} -> ${result.prodClerkId}`);
          console.log(`      💾 Dados preservados: ${result.dataPreserved}`);
        } else if (result.action === 'ERROR') {
          console.log(`      ❌ Erro: ${result.error}`);
        }
      });
    }

    return {
      processed: processedCount,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount,
      results: syncResults,
      dryRun: config.isDryRun,
      admin: config.adminEmail
    };

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função auxiliar para atualizar metadados do Clerk
async function updateClerkMetadata(clerkClient, userId, metadata) {
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...metadata,
        lastSyncedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.log(`   ⚠️ Erro ao atualizar metadados do Clerk: ${error.message}`);
    // Não falhar por causa dos metadados
  }
}

// 🔒 EXECUÇÃO PROTEGIDA
if (require.main === module) {
  console.log('🔒 ===== SCRIPT DE SINCRONIZAÇÃO SEGURA =====');
  console.log('⚠️ Este script agora possui proteções contra execução em massa');
  console.log('📖 Uso:');
  console.log('   node scripts/sync-invited-users.js --dry-run --admin=seu@email.com --max=5');
  console.log('   node scripts/sync-invited-users.js --admin=seu@email.com --max=10');
  console.log('');
  
  syncInvitedUsers()
    .then((result) => {
      if (result.cancelled) {
        console.log('🛑 Execução cancelada pelo usuário.');
        process.exit(0);
      }
      
      console.log('\n🎉 Sincronização segura concluída!');
      console.log(`✅ ${result.synced} usuários processados`);
      console.log(`❌ ${result.errors} usuários com erro`);
      console.log(`🔒 Modo: ${result.dryRun ? 'DRY-RUN (simulação)' : 'PRODUÇÃO (real)'}`);
      console.log(`👨‍💼 Admin: ${result.admin || 'N/A'}`);
      
      if (result.dryRun) {
        console.log('\n💡 Para executar as alterações reais, remova --dry-run');
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na sincronização:', error.message);
      console.error('🔒 Script interrompido por medida de segurança');
      process.exit(1);
    });
}

module.exports = { syncInvitedUsers }; 