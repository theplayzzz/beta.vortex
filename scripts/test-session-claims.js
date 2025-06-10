#!/usr/bin/env node

/**
 * 🔍 TESTE DE SESSION CLAIMS - IDENTIFICAR PROBLEMAS DE CACHE
 * 
 * Este script testa se os sessionClaims estão sendo atualizados corretamente
 * após mudanças no metadata do usuário via webhook
 */

const { createClerkClient } = require('@clerk/backend');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color] || ''}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

async function testClerkMetadata() {
  log('🔍 TESTANDO METADATA DO CLERK', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecretKey) {
    log('❌ CLERK_SECRET_KEY não encontrada no .env', 'red');
    log('   Adicione a chave secreta do Clerk no arquivo .env', 'yellow');
    return;
  }
  
  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    
    // IDs dos usuários para testar
    const testUserIds = [
      'user_2yHwYWeOuZ6AESqKkDyQi47XusG', // ID fornecido pelo usuário
    ];
    
    for (const userId of testUserIds) {
      log(`\n📋 TESTANDO USUÁRIO: ${userId}`, 'yellow');
      
      try {
        const user = await clerk.users.getUser(userId);
        
        log(`Email: ${user.emailAddresses[0]?.emailAddress}`, 'blue');
        log(`ID: ${user.id}`, 'blue');
        log(`Criado: ${user.createdAt}`, 'blue');
        log(`Última atualização: ${user.updatedAt}`, 'blue');
        
        // Verificar publicMetadata
        log('\n📋 PUBLIC METADATA:', 'cyan');
        log(JSON.stringify(user.publicMetadata, null, 2), 'white');
        
        // Verificar privateMetadata
        log('\n📋 PRIVATE METADATA:', 'cyan');
        log(JSON.stringify(user.privateMetadata, null, 2), 'white');
        
        // Verificar unsafeMetadata
        log('\n📋 UNSAFE METADATA:', 'cyan');
        log(JSON.stringify(user.unsafeMetadata, null, 2), 'white');
        
        // Verificar se metadata está correto
        const approvalStatus = user.publicMetadata.approvalStatus;
        const role = user.publicMetadata.role;
        const dbUserId = user.publicMetadata.dbUserId;
        
        log('\n📋 ANÁLISE DO METADATA:', 'yellow');
        if (approvalStatus === 'APPROVED') {
          log('✅ approvalStatus: APPROVED (correto)', 'green');
        } else {
          log(`❌ approvalStatus: ${approvalStatus} (incorreto!)`, 'red');
        }
        
        if (role) {
          log(`✅ role: ${role}`, 'green');
        } else {
          log('❌ role: não definido', 'red');
        }
        
        if (dbUserId) {
          log(`✅ dbUserId: ${dbUserId}`, 'green');
        } else {
          log('❌ dbUserId: não definido', 'red');
        }
        
        // Testar atualização de metadata se necessário
        if (approvalStatus !== 'APPROVED') {
          log('\n🔧 CORRIGINDO METADATA...', 'yellow');
          
          const updatedUser = await clerk.users.updateUser(userId, {
            publicMetadata: {
              ...user.publicMetadata,
              approvalStatus: 'APPROVED',
              role: role || 'USER'
            }
          });
          
          log('✅ Metadata atualizado!', 'green');
          log('   O usuário deve fazer logout/login para ver as mudanças', 'cyan');
        }
        
      } catch (error) {
        log(`❌ Erro ao buscar usuário ${userId}: ${error.message}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Erro ao conectar com Clerk: ${error.message}`, 'red');
  }
}

async function testSessionRefresh() {
  log('\n🔄 INFORMAÇÕES SOBRE CACHE DE SESSION', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log('📋 POSSÍVEIS CAUSAS DO PROBLEMA:', 'yellow');
  log('1. Cache do sessionClaims no Clerk não foi atualizado', 'white');
  log('2. Usuário não fez logout/login após aprovação', 'white');
  log('3. Token JWT ainda contém metadata antigo', 'white');
  log('4. Problemas de sincronização entre webhook e Clerk', 'white');
  
  log('\n📋 SOLUÇÕES RECOMENDADAS:', 'yellow');
  log('1. Usuário deve fazer LOGOUT completo e LOGIN novamente', 'white');
  log('2. Aguardar alguns minutos para cache expirar', 'white');
  log('3. Limpar cookies do navegador', 'white');
  log('4. Verificar se webhook está funcionando corretamente', 'white');
  
  log('\n📋 COMANDOS ÚTEIS:', 'yellow');
  log('• Acessar /api/debug/auth após login para ver sessionClaims', 'white');
  log('• Verificar logs do servidor durante login', 'white');
  log('• Testar em aba anônima/incógnita', 'white');
}

async function createDebugComponent() {
  log('\n🔧 CRIANDO COMPONENTE DE DEBUG PARA FRONTEND', 'cyan');
  
  const debugComponentContent = `"use client"

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

export default function DebugUserStatus() {
  const { user, isLoaded } = useUser()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const testSessionClaims = async () => {
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Erro ao buscar debug info:', error)
    }
  }
  
  if (!isLoaded) {
    return <div>Carregando...</div>
  }
  
  if (!user) {
    return <div>Usuário não logado</div>
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔍 Debug do Status do Usuário</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Dados do Clerk (Frontend)</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              publicMetadata: user.publicMetadata,
              unsafeMetadata: user.unsafeMetadata
            }, null, 2)}
          </pre>
        </div>
        
        <button 
          onClick={testSessionClaims}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Testar SessionClaims (Backend)
        </button>
        
        {debugInfo && (
          <div>
            <h3 className="font-semibold">Dados do SessionClaims (Backend)</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Status esperado:</strong> APPROVED</p>
          <p><strong>Problema comum:</strong> Cache de session não atualizado</p>
          <p><strong>Solução:</strong> Logout + Login novamente</p>
        </div>
      </div>
    </div>
  )
}`;

  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Criar diretório se não existir
    const componentDir = path.join(process.cwd(), 'components', 'debug');
    await fs.mkdir(componentDir, { recursive: true });
    
    // Criar arquivo
    const componentPath = path.join(componentDir, 'DebugUserStatus.tsx');
    await fs.writeFile(componentPath, debugComponentContent);
    
    log('✅ Componente de debug criado em /components/debug/DebugUserStatus.tsx', 'green');
    log('   Adicione este componente em uma página para debug visual', 'cyan');
    
  } catch (error) {
    log(`❌ Erro ao criar componente: ${error.message}`, 'red');
  }
}

async function main() {
  await testClerkMetadata();
  await testSessionRefresh();
  await createDebugComponent();
  
  log('\n💡 PRÓXIMOS PASSOS PARA RESOLVER O PROBLEMA:', 'yellow');
  log('='.repeat(70), 'yellow');
  log('1. Execute este script para verificar metadata no Clerk', 'white');
  log('2. Faça LOGOUT completo da aplicação', 'white');
  log('3. Aguarde 2-3 minutos', 'white');
  log('4. Faça LOGIN novamente', 'white');
  log('5. Acesse /api/debug/auth para verificar sessionClaims', 'white');
  log('6. Verifique os logs do middleware no terminal', 'white');
  
  log('\n🚨 IMPORTANTE:', 'red');
  log('O Clerk pode levar alguns minutos para atualizar sessionClaims', 'white');
  log('O logout/login é ESSENCIAL para forçar refresh do token JWT', 'white');
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testClerkMetadata, testSessionRefresh }; 