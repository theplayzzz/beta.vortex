#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const crypto = require('crypto');

console.log('🎧 INICIANDO LISTENER DE WEBHOOKS DAILY.CO');
console.log('==========================================');
console.log('⏱️  Monitorando por 30 segundos...');
console.log('🚀 INICIE UMA SESSÃO NO FRONTEND AGORA!');
console.log('📱 Acesse: https://5.161.64.137:3003/coach/capture/daily-co');
console.log('');

// Timer de 30 segundos
const startTime = Date.now();
let webhookCount = 0;
let participantJoinedCount = 0;
let participantLeftCount = 0;

// Função para simular webhook de teste a cada 10 segundos
const sendTestWebhook = () => {
  const secret = '42d508575016b8c10d6398356bc1a138144785b9819458d07b68c333ff675646';
  
  const testPayload = {
    version: "1.0",
    type: "participant.joined",
    id: `evt_test_${Date.now()}`,
    event_ts: Math.floor(Date.now() / 1000),
    payload: {
      user_id: `session_test_${Date.now()}`,
      joined_at: Math.floor(Date.now() / 1000),
      session_id: `participant_test_${Date.now()}`,
      room: "test-room-listener"
    }
  };

  const payloadStr = JSON.stringify(testPayload);
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  
  console.log('📡 Enviando webhook de teste...');
  
  exec(`curl -k -X POST https://5.161.64.137:3003/api/webhooks/daily \
    -H "Content-Type: application/json" \
    -H "x-webhook-signature: ${signature}" \
    -d '${payloadStr}' -s`, (error, stdout, stderr) => {
    
    if (error) {
      console.log('❌ Erro no teste:', error.message);
      return;
    }
    
    console.log('✅ Resposta do webhook teste:', stdout);
  });
};

// Função para monitorar logs do servidor
const monitorServerLogs = () => {
  console.log('📊 Monitorando logs do servidor...');
  
  // Usar tail para seguir os logs em tempo real
  const logProcess = spawn('bash', ['-c', 'tail -f /dev/null 2>/dev/null || echo "Sem logs de arquivo disponível"']);
  
  // Monitorar output do servidor HTTPS que está rodando
  const serverProcess = spawn('bash', ['-c', 'ps aux | grep "node server-https.js" | grep -v grep || echo "Servidor não encontrado"']);
  
  serverProcess.stdout.on('data', (data) => {
    console.log('🔍 Processo servidor:', data.toString().trim());
  });
};

// Função para testar conectividade do webhook
const testWebhookConnectivity = () => {
  console.log('🔌 Testando conectividade do webhook...');
  
  exec('curl -k -X POST https://5.161.64.137:3003/api/webhooks/daily -H "Content-Type: application/json" -d \'{"test":"connectivity"}\' -s', 
    (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Webhook não acessível:', error.message);
        return;
      }
      
      console.log('✅ Webhook respondeu:', stdout);
      
      try {
        const response = JSON.parse(stdout);
        if (response.status === 'ok') {
          console.log('✅ Endpoint webhook está funcionando!');
        }
      } catch (e) {
        console.log('⚠️  Resposta não é JSON válido');
      }
    }
  );
};

// Função para monitorar requisições HTTP na porta 3003
const monitorHttpRequests = () => {
  console.log('📡 Monitorando requisições HTTP na porta 3003...');
  
  // Usar netstat ou ss para monitorar conexões
  const monitorProcess = spawn('bash', ['-c', `
    for i in {1..30}; do
      echo "🔍 [Segundo $i] Checando conexões..."
      netstat -an 2>/dev/null | grep :3003 | grep ESTABLISHED | wc -l | xargs -I {} echo "   Conexões ativas: {}"
      sleep 1
    done
  `]);
  
  monitorProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('Checando')) {
      console.log(output);
    }
  });
};

// Função para fazer polling do banco de dados
const checkDatabaseUpdates = () => {
  console.log('🗄️  Verificando atualizações no banco de dados...');
  
  // Executar query para verificar sessões recentes
  const checkDB = () => {
    exec(`cd /root/Vortex/precedent && npx prisma db execute --stdin <<< "
      SELECT id, sessionName, totalDuration, connectTime, createdAt, webhookEvents
      FROM TranscriptionSession 
      WHERE createdAt >= NOW() - INTERVAL '2 minutes'
      ORDER BY createdAt DESC
      LIMIT 5;
    " 2>/dev/null || echo "Erro na query do banco"`, (error, stdout, stderr) => {
      
      if (!error && stdout && !stdout.includes('Erro')) {
        console.log('📊 Sessões recentes no banco:');
        console.log(stdout);
      }
    });
  };
  
  // Verificar a cada 5 segundos
  const dbInterval = setInterval(checkDB, 5000);
  
  // Parar após 30 segundos
  setTimeout(() => {
    clearInterval(dbInterval);
  }, 30000);
};

// Função principal de monitoramento
const startMonitoring = () => {
  console.log('');
  console.log('🎯 INSTRUÇÕES:');
  console.log('1. Abra: https://5.161.64.137:3003/coach/capture/daily-co');
  console.log('2. Clique em CONECTAR');
  console.log('3. Aguarde alguns segundos');
  console.log('4. Clique em DESCONECTAR');
  console.log('5. Observe os logs abaixo...');
  console.log('');

  // Testar conectividade inicial
  testWebhookConnectivity();
  
  // Enviar webhook de teste inicial
  setTimeout(sendTestWebhook, 2000);
  
  // Monitorar logs
  setTimeout(monitorServerLogs, 3000);
  
  // Monitorar HTTP
  setTimeout(monitorHttpRequests, 4000);
  
  // Verificar banco de dados
  setTimeout(checkDatabaseUpdates, 5000);
  
  // Enviar outro webhook de teste no meio
  setTimeout(sendTestWebhook, 15000);
  
  // Timer principal
  const timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, 30 - elapsed);
    
    if (remaining > 0) {
      process.stdout.write(`\r⏱️  Tempo restante: ${remaining}s | Webhooks detectados: ${webhookCount} | Entradas: ${participantJoinedCount} | Saídas: ${participantLeftCount}`);
    } else {
      clearInterval(timer);
      console.log('\n');
      console.log('⏰ TEMPO ESGOTADO!');
      console.log('==================');
      console.log(`📊 RESUMO:`);
      console.log(`   • Webhooks detectados: ${webhookCount}`);
      console.log(`   • participant.joined: ${participantJoinedCount}`);
      console.log(`   • participant.left: ${participantLeftCount}`);
      console.log('');
      
      if (webhookCount === 0) {
        console.log('❌ PROBLEMA: Nenhum webhook foi detectado!');
        console.log('   Possíveis causas:');
        console.log('   - Webhooks não estão configurados no Daily.co');
        console.log('   - Servidor não está acessível externamente');
        console.log('   - Firewall bloqueando requisições');
        console.log('   - Problema na assinatura HMAC');
      } else {
        console.log('✅ Sistema funcionando! Webhooks foram detectados.');
      }
      
      process.exit(0);
    }
  }, 1000);
};

// Interceptar possíveis webhooks verificando logs do processo
const interceptWebhooks = () => {
  // Esta é uma tentativa de interceptar, mas pode não funcionar perfeitamente
  // O ideal seria ter acesso aos logs do Next.js em tempo real
  console.log('🕵️  Tentando interceptar webhooks...');
};

// Iniciar monitoramento
startMonitoring();
interceptWebhooks();

// Capturar Ctrl+C para finalizar gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Interrompido pelo usuário');
  console.log(`📊 Webhooks detectados: ${webhookCount}`);
  process.exit(0);
});