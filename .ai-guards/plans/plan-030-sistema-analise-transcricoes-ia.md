---
id: plan-030
title: Sistema de Análise de Transcrições com IA
createdAt: 2025-07-05
author: theplayzzz
status: draft
---

## 🧩 Scope

Integrar o botão de análise existente com funcionalidade que envia o contexto atual das transcrições para webhook de IA e apresenta a resposta em tempo real no frontend. O sistema deve finalizar transcrições interim, gerar transcrições finais, manter o stream ativo para transcrição contínua, e mostrar as respostas da IA diretamente na interface.

## 📍 Página de Implementação

**Rota:** `/coach/capture/google-cloud`

**Arquivos Envolvidos:**
- `app/coach/capture/google-cloud/page.tsx` - Página principal
- `app/coach/capture/components/GoogleCloudTranscriptionDisplay.tsx` - Componente principal
- `app/coach/capture/lib/useGoogleCloudTranscription.ts` - Hook de funcionalidades

## 🎯 Componentes Existentes

### Interface Atual
A página já possui uma interface completa com:
- **Coluna Esquerda:** Controles de transcrição e área de exibição
- **Coluna Direita:** Textarea para implementação da nova funcionalidade

### Botão de Análise (Já Implementado)
```javascript
// Localizado em: GoogleCloudTranscriptionDisplay.tsx (linha ~210)
<button
  onClick={handleContextAnalysis}
  className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs"
  style={{
    backgroundColor: 'rgba(207, 198, 254, 0.2)',
    border: '1px solid var(--periwinkle)',
    color: 'var(--periwinkle)'
  }}
>
  🧠 ANÁLISE
</button>
```

### Textarea de Destino (Já Implementado)
```javascript
// Localizado em: GoogleCloudTranscriptionDisplay.tsx (linha ~405)
<textarea
  value={newFieldText}
  onChange={(e) => setNewFieldText(e.target.value)}
  placeholder="Campo para nova implementação da ferramenta..."
  className="w-full h-full p-4 rounded-xl resize-none"
  style={{
    backgroundColor: 'var(--night)',
    border: '1px solid rgba(249, 251, 252, 0.1)',
    color: 'var(--seasalt)',
    minHeight: 'calc(100vh - 12rem)'
  }}
/>
```

## 🔧 Funcionalidades Disponíveis

### Sistema de Ciclos Automáticos (55s)
O servidor WebSocket já possui um **ciclo automático** que a cada 55 segundos:
1. **Finaliza automaticamente** transcrições interim pendentes
2. **Gera transcrição final** e adiciona ao `transcript`
3. **Reinicia o stream** automaticamente (transcrição contínua)
4. **Mantém captura ativa** sem interrupções

### Comandos WebSocket Existentes
- `start`: Inicia transcrição contínua
- `stop`: Para transcrição contínua  
- `audio`: Envia dados de áudio

### Proposta: Novo Comando `force-finalize`
Precisamos adicionar um comando que **force o mesmo ciclo** que acontece naturalmente:
```javascript
// Novo comando para forçar finalização manual
{
  type: 'force-finalize',
  reason: 'user-analysis'
}
```

### Hook useGoogleCloudTranscription
O hook já fornece:
- `transcript` - Transcrições finais (acumuladas)
- `interimTranscript` - Transcrições em andamento
- `isListening` - Status da gravação
- `isConnected` - Status da conexão WebSocket
- `confidence` - Nível de confiança da transcrição
- `startListening()` - Iniciar transcrição
- `stopListening()` - Parar transcrição
- `clearTranscript()` - Limpar transcrições

### Sistema de Transcrição Atual
- **WebSocket:** Conecta em `ws://localhost:8080`
- **Captura:** Microfone + Tela (ambos configuráveis)
- **Processamento:** Google Cloud Speech-to-Text
- **Estados:** Interim (temporário) e Final (definitivo)
- **Ciclo:** Auto-reinício a cada 55s para manter stream ativo

## ✅ Functional Requirements

- Integrar botão "🧠 ANÁLISE" existente com funcionalidade de análise
- Finalização automática de transcrições interim ao clicar no botão
- Geração de transcrições finais mantendo stream ativo
- Coleta e organização de todas as transcrições finais do frontend
- Envio de contexto compilado para webhook de agente de IA
- Captura e apresentação de resposta do webhook em tempo real
- Mostrar respostas diretamente no textarea existente (`newFieldText`)
- Continuidade da transcrição após análise (stream permanece ativo)
- Funcionalidade repetível a cada clique do botão

## ⚙️ Non-Functional Requirements

- Performance: Processamento de análise em < 3 segundos
- Security: Validação de dados antes do envio ao webhook
- Scalability: Suporte a múltiplas análises consecutivas
- Usability: Interface responsiva e feedback visual claro em tempo real
- Reliability: Manutenção do stream de transcrição durante todo o processo

## 📚 Guidelines & Packages

- Seguir regras de design e cores do projeto (Paleta Night/Eerie Black/SGBUS Green/Seasalt/Periwinkle)
- Usar variáveis CSS obrigatórias para cores
- Implementar transições suaves (0.2s ease)
- Manter acessibilidade com contraste adequado
- Usar fetch API para comunicação com webhook
- Implementar loading states e error handling
- Foco em simplicidade e resposta em tempo real

## 🔐 Threat Model (Stub)

- Validação de entrada para prevenir XSS em transcrições
- Sanitização de dados antes do envio ao webhook
- Rate limiting para evitar spam no botão de análise
- Timeout para chamadas do webhook (max 30s)
- Validação de resposta do webhook antes da apresentação

## 🌐 Webhook de IA Configurado

### Endpoint Disponível
```
URL: https://webhook.lucasfelix.com/webhook/Analise_venda_beta
Método: POST
```

### Resposta Padrão Atual
O webhook está configurado para retornar uma mensagem padrão:
```
"analise_resposta recebida com sucesso, webhook funcionando"
```

### Teste de Funcionamento
- **Sucesso**: Quando a resposta padrão aparecer no textarea
- **Payload**: Enviar contexto das transcrições coletadas
- **Validação**: Confirmar que webhook está recebendo e respondendo

## 🔢 Execution Plan

1. **Adicionar Comando force-finalize ao Servidor**
   - Modificar `server/speech-server.js`
   - Adicionar case `force-finalize` no switch de mensagens
   - Implementar mesma lógica do timeout de 55s

2. **Criar Função forceFinalize no Hook**
   - Adicionar nova função `forceFinalize()` no hook
   - Enviar comando `force-finalize` via WebSocket
   - Manter todas as outras funcionalidades ativas

3. **Modificar Função handleContextAnalysis**
   - Integrar `forceFinalize()` no botão existente
   - Coletar contexto após finalização forçada
   - Aguardar o ciclo natural de finalização

4. **Implementar Coleta de Contexto**
   - Aguardar evento `final` do WebSocket após `force-finalize`
   - Coletar `transcript` + última transcrição final
   - Organizar dados em formato JSON para webhook

5. **Integrar Webhook https://webhook.lucasfelix.com/webhook/Analise_venda_beta**
   - Configurar fetch POST para endpoint específico
   - Enviar contexto coletado como payload
   - Aguardar resposta: "analise_resposta recebida com sucesso, webhook funcionando"
   - **Executar em paralelo** com a captura contínua

6. **Implementar Resposta em Tempo Real**
   - Usar state `newFieldText` e `setNewFieldText` existentes
   - Mostrar resposta do webhook diretamente no textarea
   - Implementar feedback visual durante o processamento

7. **Adicionar Estados de Feedback**
   - Implementar loading state no botão durante análise
   - Indicar "Enviando para análise..." e "Aguardando resposta..."
   - Mostrar "Webhook funcionando!" quando resposta padrão chegar

8. **Testes e Validação**
   - Testar comando `force-finalize` isoladamente
   - Validar envio para webhook e recebimento da resposta padrão
   - Verificar acúmulo de contexto em múltiplas análises consecutivas

## 🎯 Implementação Detalhada

### 5. Função de Integração com Webhook
```javascript
// Função para enviar contexto para webhook
const sendToWebhook = async (contexto) => {
  try {
    const response = await fetch('https://webhook.lucasfelix.com/webhook/Analise_venda_beta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contexto: contexto,
        timestamp: new Date().toISOString(),
        source: 'google-cloud-transcription'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.text();
    console.log('✅ Resposta do webhook:', data);
    
    // Atualizar textarea com resposta
    setNewFieldText(data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar para webhook:', error);
    setNewFieldText(`Erro: ${error.message}`);
    throw error;
  }
};
```

### 3. Componente GoogleCloudTranscriptionDisplay Atualizado
```javascript
// Modificar handleContextAnalysis
const handleContextAnalysis = async () => {
  console.log('🧠 Análise de contexto iniciada');
  
  try {
    // Mostrar loading
    setNewFieldText('🔄 Enviando para análise...');
    
    // 1. Forçar finalização do ciclo atual
    forceFinalize();
    
    // 2. Aguardar um momento para coleta de contexto
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3. Coletar contexto atual
    const contextoCompleto = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    
    // 4. Enviar para webhook
    setNewFieldText('🌐 Aguardando resposta...');
    await sendToWebhook(contextoCompleto);
    
    // 5. Stream continua ativo automaticamente
    console.log('✅ Análise concluída, stream continua ativo');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    setNewFieldText(`❌ Erro na análise: ${error.message}`);
  }
};
```

## 📊 Data Flow com Webhook Específico

1. **Clique no Botão** → Executa `handleContextAnalysis()`
2. **Mostra Loading** → "🔄 Enviando para análise..."
3. **Envia force-finalize** → Servidor força finalização do ciclo atual
4. **Coleta Contexto** → `transcript` + `interimTranscript`
5. **POST para Webhook** → `https://webhook.lucasfelix.com/webhook/Analise_venda_beta`
6. **Aguarda Resposta** → "🌐 Aguardando resposta..."
7. **Recebe Resposta** → "analise_resposta recebida com sucesso, webhook funcionando"
8. **Atualiza Textarea** → Mostra resposta do webhook
9. **Stream Continua** → Reinício automático mantém captura ativa

## 🧪 Critérios de Sucesso

### ✅ Webhook Funcionando
- Resposta esperada: `"analise_resposta recebida com sucesso, webhook funcionando"`
- Tempo resposta: < 5 segundos
- Status HTTP: 200 OK

### ✅ Contexto Sendo Enviado
- Payload JSON com transcrições
- Timestamp e source incluídos
- Dados não vazios

### ✅ Stream Mantido
- Transcrição continua após análise
- Contexto acumula para próximas análises
- Sem interrupções no fluxo

## 🚀 Implementation Notes

- **Ciclo Natural**: Aproveita o sistema existente de 55s
- **Sem Interrupções**: Stream nunca para, apenas força finalização
- **Contexto Acumulativo**: Cada clique adiciona mais contexto
- **Processamento Paralelo**: Webhook processa enquanto usuário continua falando
- **Compatibilidade**: Mantém toda funcionalidade existente intacta

## 🎨 Estados e Variáveis Disponíveis

```javascript
// Estados disponíveis no componente
const [newFieldText, setNewFieldText] = useState(''); // Para resposta da IA

// Funções do hook
const {
  transcript,           // Transcrições finais
  interimTranscript,    // Transcrições em andamento
  isListening,          // Status da gravação
  isConnected,          // Status da conexão
  confidence,           // Nível de confiança
  startListening,       // Iniciar transcrição
  stopListening,        // Parar transcrição
  clearTranscript,      // Limpar transcrições
  forceFinalize,        // Nova função para forçar finalização
} = useGoogleCloudTranscription();
```
