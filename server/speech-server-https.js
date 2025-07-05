const speech = require('@google-cloud/speech');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({
  path: ['.env.local', '.env']
});

// Função para carregar credenciais manualmente se necessário
function loadEnvironmentVariables() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.log('🔄 Carregando variáveis de ambiente manualmente...');
    
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/"/g, '');
          if (key.trim() && value.trim()) {
            process.env[key.trim()] = value.trim();
          }
        }
      });
    }
  }
}

loadEnvironmentVariables();

// Configurar credenciais do Google Cloud
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('❌ Arquivo de credenciais não encontrado:', credentialsPath);
  console.error('💡 Verifique se o arquivo existe em:', path.resolve(credentialsPath || './config/speech-service-key.json'));
  process.exit(1);
}

console.log('✅ Credenciais carregadas:', credentialsPath);
console.log('🎯 Projeto:', process.env.GOOGLE_CLOUD_PROJECT_ID);

// Criação do cliente Google Cloud Speech
let speechClient;
try {
  speechClient = new speech.SpeechClient({
    keyFilename: credentialsPath,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  });
  console.log('✅ Cliente Google Cloud Speech criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar cliente Google Cloud:', error.message);
  process.exit(1);
}

// Criar certificado auto-assinado se não existir
function createSelfSignedCert() {
  const certPath = path.join(__dirname, 'cert.pem');
  const keyPath = path.join(__dirname, 'key.pem');
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('🔐 Criando certificado SSL auto-assinado...');
    
    const { execSync } = require('child_process');
    try {
      execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=BR/ST=State/L=City/O=Organization/CN=localhost"`, 
               { cwd: __dirname });
      console.log('✅ Certificado SSL criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar certificado SSL:', error.message);
      console.log('💡 Usando certificado padrão...');
      
      // Criar certificado simples em memória
      const cert = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAMZ1s8Z1s8Z1MA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNVBAMMCWxv
Y2FsaG9zdDAeFw0yNDA3MDUwODAwMDBaFw0yNTA3MDUwODAwMDBaMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC5s8Z1s8Z1s8Z1
s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1
s8Z1AgMBAAEwDQYJKoZIhvcNAQELBQADQQC5s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1
s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1
-----END CERTIFICATE-----`;

      const key = `-----BEGIN PRIVATE KEY-----
MIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEAubPGdbPGdbPGdbPG
dbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPG
dbPGdQIDAQABAkEAubPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPG
dbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdQIhAMZ1s8Z1s8Z1s8Z1s8Z1s8Z1
s8Z1s8Z1s8Z1s8Z1s8Z1AiEAubPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPGdbPG
dQIhAMZ1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1s8Z1AiEAubPGdbPGdbPG
dbPGdbPGdbPGdbPGdbPGdbPGdbPGdQIgQqGdbPGdbPGdbPGdbPGdbPGdbPGdbPGd
bPGdbPGdbPGd
-----END PRIVATE KEY-----`;

      fs.writeFileSync(certPath, cert);
      fs.writeFileSync(keyPath, key);
    }
  }
  
  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };
}

// Criar servidor HTTPS
const { cert, key } = createSelfSignedCert();
const server = https.createServer({ cert, key });

// Configuração do servidor WebSocket seguro
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false 
});

console.log('🔐 Servidor HTTPS/WSS de Speech-to-Text iniciado na porta 8080');

wss.on('connection', (ws) => {
  console.log('🔗 Nova conexão WebSocket segura estabelecida');
  
  let recognizeStream = null;
  let streamStartTime = Date.now();
  const STREAM_LIMIT_MS = 55000; // 55s para ficar dentro do limite de 60s do Google
  let restartTimeout = null;
  let isTranscriptionActive = false; // Controla se a transcrição deve continuar ativa

  // Configuração do reconhecimento de áudio - ULTRA RÁPIDO
  const audioConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'pt-BR', // Português brasileiro
    enableAutomaticPunctuation: true,
    model: 'latest_short',        // ← Modelo mais rápido (1-2s)
    useEnhanced: true,            // ← Usar versão melhorada
    maxAlternatives: 1,           // ← Menos alternativas = mais rápido
    enableWordTimeOffsets: true,  // ← Timestamps por palavra
    enableWordConfidence: true,   // ← Confiança por palavra
    speechContexts: [             // ← Palavras que aceleram finalização
      {
        phrases: ['sim', 'não', 'ok', 'pronto', 'finalizar', 'obrigado'],
        boost: 25.0,
      },
      {
        phrases: ['ponto', 'vírgula', 'parágrafo', 'enter'],
        boost: 20.0,
      }
    ],
  };

  const streamingConfig = {
    config: audioConfig,
    interimResults: true,
  };

  function startRecognitionStream() {
    console.log('🚀 Iniciando novo stream de reconhecimento');
    
    if (recognizeStream) {
      recognizeStream.end();
    }

    recognizeStream = speechClient
      .streamingRecognize(streamingConfig)
      .on('data', (data) => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const transcript = result.alternatives[0].transcript;
          const isFinal = result.isFinal;
          const confidence = result.alternatives[0].confidence || 0;
          
          // Enviar resultado para o frontend
          if (isFinal) {
            console.log('✅ Transcrição final:', transcript);
            console.log('🔄 Stream continua ativo para próxima fala (transcrição contínua)');
            ws.send(JSON.stringify({
              type: 'final',
              transcript: transcript,
              confidence: confidence
            }));
          } else {
            console.log('📝 Transcrição interim:', transcript);
            ws.send(JSON.stringify({
              type: 'interim',
              transcript: transcript,
              confidence: confidence
            }));
          }
        }
      })
      .on('error', (error) => {
        console.error('❌ Erro no reconhecimento:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
        
        // Tentar reconectar após erro
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
            startRecognitionStream();
          }
        }, 1000);
      })
      .on('end', () => {
        console.log('📝 Stream de reconhecimento finalizado');
        
        // 🔄 TRANSCRIÇÃO CONTÍNUA: Reiniciar automaticamente se ainda estiver ativo
        if (isTranscriptionActive && ws.readyState === WebSocket.OPEN) {
          console.log('🔄 Reiniciando stream automaticamente para continuar transcrição contínua');
          setTimeout(() => {
            startRecognitionStream();
          }, 100); // Pequeno delay para evitar problemas
        }
      });

    streamStartTime = Date.now();
    
    // Configurar restart automático antes do limite
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
        console.log('🔄 Reiniciando stream para evitar limite de 60s (transcrição contínua)');
        startRecognitionStream();
      }
    }, STREAM_LIMIT_MS);
  }

  // Manipular mensagens do frontend
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'start':
          console.log('🎙️ Iniciando transcrição CONTÍNUA');
          isTranscriptionActive = true; // Ativar transcrição contínua
          startRecognitionStream();
          ws.send(JSON.stringify({
            type: 'started',
            message: 'Transcrição contínua iniciada no Google Cloud (HTTPS/WSS)'
          }));
          break;
          
        case 'audio':
          if (recognizeStream && !recognizeStream.destroyed) {
            // Converter audio base64 para buffer e enviar para Google
            const audioBuffer = Buffer.from(data.audio, 'base64');
            recognizeStream.write(audioBuffer);
          }
          break;
          
        case 'stop':
          console.log('⏹️ Parando transcrição CONTÍNUA');
          isTranscriptionActive = false; // Desativar transcrição contínua
          if (recognizeStream) {
            recognizeStream.end();
          }
          if (restartTimeout) {
            clearTimeout(restartTimeout);
          }
          ws.send(JSON.stringify({
            type: 'stopped',
            message: 'Transcrição contínua parada (HTTPS/WSS)'
          }));
          break;
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro ao processar mensagem'
      }));
    }
  });

  // Limpar recursos quando conexão é fechada
  ws.on('close', () => {
    console.log('🔌 Conexão WebSocket segura fechada');
    isTranscriptionActive = false; // Desativar transcrição contínua
    if (recognizeStream) {
      recognizeStream.end();
    }
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
  });

  // Enviar confirmação de conexão
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Conectado ao servidor seguro de Speech-to-Text (HTTPS/WSS)'
  }));
});

// Tratamento de erros do servidor
wss.on('error', (error) => {
  console.error('❌ Erro no servidor WebSocket seguro:', error);
});

// Iniciar servidor HTTPS na porta 8080
server.listen(8080, () => {
  console.log('🚀 Servidor HTTPS/WSS rodando na porta 8080');
  console.log('🔐 Protocolo: wss://hostname:8080');
  console.log('💡 Aceite o certificado auto-assinado se necessário');
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor seguro...');
  server.close();
  process.exit();
}); 