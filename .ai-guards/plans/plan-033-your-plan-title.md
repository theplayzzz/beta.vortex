### **Plano de Implementação: Sistema de Blocos de Transcrição (Incremental)**

**Objetivo Final:** Substituir o sistema de "1 segmento = 1 bloco" por um sistema onde um bloco visual cresce com múltiplas frases até atingir 500 caracteres ou até a fonte do áudio (microfone/tela) mudar.

---

### **Fase 1: Preparação e Limpeza (Refatoração Segura)**

**Objetivo:** Desacoplar a renderização atual do array de `segments` para que possamos introduzir a nova lógica sem quebrar a interface. Esta fase é apenas para "limpar o terreno".

*   **Ação 1.1: Modificar `useDailyTranscription.ts`**
    *   **O que fazer:** Localize o estado `segments`. Não vamos removê-lo ainda, pois ele pode ser útil para depuração. Apenas tenha ciência de que ele deixará de ser a fonte principal de dados para a UI. Nenhuma alteração de código é necessária neste arquivo nesta fase.

*   **Ação 1.2: Modificar `DailyTranscriptionDisplay.tsx`**
    *   **O que fazer:** Encontre o bloco de código JSX que renderiza os segmentos finais. Ele se parece com isto: `{segments.filter(s => s.isFinal).map((segment, index) => ...)}`. **Comente** todo este bloco de renderização. O objetivo é impedir que os segmentos finais sejam exibidos na tela temporariamente.

*   **Critério de Teste para a Fase 1:**
    *   Rode a aplicação e inicie a transcrição.
    *   **Resultado esperado:** Você deve ver o texto intermediário (em itálico) aparecendo e desaparecendo normalmente, mas **nenhum bloco de transcrição final deve aparecer na tela**. A transcrição finalizada não será mais exibida. Se isso acontecer, a Fase 1 foi um sucesso.

---

### **Fase 2: Introdução da Estrutura de "Blocos"**

**Objetivo:** Criar a estrutura de dados para os novos "blocos" de transcrição dentro do hook. Esta fase é puramente de lógica, sem impacto visual.

*   **Ação 2.1: Modificar `useDailyTranscription.ts`**
    *   **O que fazer:** Adicione uma nova interface para definir como será um bloco:
        ```typescript
        interface TranscriptionBlock {
          id: string; // Ex: `block-${Date.now()}`
          source: 'microphone' | 'screen' | 'remote';
          color: 'blue' | 'green' | 'gray';
          startTime: Date;
          text: string; // O texto consolidado do bloco
        }
        ```
    *   Adicione o novo estado à interface `TranscriptionState`:
        ```typescript
        export interface TranscriptionState {
          // ... outros estados
          blocks: TranscriptionBlock[]; // O novo estado
        }
        ```
    *   No estado inicial (`useState<TranscriptionState>`), inicialize `blocks: []`.

*   **Critério de Teste para a Fase 2:**
    *   Rode a aplicação.
    *   **Resultado esperado:** A aplicação deve funcionar exatamente como no final da Fase 1, sem erros no console. Embora nada tenha mudado visualmente, a nova estrutura de dados já existe e está pronta para ser usada. Você pode adicionar um `console.log(state.blocks)` para confirmar que é um array vazio.

---

### **Fase 3: Lógica Central - Preenchendo o Bloco Ativo**

**Objetivo:** Implementar a lógica principal para que, ao receber uma transcrição final, ela seja adicionada ao bloco mais recente, em vez de criar um novo. Ignoraremos o limite de 500 caracteres e a troca de fonte por enquanto.

*   **Ação 3.1: Modificar `handleTranscriptionMessage` em `useDailyTranscription.ts`**
    *   **O que fazer:** Dentro da condição `if (data.is_final)`, implemente a seguinte lógica:
        1.  Obtenha o último bloco do array: `const lastBlock = state.blocks[state.blocks.length - 1];`
        2.  **Se `lastBlock` não existir** (é o primeiro texto da sessão): crie um novo `TranscriptionBlock` e adicione-o ao array `state.blocks`.
        3.  **Se `lastBlock` existir**: crie uma cópia dele, anexe o novo `data.text` ao `lastBlock.text`, e atualize o array `state.blocks` com o bloco modificado.

*   **Critério de Teste para a Fase 3:**
    *   Mantenha a UI comentada. O teste será feito pelo console.
    *   Adicione `console.log(JSON.stringify(state.blocks, null, 2))` dentro do `setState` para ver as mudanças.
    *   **Resultado esperado:** Ao falar, você verá no console que existe **apenas um objeto** no array `blocks`, e a propriedade `text` desse objeto cresce a cada frase finalizada. Isso prova que a lógica de "anexar" está funcionando.

---

### **Fase 4: Lógica de Separação - Criando Novos Blocos**

**Objetivo:** Adicionar as regras para a criação de um novo bloco: limite de 500 caracteres e mudança na fonte do áudio.

*   **Ação 4.1: Modificar `handleTranscriptionMessage` em `useDailyTranscription.ts`**
    *   **O que fazer:** Melhore a lógica da Fase 3. Antes de anexar o texto, adicione uma verificação:
        ```typescript
        // Lógica conceitual
        const lastBlock = state.blocks[state.blocks.length - 1];
        const newSource = determineAudioSource(...); // A função que já existe

        if (!lastBlock || lastBlock.source !== newSource.audioSource || lastBlock.text.length > 500) {
          // CONDIÇÃO ATINGIDA: Crie um NOVO bloco
          // ...código para criar e adicionar um novo TranscriptionBlock
        } else {
          // CONDIÇÃO NÃO ATINGIDA: Anexe ao bloco existente
          // ...código da Fase 3 para anexar texto
        }
        ```

*   **Critério de Teste para a Fase 4:**
    *   Continue testando via `console.log`.
    *   **Resultado esperado 1 (limite):** Fale continuamente. Observe a propriedade `text` do último bloco no console. Quando o `length` dela passar de 500, um **novo objeto de bloco** deve aparecer no array `blocks`.
    *   **Resultado esperado 2 (fonte):** Simule uma mudança de `source` (você pode forçar o retorno da função `determineAudioSource` para fins de teste). Um novo bloco deve ser criado imediatamente, mesmo com poucos caracteres.

---

### **Fase 5: Conexão Visual - Renderizando os Blocos na Tela**

**Objetivo:** Finalmente, fazer a interface do usuário renderizar os novos `blocks` e o texto intermediário corretamente.

*   **Ação 5.1: Modificar `DailyTranscriptionDisplay.tsx`**
    *   **O que fazer:**
        1.  Descomente a área de renderização que você comentou na Fase 1.
        2.  Substitua o loop `{segments.filter().map()}` por um novo loop que itera sobre o estado `blocks`: `{blocks.map((block, index) => ...)}`.
        3.  Dentro do loop, renderize um `<div>` para cada `block`, exibindo seu `block.text`. Use `block.color` para estilizar a borda e o texto, como era feito antes.
        4.  **Implemente a exibição do texto intermediário:** Dentro do parágrafo que exibe `block.text`, adicione uma condição. Se este for o último bloco (`index === blocks.length - 1`) e `interimTranscript` existir, renderize-o dentro de um `<span>` com o estilo itálico.

*   **Critério de Teste para a Fase 5:**
    *   **Teste visual final.**
    *   **Resultado esperado:** A transcrição aparecerá na tela.
        1.  O texto intermediário (itálico) deve aparecer no final do último bloco visual.
        2.  Quando a frase é finalizada, o texto intermediário desaparece e o texto final é anexado de forma permanente àquele bloco.
        3.  Quando o texto de um bloco ultrapassar 500 caracteres, um **novo bloco visual** deve aparecer logo abaixo, e a transcrição continuará nele. O mesmo deve acontecer se o áudio mudar da tela para o microfone, ou vice-versa.