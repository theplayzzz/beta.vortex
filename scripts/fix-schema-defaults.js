#!/usr/bin/env node

/**
 * Script para corrigir campos ID sem default no schema Prisma
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function fixSchemaDefaults() {
  console.log('=== CORRIGINDO DEFAULTS NO SCHEMA PRISMA ===');
  
  try {
    // Ler o arquivo schema
    let content = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Arquivo lido com sucesso');
    
    // Padrão para encontrar campos String @id sem @default(cuid())
    const pattern = /(\s+id\s+String\s+@id)(?!\s+@default)/g;
    
    // Contar quantas ocorrências existem
    const matches = content.match(pattern);
    const count = matches ? matches.length : 0;
    
    console.log(`Encontrados ${count} campos ID sem default`);
    
    if (count > 0) {
      // Substituir todas as ocorrências
      content = content.replace(pattern, '$1 @default(cuid())');
      
      // Escrever o arquivo corrigido
      fs.writeFileSync(schemaPath, content, 'utf8');
      
      console.log(`✅ Corrigidos ${count} campos ID`);
      console.log('Schema atualizado com sucesso!');
    } else {
      console.log('✅ Todos os campos ID já têm defaults corretos');
    }
    
    return { success: true, fixed: count };
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const result = fixSchemaDefaults();
  process.exit(result.success ? 0 : 1);
}

module.exports = { fixSchemaDefaults }; 