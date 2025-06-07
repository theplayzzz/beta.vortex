// Carregar variáveis de ambiente
require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

// Definir constantes localmente baseadas no sistema de aprovação
const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
};

// Funções auxiliares locais
function isApprovalRequired() {
  return process.env.APPROVAL_REQUIRED === 'true';
}

function getDefaultUserStatus() {
  const defaultStatus = process.env.DEFAULT_USER_STATUS;
  return defaultStatus || APPROVAL_STATUS.PENDING;
}

function getEnvironment() {
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  return 'development';
}

function logApprovalAction(data) {
  console.log('[APPROVAL_SYSTEM]', JSON.stringify({
    ...data,
    timestamp: data.timestamp.toISOString()
  }));
}

async function migrateExistingUsers() {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  try {
    console.log('🚀 INICIANDO MIGRAÇÃO DE USUÁRIOS EXISTENTES');
    console.log('='.repeat(60));
    
    // 1. Buscar usuários existentes no Supabase
    const existingUsers = await prisma.user.findMany({
      select: { clerkId: true }
    });
    const existingClerkIds = new Set(existingUsers.map(u => u.clerkId));
    
    // 2. Buscar todos os usuários do Clerk
    console.log('🔍 Buscando usuários no Clerk...');
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
    console.log(`Encontrados ${clerkUsers.data.length} usuários no Clerk`);
    
    // 3. Filtrar usuários que não existem no Supabase
    const usersToMigrate = clerkUsers.data.filter(user => !existingClerkIds.has(user.id));
    console.log(`Usuários para migração: ${usersToMigrate.length}`);
    
    if (usersToMigrate.length === 0) {
      console.log('✅ Todos os usuários já estão sincronizados!');
      return;
    }
    
    // 4. Determinar configuração de aprovação
    const approvalRequired = isApprovalRequired();
    const defaultStatus = approvalRequired ? getDefaultUserStatus() : APPROVAL_STATUS.APPROVED;
    
    console.log(`\n⚙️  Configuração de aprovação:`);
    console.log(`   - Aprovação obrigatória: ${approvalRequired ? 'SIM' : 'NÃO'}`);
    console.log(`   - Status padrão: ${defaultStatus}`);
    console.log(`   - Ambiente: ${getEnvironment()}`);
    
    // 5. Migrar cada usuário
    console.log('\n🔄 Iniciando migração...\n');
    
    const results = {
      migrated: [],
      errors: [],
      skipped: []
    };
    
    for (const clerkUser of usersToMigrate) {
      try {
        // Encontrar email principal
        const primaryEmail = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        );
        
        if (!primaryEmail) {
          console.log(`⚠️  Pulando usuário ${clerkUser.id} - sem email principal`);
          results.skipped.push(clerkUser.id);
          continue;
        }
        
        console.log(`📝 Migrando: ${primaryEmail.emailAddress}`);
        
        // Criar usuário no Supabase
        const user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            profileImageUrl: clerkUser.imageUrl || null,
            approvalStatus: defaultStatus,
            creditBalance: defaultStatus === APPROVAL_STATUS.APPROVED ? 100 : 0,
            version: 0,
            updatedAt: new Date(),
          },
        });
        
        // Criar transação de crédito para usuários aprovados
        if (defaultStatus === APPROVAL_STATUS.APPROVED) {
          await prisma.creditTransaction.create({
            data: {
              userId: user.id,
              amount: 100,
              type: 'INITIAL_GRANT',
              description: 'Créditos iniciais - migração de usuário existente',
            },
          });
        }
        
        // Atualizar metadata no Clerk
        try {
          await clerkClient.users.updateUserMetadata(clerkUser.id, {
            publicMetadata: {
              approvalStatus: defaultStatus,
              dbUserId: user.id,
              role: 'USER'
            }
          });
        } catch (metadataError) {
          console.log(`   ⚠️  Erro ao atualizar metadata: ${metadataError.message}`);
        }
        
        // Log de auditoria
        logApprovalAction({
          action: 'USER_MIGRATED',
          userId: user.id,
          moderatorId: 'SYSTEM_MIGRATION',
          environment: getEnvironment(),
          timestamp: new Date(),
          metadata: {
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            migratedStatus: defaultStatus,
            approvalRequired: approvalRequired
          }
        });
        
        console.log(`   ✅ Migrado com status: ${defaultStatus}`);
        results.migrated.push({
          email: primaryEmail.emailAddress,
          clerkId: clerkUser.id,
          userId: user.id,
          status: defaultStatus
        });
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        results.errors.push({
          clerkId: clerkUser.id,
          error: error.message
        });
      }
    }
    
    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO');
    console.log('='.repeat(40));
    console.log(`✅ Migrados: ${results.migrated.length}`);
    console.log(`❌ Erros: ${results.errors.length}`);
    console.log(`⏭️  Pulados: ${results.skipped.length}`);
    
    if (results.migrated.length > 0) {
      console.log('\n👥 Usuários migrados:');
      results.migrated.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.status})`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.clerkId}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Migração concluída!');
    
    // 7. Verificar sincronização final
    console.log('\n🔍 Verificação final...');
    const finalSupabaseCount = await prisma.user.count();
    const finalClerkCount = clerkUsers.data.length;
    
    console.log(`Usuários no Supabase: ${finalSupabaseCount}`);
    console.log(`Usuários no Clerk: ${finalClerkCount}`);
    
    if (finalSupabaseCount === finalClerkCount) {
      console.log('✅ Sincronização completa!');
    } else {
      console.log('⚠️  Ainda há diferenças - verifique os erros acima');
    }
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  migrateExistingUsers();
}

module.exports = { migrateExistingUsers }; 