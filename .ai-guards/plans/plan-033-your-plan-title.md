### **Plano de Implementação Detalhado: Botão "Analisar" com Finalização de Contexto**

**Objetivo Final:** Fazer com que o botão "🧠 ANALISAR" crie um "instantâneo" do contexto atual, que inclui todo o texto dos blocos já finalizados **mais** o texto da transcrição intermediária em andamento. Este contexto consolidado será enviado ao webhook, **sem em nenhum momento interromper ou pausar o processo contínuo de transcrição da Daily.co**.

---

### **Fase 1: Preparação e Adaptação da Função de Webhook**

**Objetivo:** Trazer a função de comunicação com o webhook para nosso componente atual e garantir que suas configurações essenciais estejam corretas.

*   **Ação 1.1: Copiar e Adaptar a Função `sendToWebhook`**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Copiar a função `sendToWebhook` do antigo `GoogleCloudTranscriptionDisplay.tsx` e colá-la dentro do componente `DailyTranscriptionDisplay`.

*   **⚠️ Pontos de Atenção (Fase 1):**
    1.  **Variável de Ambiente:** Conforme solicitado, assumimos que a variável `NEXT_PUBLIC_ANALYSIS_WEBHOOK_URL` **já existe e está configurada** no arquivo `.env.local`. A função irá utilizá-la diretamente.
    2.  **Identificação da Fonte (Payload):** É mandatório atualizar o campo `source` no corpo da requisição para que a API externa saiba que a origem dos dados agora é o nosso sistema com Daily.co.
        ```typescript
        // Dentro da função sendToWebhook...
        body: JSON.stringify({
          // ...
          source: 'daily-co-transcription' // Assegurar esta alteração
        })
        ```

*   **Critério de Teste (Fase 1):**
    *   **Como testar:** Salve o arquivo e execute a aplicação.
    *   **Resultado esperado:** A aplicação deve carregar e funcionar perfeitamente, sem erros no console. A função `sendToWebhook` está agora disponível em nosso componente, pronta para ser chamada. Esta fase valida que a preparação do ambiente foi bem-sucedida.

---

### **Fase 2: Lógica de Coleta com Consolidação de Contexto e Gerenciamento de Estado**

**Objetivo:** Implementar a lógica principal que, no momento do clique, captura o estado atual dos blocos finalizados e da transcrição intermediária, tratando-os como um único contexto para a análise.

*   **Ação 2.1: Adicionar Estado de Carregamento (`isAnalyzing`)**
    *   **Onde:** No topo do componente `DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Adicionar o estado para controlar a interface durante a chamada ao webhook.
        ```typescript
        const [isAnalyzing, setIsAnalyzing] = useState(false);
        ```

*   **Ação 2.2: Criar a Função `handleAnalyze` com a Nova Lógica**
    *   **Onde:** Dentro do componente `DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Criar a função que orquestra a análise.

*   **⚠️ Pontos de Atenção (Fase 2):**
    1.  **Coleta do Contexto Completo:** Esta é a mudança mais crítica. A função não deve apenas pegar os `blocks`. Ela deve pegar os `blocks` E o `interimTranscript` atual para formar um "instantâneo" completo do que foi dito até aquele milissegundo.
        ```typescript
        // Dentro da função handleAnalyze...
        const finalBlocksText = blocks.map(block => block.text).join(' \n');
        const currentInterimText = interimTranscript; // Captura o texto intermediário atual

        // Junta os dois, garantindo um espaço se ambos existirem.
        const contextoCompleto = `${finalBlocksText} ${currentInterimText}`.trim();
        ```
    2.  **Operação Não-Destrutiva:** É fundamental entender que esta operação é de **leitura**. Nós estamos criando uma nova variável (`contextoCompleto`) baseada no estado atual. **Nós não modificamos, limpamos ou alteramos os estados `blocks` ou `interimTranscript`**. Isso garante que, enquanto a análise é enviada em segundo plano, o hook `useDailyTranscription` continue recebendo mensagens da Daily.co e atualizando a interface normalmente, sem qualquer interrupção.

*   **Critério de Teste (Fase 2):**
    *   **Como testar:** Adicione um `console.log('Contexto para análise:', contextoCompleto);` dentro da função `handleAnalyze`.
    *   **Resultado esperado:** A aplicação continua funcionando sem alterações visuais. A lógica está pronta. Ao chamar manualmente a função pelo console do navegador (se possível), o log deve mostrar a junção dos textos dos blocos e do texto intermediário.

---

### **Fase 3: Conexão com a Interface e Feedback Visual ao Usuário**

**Objetivo:** Conectar a nova lógica ao botão, fornecer feedback claro e garantir que a experiência do usuário seja fluida, mesmo com a análise acontecendo em segundo plano.

*   **Ação 3.1: Conectar o `onClick` e Controlar o Estado do Botão**
    *   **Onde:** No JSX do botão "ANALISAR" em `DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Conectar o evento `onClick` a `handleAnalyze` e usar `isAnalyzing` para controlar a aparência e o comportamento do botão.
        ```jsx
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (blocks.length === 0 && !interimTranscript)}
          className="..."
        >
          {isAnalyzing ? 'ANALISANDO...' : '🧠 ANALISAR'}
        </button>
        ```

*   **⚠️ Pontos de Atenção (Fase 3):**
    1.  **Lógica de Habilitação do Botão:** O botão só deve estar clicável se houver algo para analisar. A condição para desabilitar agora é: "está analisando" OU ("não há blocos finalizados" E "não há texto intermediário").
        ```jsx
        disabled={isAnalyzing || (blocks.length === 0 && !interimTranscript.trim())}
        ```
    2.  **Garantia de Não-Interrupção (Teste Visual):** O teste final deve validar explicitamente que a transcrição continua. O usuário precisa ver o texto intermediário na tela mudando enquanto a análise acontece.

*   **Critério de Teste (Fase 3):**
    *   **Como testar:** Este é o teste funcional completo da funcionalidade.
        1.  Inicie a aplicação e a transcrição. Fale uma ou duas frases e faça uma pausa (para criar blocos finalizados).
        2.  Comece a falar uma nova frase, mas **não pare de falar**.
        3.  Enquanto a frase intermediária está aparecendo e mudando na tela, **clique no botão "ANALISAR"**.
        4.  **Verifique o Comportamento Imediato:**
            *   O botão deve mudar para "ANALISANDO..." e ficar desabilitado.
            *   **Crucial:** A transcrição intermediária na tela deve **continuar a ser atualizada** enquanto você fala, provando que o processo não foi interrompido.
        5.  **Verifique o Console:** Você verá o log do `contextoCompleto`, que deve conter o texto dos blocos finalizados e o "instantâneo" do texto intermediário que existia no momento do clique.
        6.  **Verifique a Conclusão:** Após a resposta do webhook, um `alert` aparecerá. Ao fechá-lo, o botão voltará ao normal ("🧠 ANALISAR" e habilitado), pronto para uma nova análise.