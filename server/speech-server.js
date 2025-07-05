const WebSocket = require('ws');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

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

// Configuração do servidor WebSocket
const wss = new WebSocket.Server({ 
  port: 8080,
  perMessageDeflate: false 
});

console.log('🎤 Servidor de Speech-to-Text iniciado na porta 8080');

wss.on('connection', (ws) => {
  console.log('🔗 Nova conexão WebSocket estabelecida');
  
  let recognizeStream = null;
  let streamStartTime = Date.now();
  const STREAM_LIMIT_MS = 55000; // 55s para ficar dentro do limite de 60s do Google
  let restartTimeout = null;

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
          if (ws.readyState === WebSocket.OPEN) {
            startRecognitionStream();
          }
        }, 1000);
      })
      .on('end', () => {
        console.log('📝 Stream de reconhecimento finalizado');
      });

    streamStartTime = Date.now();
    
    // Configurar restart automático antes do limite
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('🔄 Reiniciando stream para evitar limite de 60s');
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
          console.log('🎙️ Iniciando transcrição');
          startRecognitionStream();
          ws.send(JSON.stringify({
            type: 'started',
            message: 'Transcrição iniciada no Google Cloud'
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
          console.log('⏹️ Parando transcrição');
          if (recognizeStream) {
            recognizeStream.end();
          }
          if (restartTimeout) {
            clearTimeout(restartTimeout);
          }
          ws.send(JSON.stringify({
            type: 'stopped',
            message: 'Transcrição parada'
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
    console.log('🔌 Conexão WebSocket fechada');
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
    message: 'Conectado ao servidor de Speech-to-Text'
  }));
});

// Tratamento de erros do servidor
wss.on('error', (error) => {
  console.error('❌ Erro no servidor WebSocket:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  wss.close();
  process.exit();
}); 