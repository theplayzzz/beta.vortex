#!/usr/bin/env node

/**
 * 🔍 DEBUG DO MIDDLEWARE - VERIFICAR LEITURA DE SESSION CLAIMS
 * 
 * Este script testa a leitura de sessionClaims no middleware
 * para identificar por que usuários aprovados são redirecionados
 */

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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

async function testMiddlewareFlow() {
  log('🔍 TESTANDO FLUXO DO MIDDLEWARE', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Teste 1: Acessar rota protegida sem autenticação
  log('\n📋 1. TESTE: Acesso sem autenticação', 'yellow');
  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual' // Não seguir redirecionamentos automaticamente
    });
    
    log(`Status: ${response.status}`, response.status === 302 ? 'yellow' : 'red');
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      log(`Redirecionado para: ${location}`, 'cyan');
      
      if (location && location.includes('/sign-in')) {
        log('✅ Redirecionamento para login correto', 'green');
      } else {
        log('❌ Redirecionamento inesperado', 'red');
      }
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }

  // Teste 2: Verificar rota de pending-approval
  log('\n📋 2. TESTE: Página pending-approval acessível', 'yellow');
  try {
    const response = await fetch(`${BASE_URL}/pending-approval`);
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    
    if (response.status === 200) {
      log('✅ Página pending-approval acessível', 'green');
    } else {
      log('❌ Página pending-approval não acessível', 'red');
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }

  // Teste 3: Verificar rota de account-rejected
  log('\n📋 3. TESTE: Página account-rejected acessível', 'yellow');
  try {
    const response = await fetch(`${BASE_URL}/account-rejected`);
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    
    if (response.status === 200) {
      log('✅ Página account-rejected acessível', 'green');
    } else {
      log('❌ Página account-rejected não acessível', 'red');
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }

  // Teste 4: Testar API de debug (se existir)
  log('\n📋 4. TESTE: API de debug', 'yellow');
  try {
    const response = await fetch(`${BASE_URL}/api/debug/auth`, {
      redirect: 'manual'
    });
    log(`Status: ${response.status}`, 'blue');
    
    if (response.status === 401) {
      log('✅ API protegida corretamente (401)', 'green');
    } else {
      log(`⚠️ Status inesperado: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }

  // Teste 5: Verificar health check
  log('\n📋 5. TESTE: Health check (deve estar acessível)', 'yellow');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    
    if (response.status === 200) {
      log('✅ Health check funcionando', 'green');
    } else {
      log('❌ Health check não funcionando', 'red');
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }
}

async function createDebugApiRoute() {
  log('\n🔧 CRIANDO API DE DEBUG PARA TESTAR SESSION CLAIMS', 'cyan');
  
  const debugApiContent = `import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authResult = auth()
    
    const debugData = {
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasSessionClaims: !!authResult.sessionClaims,
      sessionClaims: authResult.sessionClaims,
      publicMetadata: authResult.sessionClaims?.publicMetadata,
      approvalStatus: (authResult.sessionClaims?.publicMetadata as any)?.approvalStatus,
      role: (authResult.sessionClaims?.publicMetadata as any)?.role,
      dbUserId: (authResult.sessionClaims?.publicMetadata as any)?.dbUserId,
    }
    
    console.log('[DEBUG API] Session data:', JSON.stringify(debugData, null, 2))
    
    return NextResponse.json(debugData)
  } catch (error) {
    console.error('[DEBUG API] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authResult = auth()
    
    console.log('[DEBUG API] POST Request:', {
      body,
      userId: authResult.userId,
      sessionClaims: authResult.sessionClaims
    })
    
    return NextResponse.json({
      message: 'Debug data logged',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`;

  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Criar diretório se não existir
    const debugDir = path.join(process.cwd(), 'app', 'api', 'debug', 'auth');
    await fs.mkdir(debugDir, { recursive: true });
    
    // Criar arquivo route.ts
    const routePath = path.join(debugDir, 'route.ts');
    await fs.writeFile(routePath, debugApiContent);
    
    log('✅ API de debug criada em /app/api/debug/auth/route.ts', 'green');
    log('   Acesse: /api/debug/auth para ver os sessionClaims', 'cyan');
    
  } catch (error) {
    log(`❌ Erro ao criar API de debug: ${error.message}`, 'red');
  }
}

async function main() {
  log('🔍 DEBUG DO MIDDLEWARE - IDENTIFICAR PROBLEMA DE APROVAÇÃO', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Primeira etapa: criar API de debug
  await createDebugApiRoute();
  
  // Segunda etapa: testar fluxo do middleware
  await testMiddlewareFlow();
  
  log('\n💡 PRÓXIMOS PASSOS:', 'yellow');
  log('1. Reinicie o servidor Next.js', 'white');
  log('2. Faça login com uma conta aprovada', 'white');
  log('3. Acesse /api/debug/auth para ver os sessionClaims', 'white');
  log('4. Verifique se approvalStatus está sendo lido corretamente', 'white');
  log('5. Execute: node scripts/debug-middleware.js', 'white');
  
  log('\n🎯 O QUE PROCURAR:', 'yellow');
  log('• approvalStatus deve ser "APPROVED"', 'white');
  log('• sessionClaims deve estar populado', 'white');
  log('• publicMetadata deve conter os dados corretos', 'white');
  log('• Se algum desses estiver NULL/undefined, temos o problema', 'white');
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testMiddlewareFlow, createDebugApiRoute }; 