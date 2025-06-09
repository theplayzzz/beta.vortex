const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

async function testPlanningInsert() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TESTE DE INSERÇÃO DE PLANEJAMENTO');
    console.log('='.repeat(50));
    
    // Dados de teste
    const testData = {
      title: 'Planejamento via N8N',
      description: 'Planejamento criado automaticamente pela integração',
      clientId: '473101ce-798f-4870-aaf5-a61f412c66f3',
      userEmail: 'play-felix@hotmail.com',
      status: 'DRAFT'
    };
    
    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));
    
    // 1. Verificar se usuário existe
    console.log('\n1. Verificando usuário...');
    const user = await prisma.user.findUnique({
      where: { email: testData.userEmail },
      select: { id: true, email: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    console.log('✅ Usuário encontrado:', user.id);
    
    // 2. Verificar se cliente existe
    console.log('\n2. Verificando cliente...');
    const client = await prisma.$queryRaw`
      SELECT "id", "name", "industry", "richnessScore" FROM "Client" 
      WHERE "id" = ${testData.clientId} AND "userId" = ${user.id}
    `;
    
    if (!Array.isArray(client) || client.length === 0) {
      console.log('❌ Cliente não encontrado');
      return;
    }
    console.log('✅ Cliente encontrado:', client[0].name);
    
    // 3. Testar inserção simples
    console.log('\n3. Tentando inserção com query raw...');
    
    const planningId = randomUUID();
    console.log('📋 ID do planejamento:', planningId);
    
    try {
      await prisma.$executeRaw`
        INSERT INTO "StrategicPlanning" (
          "id", "title", "description", "clientId", "userId", "status", "createdAt", "updatedAt"
        ) VALUES (
          ${planningId}, ${testData.title}, ${testData.description},
          ${testData.clientId}, ${user.id}, ${testData.status},
          NOW(), NOW()
        )
      `;
      
      console.log('✅ Inserção bem-sucedida!');
      
      // Verificar se foi inserido
      const created = await prisma.$queryRaw`
        SELECT "id", "title", "description", "status", "createdAt"
        FROM "StrategicPlanning" 
        WHERE "id" = ${planningId}
      `;
      
      console.log('📊 Planejamento criado:', JSON.stringify(created, null, 2));
      
      // Limpar teste
      await prisma.$executeRaw`DELETE FROM "StrategicPlanning" WHERE "id" = ${planningId}`;
      console.log('🧹 Dados de teste removidos');
      
    } catch (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('🔍 Código:', insertError.code);
      console.log('📄 Stack:', insertError.stack);
    }
    
    // 4. Verificar schema da tabela
    console.log('\n4. Verificando schema da tabela StrategicPlanning...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'StrategicPlanning' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Colunas da tabela:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📄 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPlanningInsert(); 