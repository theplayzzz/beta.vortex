#!/usr/bin/env node

/**
 * PLAN-010: Script para aplicar políticas RLS de acesso ao coaching para usuários PENDING
 * Este script aplica as políticas definidas em prisma/rls-policies-coaching-access.sql
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function applyCoachingRLSPolicies() {
  console.log('🔐 Aplicando políticas RLS para acesso ao coaching (PLAN-010)...\n');

  try {
    // Ler o arquivo SQL com as políticas
    const sqlPath = path.join(__dirname, '..', 'prisma', 'rls-policies-coaching-access.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');

    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} comandos SQL encontrados\n`);

    // Executar cada comando em uma transação
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i] + ';';
        
        // Pular comentários e comandos vazios
        if (command.trim().startsWith('--') || command.trim().length <= 1) {
          continue;
        }

        console.log(`Executando comando ${i + 1}/${commands.length}...`);
        
        try {
          await tx.$executeRawUnsafe(command);
          console.log(`✅ Comando ${i + 1} executado com sucesso\n`);
        } catch (error) {
          // Alguns erros são esperados (ex: DROP POLICY IF EXISTS quando a política não existe)
          if (error.message.includes('does not exist') || error.message.includes('already exists')) {
            console.log(`⚠️  Aviso no comando ${i + 1}: ${error.message}\n`);
          } else {
            throw error;
          }
        }
      }
    });

    console.log('✅ Políticas RLS para coaching aplicadas com sucesso!\n');

    // Verificar se as políticas foram aplicadas
    console.log('🔍 Verificando políticas aplicadas...\n');
    
    const policies = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename IN ('TranscriptionSession', 'AgentInteraction')
      ORDER BY tablename, policyname;
    `;

    console.log('📊 Políticas encontradas:');
    policies.forEach(policy => {
      console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
    });

    console.log('\n✨ Script concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('  1. Testar criação de sessão com usuário PENDING');
    console.log('  2. Verificar isolamento de dados entre usuários');
    console.log('  3. Confirmar que outras tabelas permanecem bloqueadas\n');

  } catch (error) {
    console.error('❌ Erro ao aplicar políticas RLS:', error.message);
    console.error('\nDetalhes do erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
if (require.main === module) {
  applyCoachingRLSPolicies().catch(console.error);
}

module.exports = { applyCoachingRLSPolicies };