const speech = require('@google-cloud/speech');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configurações avançadas para controlar finalização
const ADVANCED_CONFIG_OPTIONS = {
  // 🚀 OPÇÃO 1: Modelo mais rápido (finaliza mais rápido)
  FAST_MODEL: {
    model: 'latest_short', // Modelo otimizado para respostas rápidas
    useEnhanced: true,     // Usar modelo melhorado
  },
  
  // 🎯 OPÇÃO 2: Configuração de contexto para acelerar reconhecimento
  SPEECH_CONTEXTS: {
    speechContexts: [
      {
        phrases: ['sim', 'não', 'ok', 'obrigado', 'por favor'], // Palavras comuns que aceleram reconhecimento
        boost: 20.0, // Aumenta probabilidade dessas palavras
      },
      {
        phrases: ['ponto', 'vírgula', 'parágrafo'], // Pontuação que força finalização
        boost: 15.0,
      }
    ],
  },
  
  // ⏱️ OPÇÃO 3: Configuração de palavra por palavra
  WORD_TIME_OFFSETS: {
    enableWordTimeOffsets: true,   // Timestamps por palavra
    enableWordConfidence: true,    // Confiança por palavra
    maxAlternatives: 1,           // Menos alternativas = mais rápido
  },
  
  // 🔤 OPÇÃO 4: Forçar finalização com pontuação
  PUNCTUATION_FORCING: {
    enableAutomaticPunctuation: true,
    profanityFilter: false,
    enableSpeakerDiarization: false, // Desabilitar para acelerar
  },
  
  // 📊 OPÇÃO 5: Configuração de adaptação
  ADAPTATION_CONFIG: {
    adaptation: {
      phraseSets: [
        {
          phrases: [
            { value: 'finalizar', boost: 10.0 },
            { value: 'confirmar', boost: 10.0 },
            { value: 'pronto', boost: 10.0 },
          ]
        }
      ]
    }
  }
};

// Função para criar configuração personalizada
function createCustomConfig(options = {}) {
  const baseConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'pt-BR',
    enableAutomaticPunctuation: true,
    model: 'latest_long',
  };
  
  // Mesclar configurações
  const customConfig = { ...baseConfig, ...options };
  
  console.log('🎯 Configuração personalizada:', JSON.stringify(customConfig, null, 2));
  
  return {
    config: customConfig,
    interimResults: true,
  };
}

// Diferentes perfis de configuração
const PROFILES = {
  // Perfil ULTRA-RÁPIDO - finaliza em ~1-2 segundos
  ULTRA_FAST: {
    model: 'latest_short',
    useEnhanced: true,
    maxAlternatives: 1,
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
    speechContexts: [
      {
        phrases: ['sim', 'não', 'ok', 'pronto', 'finalizar'],
        boost: 25.0,
      }
    ],
  },
  
  // Perfil RÁPIDO - finaliza em ~2-3 segundos
  FAST: {
    model: 'latest_short',
    useEnhanced: false,
    maxAlternatives: 2,
    enableAutomaticPunctuation: true,
    speechContexts: [
      {
        phrases: ['ponto', 'vírgula', 'parágrafo'],
        boost: 20.0,
      }
    ],
  },
  
  // Perfil BALANCEADO - finaliza em ~3-5 segundos (padrão atual)
  BALANCED: {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 3,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
  },
  
  // Perfil PRECISO - finaliza em ~5-8 segundos
  PRECISE: {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 5,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableWordTimeOffsets: true,
  }
};

// Função para servidor com configuração personalizada
function createAdvancedSpeechServer(profile = 'BALANCED') {
  const selectedProfile = PROFILES[profile];
  
  if (!selectedProfile) {
    console.error('❌ Perfil não encontrado:', profile);
    console.log('✅ Perfis disponíveis:', Object.keys(PROFILES));
    return;
  }
  
  console.log(`🎯 Usando perfil: ${profile}`);
  console.log('📋 Configurações:', JSON.stringify(selectedProfile, null, 2));
  
  // Configurar credenciais
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    console.error('❌ Arquivo de credenciais não encontrado:', credentialsPath);
    process.exit(1);
  }
  
  const speechClient = new speech.SpeechClient({
    keyFilename: credentialsPath,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  });
  
  // Configuração do streaming
  const streamingConfig = createCustomConfig(selectedProfile);
  
  // Servidor WebSocket
  const wss = new WebSocket.Server({ port: 8080 });
  
  console.log(`🎤 Servidor avançado iniciado na porta 8080 (Perfil: ${profile})`);
  
  wss.on('connection', (ws) => {
    console.log(`🔗 Nova conexão WebSocket (Perfil: ${profile})`);
    
    let recognizeStream = null;
    let finalResultCount = 0;
    let interimResultCount = 0;
    
    function startRecognitionStream() {
      console.log(`🚀 Iniciando stream com perfil ${profile}`);
      
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
            
            // Estatísticas
            if (isFinal) {
              finalResultCount++;
              console.log(`✅ [${profile}] Transcrição final #${finalResultCount}:`, transcript);
              console.log(`📊 Confiança: ${(confidence * 100).toFixed(1)}%`);
              
              ws.send(JSON.stringify({
                type: 'final',
                transcript: transcript,
                confidence: confidence,
                profile: profile,
                stats: { finalCount: finalResultCount, interimCount: interimResultCount }
              }));
              
              // Reset contador interim
              interimResultCount = 0;
            } else {
              interimResultCount++;
              console.log(`📝 [${profile}] Transcrição interim #${interimResultCount}:`, transcript);
              
              ws.send(JSON.stringify({
                type: 'interim',
                transcript: transcript,
                confidence: confidence,
                profile: profile,
                stats: { finalCount: finalResultCount, interimCount: interimResultCount }
              }));
            }
          }
        })
        .on('error', (error) => {
          console.error(`❌ [${profile}] Erro no reconhecimento:`, error);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message,
            profile: profile
          }));
        });
    }
    
    // Manipular mensagens
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'start':
            startRecognitionStream();
            ws.send(JSON.stringify({
              type: 'started',
              message: `Transcrição iniciada com perfil ${profile}`,
              profile: profile
            }));
            break;
            
          case 'audio':
            if (recognizeStream && !recognizeStream.destroyed) {
              const audioBuffer = Buffer.from(data.audio, 'base64');
              recognizeStream.write(audioBuffer);
            }
            break;
            
          case 'stop':
            if (recognizeStream) {
              recognizeStream.end();
            }
            ws.send(JSON.stringify({
              type: 'stopped',
              message: `Transcrição parada (Perfil: ${profile})`,
              profile: profile
            }));
            break;
        }
      } catch (error) {
        console.error(`❌ [${profile}] Erro ao processar mensagem:`, error);
      }
    });
    
    ws.on('close', () => {
      console.log(`🔌 [${profile}] Conexão fechada`);
      if (recognizeStream) {
        recognizeStream.end();
      }
    });
    
    // Enviar confirmação
    ws.send(JSON.stringify({
      type: 'connected',
      message: `Conectado ao servidor avançado (Perfil: ${profile})`,
      profile: profile,
      config: selectedProfile
    }));
  });
  
  return wss;
}

// Exportar para uso
module.exports = {
  PROFILES,
  ADVANCED_CONFIG_OPTIONS,
  createAdvancedSpeechServer,
  createCustomConfig
};

// Se executado diretamente
if (require.main === module) {
  const profile = process.argv[2] || 'BALANCED';
  console.log(`🎯 Iniciando servidor com perfil: ${profile}`);
  console.log('💡 Perfis disponíveis: ULTRA_FAST, FAST, BALANCED, PRECISE');
  
  createAdvancedSpeechServer(profile);
} 