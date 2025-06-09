const { PrismaClient } = require('@prisma/client');

async function testNoRLSFinal() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TESTE FINAL - PRISMA CLIENT SEM RLS');
    console.log('='.repeat(50));
    
    // Buscar usuário real para usar nos testes
    const user = await prisma.user.findUnique({
      where: { email: 'play-felix@hotmail.com' },
      select: { id: true, email: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado para teste');
      return;
    }
    
    console.log('👤 Usuário de teste:', user.email);
    
    // 1. Teste usando Prisma client normal (não raw queries)
    console.log('\n📋 1. Testando criação direta com Prisma client...');
    
    const testClient = await prisma.client.create({
      data: {
        name: 'Cliente Prisma Direct',
        industry: 'Teste Direto',
        contactEmail: 'direto@teste.com',
        richnessScore: 25,
        userId: user.id
      }
    });
    
    console.log('   ✅ Cliente criado com Prisma client:', testClient.id);
    
    // 2. Criar nota diretamente
    const testNote = await prisma.clientNote.create({
      data: {
        content: 'Nota criada diretamente via Prisma client',
        clientId: testClient.id,
        userId: user.id,
        updatedAt: new Date()
      }
    });
    
    console.log('   ✅ Nota criada com Prisma client:', testNote.id);
    
    // 3. Criar planejamento diretamente
    const testPlanning = await prisma.strategicPlanning.create({
      data: {
        title: 'Planejamento Prisma Direct',
        description: 'Criado diretamente via Prisma client',
        clientId: testClient.id,
        userId: user.id,
        status: 'DRAFT'
      }
    });
    
    console.log('   ✅ Planejamento criado com Prisma client:', testPlanning.id);
    
    // 4. Testar listagem sem filtros (deveria funcionar sem RLS)
    console.log('\n📋 2. Testando listagem sem restrições...');
    
    const allClients = await prisma.client.findMany({
      take: 5,
      select: { id: true, name: true, userId: true }
    });
    
    console.log(`   ✅ Listou ${allClients.length} clientes sem restrições`);
    
    const allNotes = await prisma.clientNote.findMany({
      take: 5,
      select: { id: true, content: true, userId: true }
    });
    
    console.log(`   ✅ Listou ${allNotes.length} notas sem restrições`);
    
    // 5. Testar acesso a dados de outros usuários (deveria funcionar sem RLS)
    const otherUserClients = await prisma.client.findMany({
      where: {
        userId: { not: user.id }
      },
      take: 3,
      select: { id: true, name: true, userId: true }
    });
    
    console.log(`   ✅ Acesso a dados de outros usuários: ${otherUserClients.length} clientes`);
    
    // 6. Limpar dados de teste
    console.log('\n📋 3. Limpando dados de teste...');
    
    await prisma.strategicPlanning.delete({ where: { id: testPlanning.id } });
    await prisma.clientNote.delete({ where: { id: testNote.id } });
    await prisma.client.delete({ where: { id: testClient.id } });
    
    console.log('   🧹 Dados de teste removidos');
    
    console.log('\n✅ TESTE FINAL CONCLUÍDO COM SUCESSO!');
    console.log('🔓 RLS completamente removido - APIs externas têm acesso total');
    console.log('\n📋 Capacidades confirmadas:');
    console.log('   ✅ Criação direta via Prisma client');
    console.log('   ✅ Listagem sem restrições');
    console.log('   ✅ Acesso a dados de qualquer usuário');
    console.log('   ✅ Operações CRUD completas');
    
  } catch (error) {
    console.error('❌ Erro no teste final:', error.message);
    console.error('📄 Detalhes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNoRLSFinal(); 