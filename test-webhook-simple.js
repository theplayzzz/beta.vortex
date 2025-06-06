const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testWebhookSimple() {
  console.log('🧪 TESTE SIMPLES DO WEBHOOK DO CLERK');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar conexão com banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // 2. Contar usuários atuais
    const currentUsers = await prisma.user.count();
    console.log(`📊 Usuários atuais no banco: ${currentUsers}`);

    // 3. Listar usuários existentes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n👥 USUÁRIOS EXISTENTES:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.clerkId}) - ${user.createdAt.toISOString()}`);
    });

    // 4. Testar criação manual de usuário (simulando webhook)
    console.log('\n🔄 SIMULANDO CRIAÇÃO VIA WEBHOOK...');
    
    const testClerkId = `user_test_${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;

    const newUser = await prisma.user.create({
      data: {
        clerkId: testClerkId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: 'https://example.com/avatar.jpg',
        creditBalance: 100,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Usuário criado com sucesso:', {
      id: newUser.id,
      clerkId: newUser.clerkId,
      email: newUser.email
    });

    // 5. Criar transação de crédito
    await prisma.creditTransaction.create({
      data: {
        userId: newUser.id,
        amount: 100,
        type: 'INITIAL_GRANT',
        description: 'Créditos iniciais de boas-vindas',
      },
    });

    console.log('✅ Transação de crédito criada');

    // 6. Verificar se o usuário pode ser encontrado (simulando getCurrentUser)
    const foundUser = await prisma.user.findUnique({
      where: { clerkId: testClerkId },
      include: {
        CreditTransaction: true
      }
    });

    if (foundUser) {
      console.log('✅ Usuário pode ser encontrado via clerkId');
      console.log(`💳 Saldo de créditos: ${foundUser.creditBalance}`);
      console.log(`📊 Transações: ${foundUser.CreditTransaction.length}`);
    } else {
      console.log('❌ Usuário NÃO pode ser encontrado via clerkId');
    }

    // 7. Testar criação de cliente (simulando uso da aplicação)
    console.log('\n🏢 TESTANDO CRIAÇÃO DE CLIENTE...');
    
    const testClient = await prisma.client.create({
      data: {
        name: 'Empresa Teste',
        industry: 'Tecnologia',
        serviceOrProduct: 'Software',
        initialObjective: 'Teste de integração',
        userId: newUser.id,
        richnessScore: 25
      }
    });

    console.log('✅ Cliente criado com sucesso:', {
      id: testClient.id,
      name: testClient.name,
      userId: testClient.userId
    });

    // 8. Limpeza
    console.log('\n🧹 LIMPANDO DADOS DE TESTE...');
    
    await prisma.client.delete({ where: { id: testClient.id } });
    await prisma.creditTransaction.deleteMany({ where: { userId: newUser.id } });
    await prisma.user.delete({ where: { id: newUser.id } });

    console.log('✅ Limpeza concluída');

    // 9. Verificar contagem final
    const finalUsers = await prisma.user.count();
    console.log(`📊 Usuários finais no banco: ${finalUsers}`);

    if (finalUsers === currentUsers) {
      console.log('✅ Contagem de usuários voltou ao normal');
    } else {
      console.log('⚠️ Contagem de usuários mudou');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('💡 O sistema de banco de dados está funcionando corretamente.');
    console.log('💡 Se há problemas de autenticação, pode ser:');
    console.log('   1. Webhook do Clerk não está configurado');
    console.log('   2. Webhook não está sendo disparado');
    console.log('   3. RLS policies estão bloqueando acesso');
    console.log('   4. Função getCurrentUserOrCreate não está sendo usada');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testWebhookSimple(); 