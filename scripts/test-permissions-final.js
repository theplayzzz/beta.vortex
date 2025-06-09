const { PrismaClient } = require('@prisma/client');

async function testPermissionsFinal() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TESTE SIMPLES DE PERMISSÕES');
    console.log('='.repeat(40));
    
    console.log('\n📋 1. Verificando se conseguimos inserir dados...');
    
    // Buscar usuário para teste
    const user = await prisma.user.findUnique({
      where: { email: 'play-felix@hotmail.com' },
      select: { id: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado para teste');
    
    // Teste de inserção simples
    const testClient = await prisma.client.create({
      data: {
        name: 'Teste Permissões Final',
        industry: 'Teste',
        contactEmail: 'teste-final@email.com',
        richnessScore: 50,
        userId: user.id
      }
    });
    
    console.log('✅ Cliente criado com sucesso:', testClient.id);
    
    // Teste de inserção de nota
    const testNote = await prisma.clientNote.create({
      data: {
        content: 'Nota de teste após correção de permissões',
        clientId: testClient.id,
        userId: user.id,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Nota criada com sucesso:', testNote.id);
    
    // Limpeza
    await prisma.clientNote.delete({ where: { id: testNote.id } });
    await prisma.client.delete({ where: { id: testClient.id } });
    
    console.log('✅ Dados de teste limpos');
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🔓 Permissões estão funcionando corretamente');
    
    console.log('\n🔄 AGORA TESTE SUA API N8N NOVAMENTE');
    console.log('   As permissões do PostgreSQL foram corrigidas');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('\n🚨 AINDA HÁ PROBLEMAS DE PERMISSÃO');
      console.log('   Pode ser necessário usar a service_role key do Supabase');
      console.log('   Ou configurar diretamente no dashboard do Supabase');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionsFinal(); 