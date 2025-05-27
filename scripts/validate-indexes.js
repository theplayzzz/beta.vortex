#!/usr/bin/env node

/**
 * Validação de Índices - Fase 4: Otimização de Performance
 * Script para verificar se os índices foram criados corretamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateIndexes() {
  console.log('=== VALIDAÇÃO DE ÍNDICES - FASE 4 ===');
  console.log('Data:', new Date().toISOString());
  console.log('');

  try {
    // Verificar se os índices foram criados (usando query raw)
    console.log('=== VERIFICANDO ÍNDICES CRIADOS ===');
    
    const indexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'Client'
      ORDER BY indexname;
    `;

    console.log('Índices encontrados na tabela Client:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.indexname}`);
      console.log(`   Definição: ${index.indexdef}`);
    });
    console.log('');

    // Verificar se os índices específicos da Fase 4 existem
    const expectedIndexes = [
      'Client_userId_deletedAt_createdAt_idx',
      'Client_userId_name_idx', 
      'Client_userId_industry_richnessScore_idx'
    ];

    const foundIndexes = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(expected => 
      !foundIndexes.includes(expected)
    );

    console.log('=== VERIFICAÇÃO DOS ÍNDICES DA FASE 4 ===');
    expectedIndexes.forEach(indexName => {
      const exists = foundIndexes.includes(indexName);
      console.log(`${exists ? '✅' : '❌'} ${indexName}: ${exists ? 'CRIADO' : 'FALTANDO'}`);
    });
    console.log('');

    if (missingIndexes.length === 0) {
      console.log('✅ SUCESSO: Todos os índices da Fase 4 foram criados!');
    } else {
      console.log(`❌ ERRO: Índices faltando: ${missingIndexes.join(', ')}`);
      return { success: false, missingIndexes };
    }

    // Testar algumas queries para verificar performance
    console.log('=== TESTES BÁSICOS DE PERFORMANCE ===');
    
    // Teste 1: Query principal
    console.log('Teste 1: Listagem principal ordenada por data');
    const startTime1 = Date.now();
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12,
      select: {
        id: true,
        name: true,
        industry: true,
        richnessScore: true,
        createdAt: true
      }
    });
    const endTime1 = Date.now();
    console.log(`   Resultado: ${clients.length} clientes encontrados em ${endTime1 - startTime1}ms`);

    // Teste 2: Busca por nome
    console.log('Teste 2: Busca por nome');
    const startTime2 = Date.now();
    const searchResults = await prisma.client.findMany({
      where: {
        name: {
          contains: 'test',
          mode: 'insensitive'
        }
      },
      take: 10
    });
    const endTime2 = Date.now();
    console.log(`   Resultado: ${searchResults.length} clientes encontrados em ${endTime2 - startTime2}ms`);

    // Teste 3: Filtros avançados
    console.log('Teste 3: Filtros por industry e richnessScore');
    const startTime3 = Date.now();
    const filteredResults = await prisma.client.findMany({
      where: {
        AND: [
          { industry: { not: null } },
          { richnessScore: { gt: 50 } }
        ]
      },
      take: 10
    });
    const endTime3 = Date.now();
    console.log(`   Resultado: ${filteredResults.length} clientes encontrados em ${endTime3 - startTime3}ms`);

    console.log('');
    console.log('=== VALIDAÇÃO CONCLUÍDA ===');
    console.log('✅ Todos os testes passaram!');
    console.log('✅ Índices criados e funcionando corretamente');
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('   1. Monitorar performance da aplicação');
    console.log('   2. Atualizar schema.prisma se necessário');
    console.log('   3. Documentar resultados');

    return { 
      success: true, 
      indexesCreated: expectedIndexes.length,
      performanceTests: {
        listingQuery: `${endTime1 - startTime1}ms`,
        searchQuery: `${endTime2 - startTime2}ms`,
        filterQuery: `${endTime3 - startTime3}ms`
      }
    };

  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  validateIndexes()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Validação concluída com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ Validação falhou!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { validateIndexes }; 