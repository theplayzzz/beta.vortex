require('dotenv').config({ path: '.env.local' });
const { clerkClient } = require('@clerk/nextjs/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuração das chaves
const DEV_CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY_LEGACY;
const PROD_CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Função para criar cliente Clerk com chave específica
function createClerkClient(secretKey) {
  return clerkClient({ secretKey });
}

async function syncInvitedUsers() {
  try {
    console.log('🔄 ===== SINCRONIZAÇÃO DE USUÁRIOS CONVIDADOS =====');
    console.log('🎯 Objetivo: Sincronizar usuários que aceitaram convites na produção');
    console.log('📧 Estratégia: Buscar por email e atualizar clerkId + status');
    console.log('');

    // 1. Buscar usuários no Clerk Production
    console.log('🚀 1. Buscando usuários no Clerk PRODUÇÃO...');
    const prodClerkClient = createClerkClient(PROD_CLERK_SECRET_KEY);
    const prodUserList = await prodClerkClient.users.getUserList({ limit: 500 });
    const prodUsers = Array.isArray(prodUserList) ? prodUserList : (prodUserList?.data || []);
    console.log(`👥 Total de usuários no PROD: ${prodUsers.length}`);

    // 2. Buscar usuários no Clerk Development para verificar status de aprovação
    console.log('🔧 2. Buscando usuários no Clerk DESENVOLVIMENTO...');
    let devUsers = [];
    try {
      const devClerkClient = createClerkClient(DEV_CLERK_SECRET_KEY);
      const devUserList = await devClerkClient.users.getUserList({ limit: 500 });
      devUsers = Array.isArray(devUserList) ? devUserList : (devUserList?.data || []);
      console.log(`👥 Total de usuários no DEV: ${devUsers.length}`);
    } catch (error) {
      console.log('⚠️ Erro ao buscar usuários do DEV, continuando apenas com produção...');
    }

    // 3. Buscar todos os usuários no banco de dados
    console.log('\n💾 3. Buscando usuários no BANCO DE DADOS...');
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

    // 4. Sincronizar usuários
    console.log('\n🔄 4. SINCRONIZANDO USUÁRIOS:');
    console.log('═'.repeat(80));
    
    let processedCount = 0;
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const syncResults = [];

    for (const prodUser of prodUsers) {
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
        console.log(`   ❌ Usuário não encontrado no banco de dados`);
        
        // Verificar se existe no desenvolvimento para pegar dados
        const devUser = devUsers.find(dev => 
          dev.emailAddresses?.[0]?.emailAddress?.toLowerCase() === email.toLowerCase()
        );
        
        if (devUser) {
          console.log(`   🔧 Encontrado no DEV, criando registro no banco...`);
          
          try {
            const newDbUser = await prisma.user.create({
              data: {
                clerkId: prodUser.id,
                email: email,
                firstName: prodUser.firstName || devUser.firstName || null,
                lastName: prodUser.lastName || devUser.lastName || null,
                profileImageUrl: prodUser.imageUrl || devUser.imageUrl || null,
                approvalStatus: devUser.publicMetadata?.approvalStatus || 'PENDING',
                role: devUser.publicMetadata?.role || 'USER',
                creditBalance: devUser.publicMetadata?.approvalStatus === 'APPROVED' ? 100 : 0,
                version: 0
              }
            });
            
            console.log(`   ✅ Usuário criado no banco: ${newDbUser.id}`);
            
            // Atualizar metadados no Clerk de produção
            await updateClerkMetadata(prodClerkClient, prodUser.id, {
              dbUserId: newDbUser.id,
              approvalStatus: newDbUser.approvalStatus,
              role: newDbUser.role,
              migratedFromDev: true,
              originalDevId: devUser.id
            });
            
            syncedCount++;
            syncResults.push({
              email,
              action: 'CREATED',
              prodClerkId: prodUser.id,
              devClerkId: devUser.id,
              dbUserId: newDbUser.id,
              status: newDbUser.approvalStatus
            });
            
          } catch (createError) {
            console.log(`   ❌ Erro ao criar usuário: ${createError.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ⚠️ Usuário não encontrado nem no banco nem no DEV - novo usuário`);
          skippedCount++;
        }
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
      
      console.log(`   🔄 Sincronizando: ${dbUser.clerkId} -> ${prodUser.id}`);
      
      // Verificar status no desenvolvimento
      const devUser = devUsers.find(dev => 
        dev.emailAddresses?.[0]?.emailAddress?.toLowerCase() === email.toLowerCase()
      );
      
      let newApprovalStatus = dbUser.approvalStatus;
      let shouldUpdateCredits = false;
      
      if (devUser) {
        const devApprovalStatus = devUser.publicMetadata?.approvalStatus;
        if (devApprovalStatus && devApprovalStatus !== dbUser.approvalStatus) {
          console.log(`   📋 Atualizando status: ${dbUser.approvalStatus} -> ${devApprovalStatus}`);
          newApprovalStatus = devApprovalStatus;
          
          if (devApprovalStatus === 'APPROVED' && dbUser.approvalStatus !== 'APPROVED') {
            shouldUpdateCredits = true;
          }
        }
      }
      
      try {
        // Atualizar banco de dados
        const updateData = {
          clerkId: prodUser.id,
          approvalStatus: newApprovalStatus,
          updatedAt: new Date()
        };
        
        if (shouldUpdateCredits) {
          updateData.creditBalance = 100;
        }
        
        const updatedUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: updateData
        });
        
        console.log(`   ✅ Banco atualizado com sucesso`);
        
        // Atualizar metadados no Clerk de produção
        await updateClerkMetadata(prodClerkClient, prodUser.id, {
          dbUserId: dbUser.id,
          approvalStatus: newApprovalStatus,
          role: dbUser.role,
          syncedFromInvite: true,
          originalDevId: devUser?.id
        });
        
        console.log(`   ✅ Metadados do Clerk atualizados`);
        
        // Criar transação de créditos se necessário
        if (shouldUpdateCredits) {
          await prisma.creditTransaction.create({
            data: {
              userId: dbUser.id,
              amount: 100,
              type: 'INITIAL_GRANT',
              description: 'Créditos concedidos após sincronização de convite aceito'
            }
          });
          console.log(`   💰 Créditos concedidos: 100`);
        }
        
        syncedCount++;
        syncResults.push({
          email,
          action: 'SYNCED',
          prodClerkId: prodUser.id,
          oldClerkId: dbUser.clerkId,
          dbUserId: dbUser.id,
          statusChange: dbUser.approvalStatus !== newApprovalStatus ? `${dbUser.approvalStatus} -> ${newApprovalStatus}` : null,
          creditsGranted: shouldUpdateCredits
        });
        
      } catch (syncError) {
        console.log(`   ❌ Erro na sincronização: ${syncError.message}`);
        errorCount++;
        
        syncResults.push({
          email,
          action: 'ERROR',
          error: syncError.message
        });
      }
      
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Resumo final
    console.log('\n🏆 ===== RESUMO DA SINCRONIZAÇÃO =====');
    console.log(`📊 Total de usuários processados: ${processedCount}`);
    console.log(`✅ Usuários sincronizados: ${syncedCount}`);
    console.log(`⚠️ Usuários pulados: ${skippedCount}`);
    console.log(`❌ Usuários com erro: ${errorCount}`);
    console.log('');

    if (syncResults.length > 0) {
      console.log('📋 DETALHES DOS RESULTADOS:');
      syncResults.forEach((result, index) => {
        const actionIcon = result.action === 'SYNCED' ? '🔄' : result.action === 'CREATED' ? '🆕' : '❌';
        console.log(`   ${index + 1}. ${actionIcon} ${result.email}`);
        
        if (result.action === 'SYNCED') {
          console.log(`      🔗 ${result.oldClerkId} -> ${result.prodClerkId}`);
          if (result.statusChange) {
            console.log(`      📊 Status: ${result.statusChange}`);
          }
          if (result.creditsGranted) {
            console.log(`      💰 Créditos concedidos: 100`);
          }
        } else if (result.action === 'CREATED') {
          console.log(`      🆕 Criado: ${result.prodClerkId} -> DB: ${result.dbUserId}`);
          console.log(`      📊 Status: ${result.status}`);
        } else if (result.action === 'ERROR') {
          console.log(`      ❌ Erro: ${result.error}`);
        }
      });
    }

    // 6. Verificação de integridade
    console.log('\n🔍 ===== VERIFICAÇÃO DE INTEGRIDADE =====');
    const finalDbUsers = await prisma.user.findMany({
      select: { id: true, email: true, clerkId: true, approvalStatus: true }
    });
    
    let syncedUsers = 0;
    let desyncedUsers = 0;
    
    for (const dbUser of finalDbUsers) {
      const prodUser = prodUsers.find(p => 
        p.emailAddresses?.[0]?.emailAddress?.toLowerCase() === dbUser.email.toLowerCase()
      );
      
      if (prodUser && dbUser.clerkId === prodUser.id) {
        syncedUsers++;
      } else if (prodUser) {
        desyncedUsers++;
      }
    }
    
    console.log(`✅ Usuários sincronizados: ${syncedUsers}`);
    console.log(`⚠️ Usuários ainda dessincronizados: ${desyncedUsers}`);
    
    if (desyncedUsers === 0) {
      console.log('🎉 PERFEITO! Todos os usuários estão sincronizados!');
    }

    return {
      processed: processedCount,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount,
      results: syncResults,
      finalStats: { syncedUsers, desyncedUsers }
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

// Executar sincronização
if (require.main === module) {
  syncInvitedUsers()
    .then((result) => {
      console.log('\n🎉 Sincronização de usuários convidados concluída!');
      console.log(`✅ ${result.synced} usuários sincronizados com sucesso`);
      console.log(`❌ ${result.errors} usuários com erro`);
      
      if (result.finalStats.desyncedUsers === 0) {
        console.log('🏆 MISSÃO CUMPRIDA! Todos os usuários estão sincronizados!');
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na sincronização:', error.message);
      process.exit(1);
    });
}

module.exports = { syncInvitedUsers }; 