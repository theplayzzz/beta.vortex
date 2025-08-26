#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Carregado .env.local');
} else {
  console.log('⚠️ Arquivo .env.local não encontrado, tentando .env...');
  
  // Fallback para .env
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Carregado .env');
  }
}

// URLs dos webhooks conforme solicitado pelo usuário
const WEBHOOK_URLS = [
  'https://5.161.64.137:3003/api/webhooks/daily',
  'https://beta-vortex.gruporugido.com/api/webhooks/daily'
];

const DAILY_API_KEY = process.env.DAILY_API_KEY;

console.log('🔍 Verificando DAILY_API_KEY:', DAILY_API_KEY ? '✅ Encontrada' : '❌ Não encontrada');

if (!DAILY_API_KEY) {
  console.error('❌ DAILY_API_KEY não encontrada');
  console.error('Verifique se a variável está configurada em .env.local ou .env');
  process.exit(1);
}

async function createWebhook(url) {
  try {
    console.log(`\n🔧 Criando webhook para: ${url}`);
    
    const response = await fetch('https://api.daily.co/v1/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        url: url,
        event_types: [
          'participant.joined',
          'participant.left'
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Erro ao criar webhook ${url}:`, response.status, errorData);
      return null;
    }

    const webhookData = await response.json();
    console.log(`✅ Webhook criado com sucesso!`);
    console.log(`   ID: ${webhookData.id}`);
    console.log(`   URL: ${webhookData.url}`);
    console.log(`   Event Types: ${(webhookData.event_types || webhookData.events || []).join(', ')}`);
    
    return webhookData;
  } catch (error) {
    console.error(`❌ Erro na criação do webhook ${url}:`, error.message);
    return null;
  }
}

async function listExistingWebhooks() {
  try {
    console.log('\n📋 Listando webhooks existentes...');
    
    const response = await fetch('https://api.daily.co/v1/webhooks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('❌ Erro ao listar webhooks:', response.status);
      return [];
    }

    const data = await response.json();
    const webhooks = data.data || [];
    
    if (webhooks.length === 0) {
      console.log('   Nenhum webhook existente encontrado.');
    } else {
      webhooks.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.url} (ID: ${webhook.id})`);
      });
    }
    
    return webhooks;
  } catch (error) {
    console.error('❌ Erro ao listar webhooks:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Daily.co Webhook Setup Script');
  console.log('=================================');
  
  // Listar webhooks existentes primeiro
  const existingWebhooks = await listExistingWebhooks();
  
  // Verificar se algum dos URLs já está configurado
  const existingUrls = existingWebhooks.map(w => w.url);
  const urlsToCreate = WEBHOOK_URLS.filter(url => !existingUrls.includes(url));
  
  if (urlsToCreate.length === 0) {
    console.log('\n✅ Todos os webhooks já estão configurados!');
    console.log('\n📋 Webhooks configurados:');
    WEBHOOK_URLS.forEach(url => {
      const existing = existingWebhooks.find(w => w.url === url);
      if (existing) {
        console.log(`   ✅ ${url} (ID: ${existing.id})`);
      }
    });
  } else {
    console.log(`\n🔧 Criando ${urlsToCreate.length} webhook(s)...`);
    
    // Criar webhooks para URLs que ainda não existem
    const createdWebhooks = [];
    for (const url of urlsToCreate) {
      const webhook = await createWebhook(url);
      if (webhook) {
        createdWebhooks.push(webhook);
      }
    }
    
    if (createdWebhooks.length > 0) {
      console.log(`\n✅ ${createdWebhooks.length} webhook(s) criado(s) com sucesso!`);
    }
  }
  
  // Gerar e exibir o secret HMAC
  console.log('\n🔐 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
  console.log('===================================');
  
  const hmacSecret = crypto.randomBytes(32).toString('hex');
  console.log(`\n📝 Adicione esta linha ao seu arquivo .env:`);
  console.log(`\nDAILY_WEBHOOK_SECRET=${hmacSecret}`);
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Copie a linha acima EXATAMENTE como está');
  console.log('   2. Cole no arquivo .env do projeto');
  console.log('   3. Não compartilhe este secret com ninguém');
  console.log('   4. Reinicie o servidor após adicionar o secret');
  
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Adicionar DAILY_WEBHOOK_SECRET ao .env');
  console.log('   2. Executar: npx prisma db push');
  console.log('   3. Reiniciar servidor com npm run dev:https');
  
  console.log('\n✅ Setup de webhooks concluído!');
}

// Executar script
main().catch(console.error);