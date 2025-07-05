const WebSocket = require('ws');

// Servidor de teste que simula o Google Cloud Speech-to-Text
const wss = new WebSocket.Server({ 
  port: 8080,
  perMessageDeflate: false 
});

console.log('🧪 Servidor de TESTE Speech-to-Text iniciado na porta 8080');
console.log('⚠️  Este é um servidor de teste que simula respostas');
console.log('🔧 Para usar o Google Cloud real, configure as credenciais');

wss.on('connection', (ws) => {
  console.log('🔗 Nova conexão WebSocket estabelecida');
  
  let isListening = false;
  let testInterval = null;

  // Enviar confirmação de conexão
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Conectado ao servidor de TESTE Speech-to-Text'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem recebida:', data.type);

      switch (data.type) {
        case 'start':
          console.log('▶️ Iniciando transcrição de teste...');
          isListening = true;
          
          // Enviar confirmação de início
          ws.send(JSON.stringify({
            type: 'started',
            message: 'Transcrição de teste iniciada'
          }));

          // Simular transcrições de teste
          let testPhrases = [
            'Olá, este é um teste',
            'O sistema está funcionando',
            'Capturando áudio simulado',
            'Transcrição em tempo real',
            'Teste concluído com sucesso'
          ];
          
          let phraseIndex = 0;
          
          testInterval = setInterval(() => {
            if (!isListening || phraseIndex >= testPhrases.length) {
              clearInterval(testInterval);
              return;
            }

            const phrase = testPhrases[phraseIndex];
            
            // Enviar resultado interim
            ws.send(JSON.stringify({
              type: 'interim',
              transcript: phrase,
              confidence: 0.8 + Math.random() * 0.2
            }));

            // Após 1 segundo, enviar resultado final
            setTimeout(() => {
              if (isListening) {
                ws.send(JSON.stringify({
                  type: 'final',
                  transcript: phrase,
                  confidence: 0.9 + Math.random() * 0.1
                }));
              }
            }, 1000);

            phraseIndex++;
          }, 3000);
          
          break;

        case 'stop':
          console.log('⏹️ Parando transcrição de teste...');
          isListening = false;
          if (testInterval) {
            clearInterval(testInterval);
            testInterval = null;
          }
          
          ws.send(JSON.stringify({
            type: 'stopped',
            message: 'Transcrição de teste parada'
          }));
          break;

        case 'audio':
          // Simular processamento de áudio
          if (isListening) {
            // Simular resposta mais frequente de transcrição
            if (Math.random() > 0.85) {
              const testWords = ['teste', 'áudio', 'funcionando', 'microfone', 'tela', 'captura', 'transcrição', 'tempo real'];
              const randomWord = testWords[Math.floor(Math.random() * testWords.length)];
              
              ws.send(JSON.stringify({
                type: 'interim',
                transcript: randomWord,
                confidence: 0.7 + Math.random() * 0.3
              }));
              
              // Após 2 segundos, enviar como final
              setTimeout(() => {
                if (isListening) {
                  ws.send(JSON.stringify({
                    type: 'final',
                    transcript: randomWord,
                    confidence: 0.8 + Math.random() * 0.2
                  }));
                }
              }, 2000);
            }
          }
          break;

        case 'test':
          ws.send(JSON.stringify({
            type: 'test_response',
            message: 'Servidor de teste funcionando!'
          }));
          break;

        default:
          console.log('🤷 Tipo de mensagem desconhecido:', data.type);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro no servidor de teste: ' + error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 Conexão WebSocket fechada');
    isListening = false;
    if (testInterval) {
      clearInterval(testInterval);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error.message);
  });
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor de teste...');
  wss.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor de teste...');
  wss.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
}); 