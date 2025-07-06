const WebSocket = require('ws');

// Teste para validar se os resultados interim estão sendo convertidos em finais
class TranscriptionTester {
  constructor() {
    this.ws = null;
    this.interimResults = [];
    this.finalResults = [];
    this.testStart = null;
  }

  connect() {
    console.log('🔗 Conectando ao servidor de transcrição...');
    this.ws = new WebSocket('ws://localhost:8080');
    
    this.ws.on('open', () => {
      console.log('✅ Conectado ao servidor');
      this.setupEventListeners();
      this.startTest();
    });

    this.ws.on('close', () => {
      console.log('🔌 Conexão fechada');
    });

    this.ws.on('error', (error) => {
      console.error('❌ Erro na conexão:', error.message);
    });
  }

  setupEventListeners() {
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    });
  }

  handleMessage(message) {
    const timestamp = new Date().toISOString().substring(11, 23);
    
    switch (message.type) {
      case 'connected':
        console.log(`[${timestamp}] 🎯 ${message.message}`);
        break;

      case 'started':
        console.log(`[${timestamp}] ▶️ ${message.message}`);
        this.testStart = Date.now();
        break;

      case 'interim':
        this.interimResults.push({
          transcript: message.transcript,
          confidence: message.confidence,
          timestamp: Date.now()
        });
        console.log(`[${timestamp}] 📝 INTERIM: "${message.transcript}" (confiança: ${(message.confidence * 100).toFixed(1)}%)`);
        break;

      case 'final':
        this.finalResults.push({
          transcript: message.transcript,
          confidence: message.confidence,
          timestamp: Date.now()
        });
        console.log(`[${timestamp}] ✅ FINAL: "${message.transcript}" (confiança: ${(message.confidence * 100).toFixed(1)}%)`);
        this.checkResultConversion();
        break;

      case 'stopped':
        console.log(`[${timestamp}] ⏹️ ${message.message}`);
        this.generateReport();
        break;

      case 'error':
        console.error(`[${timestamp}] ❌ ERRO: ${message.message}`);
        break;

      default:
        console.log(`[${timestamp}] 📨 ${message.type}:`, message.message || 'Sem mensagem');
    }
  }

  checkResultConversion() {
    // Verificar se resultados interim estão sendo convertidos em finais
    const recentInterims = this.interimResults.filter(interim => 
      Date.now() - interim.timestamp < 5000 // Últimos 5 segundos
    );

    if (recentInterims.length > 0 && this.finalResults.length > 0) {
      const lastFinal = this.finalResults[this.finalResults.length - 1];
      const matchingInterim = recentInterims.find(interim => 
        interim.transcript.includes(lastFinal.transcript.substring(0, 10)) ||
        lastFinal.transcript.includes(interim.transcript.substring(0, 10))
      );

      if (matchingInterim) {
        console.log(`🎯 ✅ SUCESSO: Resultado interim convertido em final!`);
        console.log(`   Interim: "${matchingInterim.transcript}"`);
        console.log(`   Final:   "${lastFinal.transcript}"`);
      }
    }
  }

  startTest() {
    console.log('\n🧪 Iniciando teste de conversão interim → final');
    console.log('📋 O teste irá:');
    console.log('   1. Iniciar transcrição');
    console.log('   2. Aguardar 65 segundos (forçar restart)');
    console.log('   3. Verificar se interims viram finais');
    console.log('   4. Gerar relatório\n');

    // Iniciar transcrição
    this.ws.send(JSON.stringify({ type: 'start' }));

    // Simular áudio de teste enviando dados a cada 100ms
    this.simulateAudio();

    // Parar após 65 segundos para testar o restart
    setTimeout(() => {
      console.log('\n⏰ Tempo de teste atingido - parando transcrição...');
      this.ws.send(JSON.stringify({ type: 'stop' }));
      
      setTimeout(() => {
        this.ws.close();
      }, 2000);
    }, 65000);
  }

  simulateAudio() {
    // Simular envio de dados de áudio em intervalos regulares
    const audioInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Enviar dados de áudio fake (base64 de zeros)
        const fakeAudio = Buffer.alloc(1024).toString('base64');
        this.ws.send(JSON.stringify({
          type: 'audio',
          audio: fakeAudio
        }));
      } else {
        clearInterval(audioInterval);
      }
    }, 100);

    // Parar simulação após 64 segundos
    setTimeout(() => {
      clearInterval(audioInterval);
    }, 64000);
  }

  generateReport() {
    const testDuration = Date.now() - this.testStart;
    
    console.log('\n📊 RELATÓRIO DO TESTE');
    console.log('='.repeat(50));
    console.log(`⏱️  Duração do teste: ${(testDuration / 1000).toFixed(1)}s`);
    console.log(`📝 Resultados interim: ${this.interimResults.length}`);
    console.log(`✅ Resultados finais: ${this.finalResults.length}`);
    
    if (this.finalResults.length > 0) {
      const avgConfidence = this.finalResults.reduce((sum, result) => sum + result.confidence, 0) / this.finalResults.length;
      console.log(`🎯 Confiança média: ${(avgConfidence * 100).toFixed(1)}%`);
    }

    // Verificar se houve conversão de interim para final
    const conversions = this.finalResults.filter(final => {
      return this.interimResults.some(interim => 
        interim.transcript.toLowerCase().includes(final.transcript.toLowerCase().substring(0, 5)) ||
        final.transcript.toLowerCase().includes(interim.transcript.toLowerCase().substring(0, 5))
      );
    });

    console.log(`🔄 Conversões interim→final detectadas: ${conversions.length}`);
    
    if (conversions.length > 0) {
      console.log('✅ TESTE APROVADO: Resultados interim estão sendo convertidos em finais!');
    } else {
      console.log('⚠️  ATENÇÃO: Nenhuma conversão interim→final detectada');
    }

    console.log('\n📋 Últimos resultados:');
    this.finalResults.slice(-3).forEach((result, index) => {
      console.log(`   ${index + 1}. "${result.transcript}" (${(result.confidence * 100).toFixed(1)}%)`);
    });
  }
}

// Executar teste
console.log('🧪 TESTE DE CONVERSÃO INTERIM → FINAL');
console.log('====================================\n');

const tester = new TranscriptionTester();
tester.connect();

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('\n🛑 Teste interrompido pelo usuário');
  process.exit(0);
}); 