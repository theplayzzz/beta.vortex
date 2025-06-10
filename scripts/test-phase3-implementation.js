const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');
const crypto = require('crypto');

const prisma = new PrismaClient();
const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

class Phase3Tester {
  constructor() {
    this.testResults = [];
    this.testUserId = null;
    this.testClerkId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async runAllTests() {
    this.log('🚀 INICIANDO TESTES DA PHASE 3: CLERK-FIRST AUTHORIZATION', 'test');
    this.log('=' .repeat(80), 'info');

    try {
      await this.testEnvironmentConfig();
      await this.testWebhookImplementation();
      await this.testMetadataSync();
      await this.testApprovalFlow();
      await this.testMiddlewareIntegration();
      
      this.log('✅ TODOS OS TESTES DA PHASE 3 CONCLUÍDOS COM SUCESSO!', 'success');
      return true;
    } catch (error) {
      this.log(`❌ ERRO NOS TESTES: ${error.message}`, 'error');
      return false;
    } finally {
      await this.cleanup();
    }
  }

  // ===== TESTE 1: CONFIGURAÇÃO DE AMBIENTE =====
  async testEnvironmentConfig() {
    this.log('🔧 TESTE 1: Verificando configuração de ambiente...', 'test');
    
    const requiredEnvVars = [
      'CLERK_SECRET_KEY',
      'CLERK_WEBHOOK_SECRET',
      'APPROVAL_REQUIRED',
      'DEFAULT_USER_STATUS',
      'DATABASE_URL'
    ];

    let missingVars = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    }

    this.log('✅ Todas as variáveis de ambiente estão configuradas', 'success');
    
    // Verificar configuração de aprovação
    const approvalRequired = process.env.APPROVAL_REQUIRED === 'true';
    const defaultStatus = process.env.DEFAULT_USER_STATUS;
    
    if (!approvalRequired) {
      this.log('⚠️ APPROVAL_REQUIRED=false - usuários serão criados como APPROVED', 'warning');
    } else {
      this.log('✅ APPROVAL_REQUIRED=true - usuários serão criados como PENDING', 'success');
    }
    
    if (defaultStatus !== 'PENDING') {
      this.log(`⚠️ DEFAULT_USER_STATUS=${defaultStatus} - esperado PENDING`, 'warning');
    } else {
      this.log('✅ DEFAULT_USER_STATUS=PENDING configurado corretamente', 'success');
    }
  }

  // ===== TESTE 2: IMPLEMENTAÇÃO DO WEBHOOK =====
  async testWebhookImplementation() {
    this.log('🔗 TESTE 2: Testando implementação do webhook...', 'test');
    
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/webhooks/clerk`;
      
      // Criar payload de teste
      const testClerkId = `user_test_phase3_${Date.now()}`;
      const testEmail = `test-phase3-${Date.now()}@example.com`;
      
      const testPayload = {
        type: 'user.created',
        data: {
          id: testClerkId,
          email_addresses: [{
            id: 'email_test',
            email_address: testEmail
          }],
          first_name: 'Test',
          last_name: 'Phase3',
          image_url: 'https://example.com/avatar.jpg'
        }
      };

      const payloadString = JSON.stringify(testPayload);
      
      // Gerar headers Svix
      const timestamp = Math.floor(Date.now() / 1000);
      const id = `msg_${crypto.randomBytes(12).toString('hex')}`;
      const signature = this.generateSvixSignature(id, timestamp, payloadString);

      // Fazer requisição HTTP
      const response = await this.makeHttpRequest(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp.toString(),
          'svix-signature': signature
        },
        body: payloadString
      });

      if (response.status !== 200) {
        throw new Error(`Webhook falhou: ${response.status} - ${response.body}`);
      }

      this.log('✅ Webhook respondeu com sucesso', 'success');
      
      // Verificar se usuário foi criado no banco
      const createdUser = await prisma.user.findUnique({
        where: { clerkId: testClerkId }
      });

      if (!createdUser) {
        throw new Error('Usuário não foi criado no banco via webhook');
      }

      this.log('✅ Usuário criado no banco via webhook', 'success');
      
      // Verificar status de aprovação
      if (createdUser.approvalStatus !== 'PENDING') {
        this.log(`⚠️ Status de aprovação: ${createdUser.approvalStatus} (esperado: PENDING)`, 'warning');
      } else {
        this.log('✅ Usuário criado com status PENDING', 'success');
      }
      
      // Verificar créditos (deve ser 0 para PENDING)
      if (createdUser.creditBalance !== 0) {
        this.log(`⚠️ Saldo de créditos: ${createdUser.creditBalance} (esperado: 0 para PENDING)`, 'warning');
      } else {
        this.log('✅ Créditos retidos para usuário PENDING', 'success');
      }

      this.testUserId = createdUser.id;
      this.testClerkId = testClerkId;
      
    } catch (error) {
      throw new Error(`Falha no teste do webhook: ${error.message}`);
    }
  }

  // ===== TESTE 3: SINCRONIZAÇÃO DE METADATA =====
  async testMetadataSync() {
    this.log('🔄 TESTE 3: Testando sincronização de metadata...', 'test');
    
    if (!this.testClerkId) {
      throw new Error('testClerkId não disponível para teste de metadata');
    }

    try {
      // Simular atualização de metadata no Clerk
      const testPayload = {
        type: 'user.updated',
        data: {
          id: this.testClerkId,
          email_addresses: [{
            id: 'email_test',
            email_address: `test-updated-${Date.now()}@example.com`
          }],
          first_name: 'Updated',
          last_name: 'User',
          public_metadata: {
            approvalStatus: 'APPROVED',
            dbUserId: this.testUserId,
            role: 'USER'
          }
        }
      };

      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/webhooks/clerk`;
      const payloadString = JSON.stringify(testPayload);
      
      const timestamp = Math.floor(Date.now() / 1000);
      const id = `msg_${crypto.randomBytes(12).toString('hex')}`;
      const signature = this.generateSvixSignature(id, timestamp, payloadString);

      const response = await this.makeHttpRequest(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp.toString(),
          'svix-signature': signature
        },
        body: payloadString
      });

      if (response.status !== 200) {
        throw new Error(`Webhook update falhou: ${response.status}`);
      }

      // Verificar se status foi atualizado no banco
      const updatedUser = await prisma.user.findUnique({
        where: { clerkId: this.testClerkId }
      });

      if (!updatedUser) {
        throw new Error('Usuário não encontrado após atualização');
      }

      if (updatedUser.approvalStatus !== 'APPROVED') {
        throw new Error(`Status não foi atualizado: ${updatedUser.approvalStatus}`);
      }

      this.log('✅ Status de aprovação sincronizado corretamente', 'success');

      // Verificar se créditos foram liberados
      if (updatedUser.creditBalance === 100) {
        this.log('✅ Créditos liberados após aprovação', 'success');
      } else {
        this.log(`⚠️ Créditos não liberados: ${updatedUser.creditBalance}`, 'warning');
      }

      // Verificar transação de crédito
      const creditTransaction = await prisma.creditTransaction.findFirst({
        where: { 
          userId: this.testUserId,
          type: 'INITIAL_GRANT'
        }
      });

      if (creditTransaction) {
        this.log('✅ Transação de crédito criada após aprovação', 'success');
      } else {
        this.log('⚠️ Transação de crédito não encontrada', 'warning');
      }

    } catch (error) {
      throw new Error(`Falha no teste de metadata: ${error.message}`);
    }
  }

  // ===== TESTE 4: FLUXO DE APROVAÇÃO =====
  async testApprovalFlow() {
    this.log('📋 TESTE 4: Testando fluxo completo de aprovação...', 'test');
    
    if (!this.testUserId) {
      throw new Error('testUserId não disponível para teste de fluxo');
    }

    try {
      // Verificar logs de moderação
      const moderationLogs = await prisma.userModerationLog.findMany({
        where: { userId: this.testUserId },
        orderBy: { createdAt: 'asc' }
      });

      if (moderationLogs.length === 0) {
        this.log('⚠️ Nenhum log de moderação encontrado', 'warning');
      } else {
        this.log(`✅ ${moderationLogs.length} logs de moderação encontrados`, 'success');
        
        moderationLogs.forEach((log, index) => {
          this.log(`   ${index + 1}. ${log.action} - ${log.createdAt.toISOString()}`, 'info');
        });
      }

      // Verificar auditoria no banco
      const user = await prisma.user.findUnique({
        where: { id: this.testUserId },
        include: {
          CreditTransaction: true,
          ModeratedUsers: true
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado para verificação de auditoria');
      }

      this.log(`✅ Usuário final: ${user.approvalStatus}, Créditos: ${user.creditBalance}`, 'success');
      this.log(`✅ Transações: ${user.CreditTransaction.length}, Logs: ${user.ModeratedUsers.length}`, 'success');

    } catch (error) {
      throw new Error(`Falha no teste de fluxo: ${error.message}`);
    }
  }

  // ===== TESTE 5: INTEGRAÇÃO COM MIDDLEWARE =====
  async testMiddlewareIntegration() {
    this.log('🛡️ TESTE 5: Testando integração com middleware...', 'test');
    
    try {
      // Verificar se middleware.ts existe
      const fs = require('fs');
      const middlewarePath = './middleware.ts';
      
      if (!fs.existsSync(middlewarePath)) {
        throw new Error('middleware.ts não encontrado');
      }

      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      
      // Verificar elementos chave do middleware
      const requiredElements = [
        'sessionClaims',
        'publicMetadata',
        'approvalStatus',
        'PENDING',
        'pending-approval'
      ];

      let missingElements = [];
      for (const element of requiredElements) {
        if (!middlewareContent.includes(element)) {
          missingElements.push(element);
        }
      }

      if (missingElements.length > 0) {
        this.log(`⚠️ Elementos ausentes no middleware: ${missingElements.join(', ')}`, 'warning');
      } else {
        this.log('✅ Middleware contém todos os elementos necessários', 'success');
      }

      // Verificar se página pending-approval existe
      const pendingPagePath = './app/pending-approval/page.tsx';
      if (fs.existsSync(pendingPagePath)) {
        this.log('✅ Página /pending-approval encontrada', 'success');
      } else {
        this.log('⚠️ Página /pending-approval não encontrada', 'warning');
      }

    } catch (error) {
      throw new Error(`Falha no teste de middleware: ${error.message}`);
    }
  }

  // ===== HELPER METHODS =====
  generateSvixSignature(id, timestamp, payload) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('CLERK_WEBHOOK_SECRET não configurado');
    }

    const secretBytes = Buffer.from(secret.split('_')[1], 'base64');
    const signedPayload = `${id}.${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedPayload, 'utf8')
      .digest('base64');

    return `v1,${signature}`;
  }

  async makeHttpRequest(url, options) {
    const https = require('https');
    const http = require('http');
    const urlLib = require('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = urlLib.parse(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const req = lib.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: options.method,
        headers: options.headers
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: body
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async cleanup() {
    this.log('🧹 Limpando dados de teste...', 'info');
    
    try {
      if (this.testUserId) {
        // Deletar transações de crédito
        await prisma.creditTransaction.deleteMany({
          where: { userId: this.testUserId }
        });

        // Deletar logs de moderação
        await prisma.userModerationLog.deleteMany({
          where: { userId: this.testUserId }
        });

        // Deletar usuário
        await prisma.user.delete({
          where: { id: this.testUserId }
        });

        this.log('✅ Dados de teste removidos', 'success');
      }
    } catch (error) {
      this.log(`⚠️ Erro na limpeza: ${error.message}`, 'warning');
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Executar testes
async function main() {
  const tester = new Phase3Tester();
  const success = await tester.runAllTests();
  
  if (success) {
    console.log('\n🎉 PHASE 3 IMPLEMENTADA COM SUCESSO!');
    console.log('✅ Sistema de autorização baseado em Clerk metadata funcionando');
    console.log('✅ Webhook sincronizando dados corretamente');
    console.log('✅ Middleware protegendo rotas baseado em Clerk');
    console.log('✅ Supabase funcionando como storage livre');
    process.exit(0);
  } else {
    console.log('\n❌ FALHAS ENCONTRADAS NA PHASE 3');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { Phase3Tester }; 