const WebSocket = require('ws');
const { createClient } = require('@deepgram/sdk');
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

// Verificar se API Key do Deepgram está configurada
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
  console.error('❌ DEEPGRAM_API_KEY não encontrada no .env.local');
  console.error('💡 Adicione: DEEPGRAM_API_KEY=sua_nova_api_key');
  process.exit(1);
}

console.log('✅ Nova API Key Deepgram configurada:', deepgramApiKey.substring(0, 8) + '...');

// Criar cliente Deepgram com configuração otimizada
let deepgram;
try {
  deepgram = createClient(deepgramApiKey);
  console.log('✅ Cliente Deepgram criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar cliente Deepgram:', error.message);
  process.exit(1);
}

// Configuração do servidor WebSocket
const wss = new WebSocket.Server({ 
  port: 8080,
  perMessageDeflate: false 
});

console.log('🎤 Servidor Deepgram Speech-to-Text (versão atualizada) na porta 8080');

// Configuração Deepgram baseada na documentação oficial
const DEEPGRAM_CONFIG = {
  // Configurações básicas
  language: 'pt',               // Português
  model: 'nova-2',              // Modelo mais recente
  smart_format: true,           // Formatação inteligente
  interim_results: true,        // Resultados parciais
  
  // Configurações de pontuação e formatação
  punctuate: true,              // Pontuação automática
  numerals: false,              // Números como texto
  profanity_filter: false,      // Sem filtro de palavrões
  
  // Configurações de áudio
  encoding: 'linear16',         // PCM 16-bit
  sample_rate: 16000,           // 16kHz
  channels: 1,                  // Mono
  
  // Configurações de latência e finalização
  endpointing: 300,             // 300ms para finalizar
  utterance_end_ms: 1000,       // 1s de silêncio para utterance
  vad_events: true,             // Eventos de detecção de voz
  
  // Configurações de alternativas
  alternatives: 1,              // Apenas 1 alternativa
  
  // Configurações de velocidade
  no_delay: true,               // Sem delay adicional
  
  // Configurações específicas para português brasileiro
  version: 'latest',            // Versão mais recente
  tier: 'nova',                 // Tier Nova (mais rápido)
  
  // Configurações de callback (opcional)
  // callback: 'https://seu-webhook.com/callback',
  // callback_method: 'POST',
};

console.log('🔧 Configuração Deepgram otimizada:', JSON.stringify(DEEPGRAM_CONFIG, null, 2));

// Estatísticas globais
let totalConnections = 0;
let activeConnections = 0;
let totalTranscriptions = 0;
let totalErrors = 0;

// Testar conectividade na inicialização
async function testConnectivity() {
  console.log('🧪 Testando conectividade com nova API key...');
  
  try {
    // Testar endpoint de projetos
    const { result, error } = await deepgram.manage.getProjects();
    
    if (error) {
      console.error('❌ Erro de API:', error.message);
      return false;
    }
    
    if (result && result.projects) {
      console.log('✅ Conectividade funcionando!');
      console.log('📊 Projetos encontrados:', result.projects.length);
      return true;
    }
    
    return false;
  } catch (connectError) {
    console.error('❌ Erro de conectividade:', connectError.message);
    return false;
  }
}

// Variável para controlar se a API está funcionando
let apiWorking = false;

wss.on('listening', () => {
  console.log('✅ Servidor WebSocket ouvindo na porta 8080');
  console.log('📋 Modo: Speech-to-Text em tempo real');
  console.log('🎯 Endpoint: wss://api.deepgram.com/v1/listen');
});

wss.on('connection', (ws, req) => {
  totalConnections++;
  activeConnections++;
  console.log(`🔗 Nova conexão WebSocket (${activeConnections} ativas, ${totalConnections} total)`);
  
  let deepgramConnection = null;
  let isTranscriptionActive = false;
  let connectionStartTime = Date.now();
  let lastAudioChunk = Date.now();
  let transcriptionStats = {
    duration: 0,
    interimResults: 0,
    finalResults: 0,
    audioChunks: 0,
    errors: 0
  };

  // Função para criar conexão Deepgram
  function createDeepgramConnection() {
    if (!apiWorking) {
      console.log('⚠️ API não está funcionando - transcrições não estarão disponíveis');
      return null;
    }
    
    try {
      console.log('🚀 Criando conexão live com Deepgram...');
      console.log('🔧 Usando configuração:', DEEPGRAM_CONFIG);
      
      // Criar conexão live com Deepgram
      const dgConnection = deepgram.listen.live(DEEPGRAM_CONFIG);
      
      // Configurar listeners da conexão Deepgram
      dgConnection.on('open', () => {
        console.log('✅ Conexão Deepgram estabelecida com sucesso');
        ws.send(JSON.stringify({
          type: 'deepgram_connected',
          message: 'Conectado ao Deepgram com sucesso',
          provider: 'deepgram',
          model: DEEPGRAM_CONFIG.model,
          config: DEEPGRAM_CONFIG,
          api_version: 'v1'
        }));
      });

      dgConnection.on('results', (data) => {
        console.log('📨 Resultado recebido do Deepgram');
        
        if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
          const alternative = data.channel.alternatives[0];
          const transcript = alternative.transcript;
          const confidence = alternative.confidence || 0;
          const isFinal = data.is_final;
          
          // Verificar se é speech_final para melhor latência
          const speechFinal = data.speech_final || false;

          console.log(`📝 Transcrição ${isFinal ? 'FINAL' : 'INTERIM'} ${speechFinal ? '(SPEECH_FINAL)' : ''}: "${transcript}" (confiança: ${(confidence * 100).toFixed(1)}%)`);

          if (transcript && transcript.trim()) {
            if (isFinal) {
              transcriptionStats.finalResults++;
              
              ws.send(JSON.stringify({
                type: 'final',
                transcript: transcript,
                confidence: confidence,
                provider: 'deepgram',
                model: DEEPGRAM_CONFIG.model,
                timestamp: Date.now(),
                speech_final: speechFinal,
                api_version: 'v1'
              }));
              
              console.log(`✅ Transcrição final enviada: "${transcript}"`);
            } else {
              transcriptionStats.interimResults++;
              
              ws.send(JSON.stringify({
                type: 'interim',
                transcript: transcript,
                confidence: confidence,
                provider: 'deepgram',
                model: DEEPGRAM_CONFIG.model,
                timestamp: Date.now(),
                api_version: 'v1'
              }));
              
              console.log(`📝 Transcrição interim enviada: "${transcript}"`);
            }
          } else {
            console.log('⚠️ Transcrição vazia recebida do Deepgram');
          }
        } else {
          console.log('⚠️ Estrutura de dados inesperada do Deepgram:', data);
        }
      });

      dgConnection.on('error', (error) => {
        console.error('❌ Erro na conexão Deepgram:', error);
        transcriptionStats.errors++;
        totalErrors++;
        
        ws.send(JSON.stringify({
          type: 'error',
          message: `Erro Deepgram: ${error.message || 'Erro desconhecido'}`,
          provider: 'deepgram',
          api_version: 'v1'
        }));
      });

      dgConnection.on('close', (closeEvent) => {
        console.log('🔌 Conexão Deepgram fechada:', closeEvent);
      });

      dgConnection.on('warning', (warning) => {
        console.warn('⚠️ Aviso Deepgram:', warning);
      });

      dgConnection.on('metadata', (metadata) => {
        console.log('📋 Metadata Deepgram:', metadata);
      });

      return dgConnection;
    } catch (error) {
      console.error('❌ Erro ao criar conexão Deepgram:', error);
      transcriptionStats.errors++;
      totalErrors++;
      
      ws.send(JSON.stringify({
        type: 'error',
        message: `Erro ao conectar: ${error.message}`,
        provider: 'deepgram',
        api_version: 'v1'
      }));
      
      return null;
    }
  }

  // Manipular mensagens do frontend
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Log apenas para comandos, não para audio
      if (data.type !== 'audio') {
        console.log('📨 Comando recebido:', data.type);
      }
      
      switch (data.type) {
        case 'start':
          console.log('🎙️ Iniciando transcrição Deepgram');
          
          if (!deepgramConnection) {
            deepgramConnection = createDeepgramConnection();
          }
          
          if (deepgramConnection) {
            isTranscriptionActive = true;
            transcriptionStats.duration = Date.now();
            totalTranscriptions++;
            
            ws.send(JSON.stringify({
              type: 'started',
              message: 'Transcrição Deepgram iniciada',
              provider: 'deepgram',
              model: DEEPGRAM_CONFIG.model,
              api_working: apiWorking,
              api_version: 'v1'
            }));
            
            console.log('✅ Transcrição iniciada - aguardando áudio...');
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Falha ao conectar com Deepgram - verifique conectividade',
              provider: 'deepgram',
              api_working: apiWorking,
              api_version: 'v1'
            }));
          }
          break;
          
        case 'audio':
          if (deepgramConnection && isTranscriptionActive) {
            try {
              // Converter audio base64 para buffer e enviar para Deepgram
              const audioBuffer = Buffer.from(data.audio, 'base64');
              
              if (audioBuffer.length > 0) {
                deepgramConnection.send(audioBuffer);
                transcriptionStats.audioChunks++;
                lastAudioChunk = Date.now();
                
                // Log ocasional para monitoramento
                if (transcriptionStats.audioChunks % 100 === 0) {
                  console.log(`📊 Chunks de áudio enviados: ${transcriptionStats.audioChunks}`);
                }
              } else {
                console.warn('⚠️ Chunk de áudio vazio recebido');
              }
            } catch (error) {
              console.error('❌ Erro ao enviar áudio para Deepgram:', error.message);
              transcriptionStats.errors++;
            }
          } else {
            console.warn('⚠️ Áudio recebido mas transcrição não está ativa');
          }
          break;
          
        case 'stop':
          console.log('⏹️ Parando transcrição Deepgram');
          isTranscriptionActive = false;
          
          if (deepgramConnection) {
            try {
              console.log('🔄 Finalizando conexão Deepgram...');
              deepgramConnection.finish();
            } catch (error) {
              console.error('❌ Erro ao finalizar conexão Deepgram:', error);
            }
            deepgramConnection = null;
          }
          
          // Calcular duração final
          if (transcriptionStats.duration > 0) {
            transcriptionStats.duration = Date.now() - transcriptionStats.duration;
          }
          
          console.log('📊 Estatísticas da sessão:', transcriptionStats);
          
          ws.send(JSON.stringify({
            type: 'stopped',
            message: 'Transcrição Deepgram parada',
            provider: 'deepgram',
            stats: transcriptionStats,
            api_working: apiWorking,
            api_version: 'v1'
          }));
          break;

        case 'force-finalize':
          console.log('🎯 Force-finalize solicitado para Deepgram');
          
          if (deepgramConnection && isTranscriptionActive) {
            try {
              ws.send(JSON.stringify({
                type: 'force-finalize-started',
                message: 'Iniciando finalização forçada',
                provider: 'deepgram',
                api_version: 'v1'
              }));

              // Finalizar conexão atual e criar nova
              const oldConnection = deepgramConnection;
              
              console.log('🔄 Finalizando conexão atual para force-finalize...');
              oldConnection.finish();
              
              // Aguardar e criar nova conexão
              setTimeout(() => {
                console.log('🔄 Criando nova conexão após force-finalize...');
                deepgramConnection = createDeepgramConnection();
                
                if (deepgramConnection) {
                  ws.send(JSON.stringify({
                    type: 'force-finalize-completed',
                    message: 'Finalização forçada concluída, stream reiniciado',
                    provider: 'deepgram',
                    api_version: 'v1'
                  }));
                  console.log('✅ Force-finalize concluído com sucesso');
                } else {
                  ws.send(JSON.stringify({
                    type: 'force-finalize-error',
                    message: 'Erro ao reiniciar stream após finalização forçada',
                    provider: 'deepgram',
                    api_version: 'v1'
                  }));
                  console.error('❌ Erro ao reiniciar stream após force-finalize');
                }
              }, 500);
              
            } catch (error) {
              console.error('❌ Erro no force-finalize:', error);
              ws.send(JSON.stringify({
                type: 'force-finalize-error',
                message: `Erro na finalização forçada: ${error.message}`,
                provider: 'deepgram',
                api_version: 'v1'
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'force-finalize-error',
              message: 'Transcrição não está ativa',
              provider: 'deepgram',
              api_version: 'v1'
            }));
          }
          break;
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      transcriptionStats.errors++;
      
      ws.send(JSON.stringify({
        type: 'error',
        message: `Erro ao processar comando: ${error.message}`,
        provider: 'deepgram',
        api_version: 'v1'
      }));
    }
  });

  ws.on('close', () => {
    activeConnections--;
    console.log(`🔌 Conexão WebSocket fechada (${activeConnections} ativas restantes)`);
    
    // Limpar conexão Deepgram se ainda estiver ativa
    if (deepgramConnection) {
      try {
        console.log('🧹 Limpando conexão Deepgram...');
        deepgramConnection.finish();
      } catch (error) {
        console.error('❌ Erro ao fechar conexão Deepgram:', error);
      }
      deepgramConnection = null;
    }
    
    // Log final das estatísticas
    console.log('📊 Estatísticas finais da conexão:', transcriptionStats);
  });

  ws.on('error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error);
    transcriptionStats.errors++;
  });

  // Enviar confirmação de conexão
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Conectado ao servidor Deepgram Speech-to-Text (versão atualizada)',
    provider: 'deepgram',
    model: DEEPGRAM_CONFIG.model,
    config: {
      language: DEEPGRAM_CONFIG.language,
      model: DEEPGRAM_CONFIG.model,
      interim_results: DEEPGRAM_CONFIG.interim_results,
      smart_format: DEEPGRAM_CONFIG.smart_format
    },
    server_info: {
      totalConnections,
      activeConnections,
      api_working: apiWorking,
      api_version: 'v1'
    }
  }));
});

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
  console.error('💥 Erro não tratado:', error.message);
  console.error('🔍 Stack trace:', error.stack);
  console.log('🔄 Servidor continua rodando...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Promise rejeitada:', reason);
  console.error('🔍 Promise:', promise);
  console.log('🔄 Servidor continua rodando...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  
  // Fechar todas as conexões WebSocket
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'server_shutdown',
        message: 'Servidor sendo encerrado'
      }));
      ws.close();
    }
  });
  
  // Fechar servidor WebSocket
  wss.close(() => {
    console.log('✅ Servidor WebSocket fechado');
    process.exit(0);
  });
});

// Inicializar servidor
(async () => {
  console.log('🎯 Servidor Deepgram Speech-to-Text iniciado');
  console.log('🔧 Configuração baseada na documentação oficial');
  console.log('📚 Documentação: https://developers.deepgram.com/reference/listen-live');
  
  // Testar conectividade
  apiWorking = await testConnectivity();
  
  if (apiWorking) {
    console.log('✅ API funcionando! Servidor pronto para transcrições em tempo real');
  } else {
    console.log('⚠️ API não está acessível - servidor funcionará sem transcrições');
    console.log('💡 Verifique conectividade de rede e firewall');
  }
})(); 