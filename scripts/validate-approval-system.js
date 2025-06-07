#!/usr/bin/env node

/**
 * VALIDAÇÃO FINAL: Sistema de Aprovação
 * Confirma que todo o sistema está funcionando corretamente
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function validateApprovalSystem() {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('✅ VALIDAÇÃO FINAL - SISTEMA DE APROVAÇÃO');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  let score = 0;
  const maxScore = 20;

  try {
    // 1. Verificar configurações básicas
    console.log('1️⃣ CONFIGURAÇÕES BÁSICAS');
    console.log('-'.repeat(40));
    
    const envVars = {
      clerkSecret: !!process.env.CLERK_SECRET_KEY,
      clerkWebhook: !!process.env.CLERK_WEBHOOK_SECRET,
      clerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      database: !!process.env.DATABASE_URL
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: Configurado`);
        score += 1;
      } else {
        console.log(`   ❌ ${key}: Ausente`);
      }
    });

    // 2. Verificar banco de dados
    console.log('\n2️⃣ BANCO DE DADOS');
    console.log('-'.repeat(40));
    
    try {
      const totalUsers = await prisma.user.count();
      const approvedUsers = await prisma.user.count({
        where: { approvalStatus: 'APPROVED' }
      });
      
      console.log(`   ✅ Conexão com banco: OK`);
      console.log(`   ✅ Total de usuários: ${totalUsers}`);
      console.log(`   ✅ Usuários aprovados: ${approvedUsers}`);
      score += 3;
      
    } catch (dbError) {
      console.log(`   ❌ Erro no banco: ${dbError.message}`);
    }

    // 3. Verificar sincronização Clerk ↔ Banco
    console.log('\n3️⃣ SINCRONIZAÇÃO CLERK ↔ BANCO');
    console.log('-'.repeat(40));
    
    const dbUsers = await prisma.user.findMany({
      select: { clerkId: true, email: true, approvalStatus: true }
    });
    
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
    
    const dbCount = dbUsers.length;
    const clerkCount = clerkUsers.data.length;
    
    if (dbCount === clerkCount) {
      console.log(`   ✅ Contagens iguais: ${dbCount} usuários`);
      score += 2;
    } else {
      console.log(`   ⚠️  Diferença: Banco=${dbCount}, Clerk=${clerkCount}`);
    }
    
    // Verificar IDs
    const dbClerkIds = new Set(dbUsers.map(u => u.clerkId));
    const clerkIds = new Set(clerkUsers.data.map(u => u.id));
    
    const missingInDb = clerkUsers.data.filter(u => !dbClerkIds.has(u.id));
    const missingInClerk = dbUsers.filter(u => !clerkIds.has(u.clerkId));
    
    if (missingInDb.length === 0 && missingInClerk.length === 0) {
      console.log(`   ✅ IDs sincronizados: Todos os usuários presentes em ambos`);
      score += 2;
    } else {
      console.log(`   ❌ Dessincronização detectada:`);
      console.log(`      Ausentes no banco: ${missingInDb.length}`);
      console.log(`      Ausentes no Clerk: ${missingInClerk.length}`);
    }

    // 4. Verificar metadata consistency
    console.log('\n4️⃣ CONSISTÊNCIA DE METADATA');
    console.log('-'.repeat(40));
    
    let metadataConsistent = 0;
    
    for (const dbUser of dbUsers) {
      try {
        const clerkUser = await clerkClient.users.getUser(dbUser.clerkId);
        const clerkStatus = clerkUser.publicMetadata?.approvalStatus;
        
        if (clerkStatus === dbUser.approvalStatus) {
          metadataConsistent++;
        } else {
          console.log(`   ⚠️  ${dbUser.email}: DB=${dbUser.approvalStatus}, Clerk=${clerkStatus}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao verificar ${dbUser.email}: ${error.message}`);
      }
    }
    
    if (metadataConsistent === dbUsers.length) {
      console.log(`   ✅ Metadata consistente: ${metadataConsistent}/${dbUsers.length} usuários`);
      score += 3;
    } else {
      console.log(`   ⚠️  Metadata inconsistente: ${metadataConsistent}/${dbUsers.length} usuários`);
      score += Math.floor((metadataConsistent / dbUsers.length) * 3);
    }

    // 5. Verificar sistema de aprovação
    console.log('\n5️⃣ SISTEMA DE APROVAÇÃO');
    console.log('-'.repeat(40));
    
    const statusCounts = await prisma.user.groupBy({
      by: ['approvalStatus'],
      _count: { id: true }
    });
    
    statusCounts.forEach(status => {
      console.log(`   ${status.approvalStatus}: ${status._count.id} usuários`);
    });
    
    const approvalRequired = process.env.APPROVAL_REQUIRED === 'true';
    const defaultStatus = process.env.DEFAULT_USER_STATUS || 'PENDING';
    
    console.log(`   Aprovação obrigatória: ${approvalRequired ? 'SIM' : 'NÃO'}`);
    console.log(`   Status padrão: ${defaultStatus}`);
    
    // Se approval não é obrigatório, todos devem estar aprovados
    if (!approvalRequired) {
      const allApproved = dbUsers.every(u => u.approvalStatus === 'APPROVED');
      if (allApproved) {
        console.log(`   ✅ Configuração correta: Todos aprovados automaticamente`);
        score += 2;
      } else {
        console.log(`   ⚠️  Alguns usuários não estão aprovados (esperado: todos)`);
      }
    } else {
      console.log(`   ✅ Sistema de aprovação manual ativo`);
      score += 2;
    }

    // 6. Verificar middleware e rotas
    console.log('\n6️⃣ MIDDLEWARE E ROTAS');
    console.log('-'.repeat(40));
    
    const fs = require('fs');
    
    try {
      const middlewareContent = fs.readFileSync('./middleware.ts', 'utf8');
      
      if (middlewareContent.includes('approvalStatus') && 
          middlewareContent.includes('pending-approval')) {
        console.log(`   ✅ Middleware configurado para sistema de aprovação`);
        score += 1;
      } else {
        console.log(`   ⚠️  Middleware pode não estar configurado corretamente`);
      }
      
      // Verificar se páginas de status existem
      const pages = [
        './app/pending-approval/page.tsx',
        './app/account-rejected/page.tsx'
      ];
      
      pages.forEach(page => {
        if (fs.existsSync(page)) {
          console.log(`   ✅ ${page}: Existe`);
          score += 0.5;
        } else {
          console.log(`   ❌ ${page}: Ausente`);
        }
      });
      
    } catch (error) {
      console.log(`   ❌ Erro ao verificar arquivos: ${error.message}`);
    }

    // 7. Resultado final
    console.log('\n7️⃣ RESULTADO FINAL');
    console.log('-'.repeat(40));
    
    const percentage = Math.round((score / maxScore) * 100);
    
    console.log(`   Pontuação: ${score}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log(`   🎉 EXCELENTE: Sistema funcionando perfeitamente!`);
    } else if (percentage >= 75) {
      console.log(`   ✅ BOM: Sistema funcionando bem com pequenos ajustes`);
    } else if (percentage >= 50) {
      console.log(`   ⚠️  MÉDIO: Sistema funcional mas precisa de melhorias`);
    } else {
      console.log(`   ❌ CRÍTICO: Sistema precisa de correções urgentes`);
    }

    // 8. Instruções para o usuário
    console.log('\n8️⃣ INSTRUÇÕES PARA O USUÁRIO');
    console.log('-'.repeat(40));
    console.log('');
    console.log('🔐 COMO TESTAR O SISTEMA:');
    console.log('1. Acesse a aplicação em modo incógnito');
    console.log('2. Faça login com qualquer dos usuários:');
    
    dbUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Status: ${user.approvalStatus})`);
    });
    
    console.log('');
    console.log('✅ RESULTADO ESPERADO:');
    if (!approvalRequired) {
      console.log('• Usuário deve ser redirecionado para a página principal (/)');
      console.log('• NÃO deve ver a página /pending-approval');
      console.log('• Deve ter acesso completo ao sistema');
    } else {
      console.log('• Usuários APPROVED: acesso completo');
      console.log('• Usuários PENDING: redirecionados para /pending-approval');
      console.log('• Usuários REJECTED: redirecionados para /account-rejected');
    }
    
    console.log('');
    console.log('🚨 SE PROBLEMA PERSISTIR:');
    console.log('1. Executar: node scripts/fix-session-cache.js');
    console.log('2. Usuário deve fazer logout/login completo');
    console.log('3. Limpar cookies do navegador');
    console.log('4. Verificar console do navegador para erros');

    return {
      score,
      maxScore,
      percentage,
      status: percentage >= 90 ? 'excellent' : 
              percentage >= 75 ? 'good' : 
              percentage >= 50 ? 'fair' : 'critical'
    };

  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    return { score: 0, maxScore, percentage: 0, status: 'error', error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar validação
if (require.main === module) {
  validateApprovalSystem()
    .then(result => {
      console.log(`\n🏁 VALIDAÇÃO CONCLUÍDA: ${result.status.toUpperCase()}`);
      process.exit(result.status === 'error' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Falha na validação:', error.message);
      process.exit(1);
    });
}

module.exports = { validateApprovalSystem }; 