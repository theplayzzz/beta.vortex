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
  const STREAM_LIMIT_MS = 58000; // 58s para ficar seguro dentro do limite de 60s do Google
  let restartTimeout = null;
  let isTranscriptionActive = false; // Controla se a transcrição deve continuar ativa
  let lastRestartTime = 0; // Previne restarts muito frequentes
  const MIN_RESTART_INTERVAL = 5000; // Mínimo 5s entre restarts

  // Configuração do reconhecimento de áudio - STREAMING ESTÁVEL
  const audioConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'pt-BR', // Português brasileiro
    enableAutomaticPunctuation: true,
    model: 'default',             // ← Modelo padrão mais estável
    useEnhanced: true,            // ← Usar versão melhorada
    maxAlternatives: 1,           // ← Menos alternativas = mais eficiente
    enableWordTimeOffsets: false, // ← Desabilitado para performance
    enableWordConfidence: false,  // ← Desabilitado para performance
    profanityFilter: false,       // ← Desabilitado para performance
  };

  const streamingConfig = {
    config: audioConfig,
    interimResults: true,
  };

  function startRecognitionStream() {
    const timeSinceLastRestart = Date.now() - lastRestartTime;
    console.log(`🚀 Iniciando novo stream de reconhecimento (${timeSinceLastRestart}ms desde último restart)`);
    
    // Limpar stream anterior adequadamente
    if (recognizeStream) {
      console.log('🧹 Limpando stream anterior antes de criar novo');
      try {
        // Remover listeners para evitar vazamentos
        recognizeStream.removeAllListeners();
        
        // Finalizar stream apenas se ainda não foi finalizado
        if (!recognizeStream.destroyed && !recognizeStream.writableEnded) {
          recognizeStream.end();
        }
      } catch (error) {
        console.error('⚠️ Erro ao limpar stream anterior:', error.message);
      }
      
      recognizeStream = null; // Limpar referência
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
            
            // 🎯 CORREÇÃO: NÃO reiniciar stream após resultado final
            // O stream deve permanecer ativo para transcrição contínua fluida
            console.log('🎧 Stream permanece ativo aguardando próxima fala (transcrição contínua)');
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
        const streamDuration = Date.now() - streamStartTime;
        console.log(`📝 Stream de reconhecimento finalizado (duração: ${streamDuration}ms)`);
        console.log(`🔍 Evento 'end' disparado - verificando se deve reiniciar...`);
        
        // 🔄 VERIFICAÇÕES PARA EVITAR LOOP INFINITO
        const timeSinceLastRestart = Date.now() - lastRestartTime;
        
        // 🎯 MELHORIA: Verificar se já existe um listener específico (timeout ou force-finalize)
        const hasSpecificHandler = recognizeStream && recognizeStream.listenerCount('end') > 1;
        
        const shouldRestart = isTranscriptionActive && 
                             ws.readyState === WebSocket.OPEN && 
                             timeSinceLastRestart >= MIN_RESTART_INTERVAL &&
                             streamDuration >= 1000 && // Stream deve durar pelo menos 1s
                             !hasSpecificHandler; // Não reiniciar se há handler específico
        
        console.log(`🔍 Condições para restart automático:`);
        console.log(`   - isTranscriptionActive: ${isTranscriptionActive}`);
        console.log(`   - ws.readyState === WebSocket.OPEN: ${ws.readyState === WebSocket.OPEN}`);
        console.log(`   - timeSinceLastRestart >= MIN_RESTART_INTERVAL: ${timeSinceLastRestart}ms >= ${MIN_RESTART_INTERVAL}ms = ${timeSinceLastRestart >= MIN_RESTART_INTERVAL}`);
        console.log(`   - streamDuration >= 1000: ${streamDuration}ms >= 1000ms = ${streamDuration >= 1000}`);
        console.log(`   - hasSpecificHandler: ${hasSpecificHandler}`);
        console.log(`   - shouldRestart: ${shouldRestart}`);
        
        if (shouldRestart) {
          console.log(`🔄 Reiniciando stream automaticamente (última tentativa há ${timeSinceLastRestart}ms)`);
          lastRestartTime = Date.now();
          setTimeout(() => {
            startRecognitionStream();
          }, 100);
        } else if (!isTranscriptionActive) {
          console.log('⏹️ Transcrição foi parada, não reiniciando stream');
        } else if (timeSinceLastRestart < MIN_RESTART_INTERVAL) {
          console.log(`⚠️ Restart automático bloqueado - muito frequente (${timeSinceLastRestart}ms < ${MIN_RESTART_INTERVAL}ms)`);
        } else if (streamDuration < 1000) {
          console.log(`⚠️ Restart automático bloqueado - stream muito curto (${streamDuration}ms)`);
        } else if (hasSpecificHandler) {
          console.log(`⚠️ Restart automático bloqueado - handler específico ativo`);
        }
      });

    streamStartTime = Date.now();
    
    // Configurar restart automático antes do limite
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
        console.log('⏰ Limite de tempo atingido (58s) - forçando resultados finais antes de reiniciar');
        
        // 🎯 CORREÇÃO: Forçar resultados finais antes do restart
        if (recognizeStream && !recognizeStream.destroyed && !recognizeStream.writableEnded) {
          // Aguardar evento 'end' para reiniciar após processar resultados finais
          const handleTimeLimitEnd = () => {
            console.log('✅ Resultados finais processados após limite de tempo - reiniciando stream');
            recognizeStream.removeListener('end', handleTimeLimitEnd);
            
            if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
              lastRestartTime = Date.now();
              startRecognitionStream();
            }
          };
          
          recognizeStream.once('end', handleTimeLimitEnd);
          
          // Encerrar stream limpo para forçar resultados finais
          console.log('🔄 Encerrando stream atual para forçar processamento de resultados finais');
          recognizeStream.end();
        } else {
          // Stream já foi encerrado, reiniciar diretamente
          console.log('🔄 Stream já encerrado - reiniciando diretamente');
          lastRestartTime = Date.now();
          startRecognitionStream();
        }
      }
    }, STREAM_LIMIT_MS);
  }

  // Manipular mensagens do frontend
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem recebida do frontend:', data.type);
      
      switch (data.type) {
        case 'start':
          console.log('🎙️ Iniciando transcrição CONTÍNUA');
          isTranscriptionActive = true; // Ativar transcrição contínua
          lastRestartTime = Date.now(); // Inicializar controle de restart
          startRecognitionStream();
          ws.send(JSON.stringify({
            type: 'started',
            message: 'Transcrição contínua iniciada no Google Cloud'
          }));
          break;
          
        case 'audio':
          if (recognizeStream && !recognizeStream.destroyed && !recognizeStream.writableEnded) {
            try {
              // Converter audio base64 para buffer e enviar para Google
              const audioBuffer = Buffer.from(data.audio, 'base64');
              recognizeStream.write(audioBuffer);
            } catch (error) {
              console.error('❌ Erro ao escrever áudio no stream:', error.message);
              // Se o stream não está mais disponível, tentar reiniciar
              if (isTranscriptionActive && ws.readyState === WebSocket.OPEN) {
                console.log('🔄 Reiniciando stream devido a erro de escrita');
                lastRestartTime = Date.now();
                startRecognitionStream();
              }
            }
          }
          break;
          
        case 'stop':
          console.log('⏹️ Parando transcrição CONTÍNUA');
          isTranscriptionActive = false; // Desativar transcrição contínua
          if (recognizeStream) {
            try {
              console.log('🧹 Finalizando stream ao parar transcrição');
              recognizeStream.removeAllListeners();
              if (!recognizeStream.destroyed && !recognizeStream.writableEnded) {
                recognizeStream.end();
              }
            } catch (error) {
              console.error('⚠️ Erro ao finalizar stream:', error.message);
            }
            recognizeStream = null;
          }
          if (restartTimeout) {
            clearTimeout(restartTimeout);
          }
          ws.send(JSON.stringify({
            type: 'stopped',
            message: 'Transcrição contínua parada'
          }));
          break;

        case 'force-finalize':
          console.log('🧠 Forçando finalização para análise de contexto');
          console.log('🔍 Estado atual - recognizeStream existe:', !!recognizeStream);
          console.log('🔍 Estado atual - isTranscriptionActive:', isTranscriptionActive);
          
          if (isTranscriptionActive && ws.readyState === WebSocket.OPEN && recognizeStream) {
            // Enviar confirmação para frontend
            ws.send(JSON.stringify({
              type: 'force-finalize-started',
              message: 'Forçando finalização - aguardando evento end'
            }));
            
            // ⭐ NOVA ABORDAGEM: Aguardar evento 'end' para reiniciar
            console.log('🔄 Finalizando stream atual e aguardando evento end para restart');
            
            // Listener único para este force-finalize
            const handleForcedEnd = () => {
              console.log('📝 Evento end recebido após force-finalize - reiniciando agora');
              
              // Remover este listener
              if (recognizeStream) {
                recognizeStream.removeListener('end', handleForcedEnd);
              }
              
              // Reiniciar imediatamente sem verificar MIN_RESTART_INTERVAL
              if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
                console.log('🚀 Reiniciando stream após force-finalize (bypass MIN_RESTART_INTERVAL)');
                lastRestartTime = Date.now();
                startRecognitionStream();
                
                // Confirmar reinicio
                setTimeout(() => {
                  if (ws.readyState === WebSocket.OPEN && isTranscriptionActive) {
                    console.log('✅ Finalização forçada concluída - stream reiniciado após evento end');
                    ws.send(JSON.stringify({
                      type: 'force-finalize-completed',
                      message: 'Stream reiniciado após finalização forçada'
                    }));
                  }
                }, 100);
              }
            };
            
            // Adicionar listener temporário para este force-finalize
            recognizeStream.once('end', handleForcedEnd);
            
            // Finalizar stream atual (isso dispara evento 'end')
            console.log('📤 Finalizando stream atual - isso deve disparar evento end');
            try {
              if (!recognizeStream.destroyed && !recognizeStream.writableEnded) {
                recognizeStream.end();
              } else {
                console.log('⚠️ Stream já finalizado, disparando evento manualmente');
                // Se o stream já foi finalizado, disparar o handler manualmente
                handleForcedEnd();
              }
            } catch (error) {
              console.error('❌ Erro ao finalizar stream no force-finalize:', error.message);
              // Em caso de erro, disparar handler para continuar o processo
              handleForcedEnd();
            }
            
          } else {
            console.log('⚠️ Condições não atendidas para force-finalize');
            console.log('   - isTranscriptionActive:', isTranscriptionActive);
            console.log('   - ws.readyState === WebSocket.OPEN:', ws.readyState === WebSocket.OPEN);
            console.log('   - recognizeStream existe:', !!recognizeStream);
            
            ws.send(JSON.stringify({
              type: 'force-finalize-error',
              message: 'Condições não atendidas para forçar finalização'
            }));
          }
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
    isTranscriptionActive = false; // Desativar transcrição contínua
    if (recognizeStream) {
      try {
        console.log('🧹 Limpando stream ao fechar conexão');
        recognizeStream.removeAllListeners();
        if (!recognizeStream.destroyed && !recognizeStream.writableEnded) {
          recognizeStream.end();
        }
      } catch (error) {
        console.error('⚠️ Erro ao limpar stream no fechamento:', error.message);
      }
      recognizeStream = null;
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