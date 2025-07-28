Com certeza! Vou refazer o planejamento usando os ícones da biblioteca **Lucide React** em vez de emojis.

---

### **Plano de Implementação: Controles de Áudio Independentes (Microfone e Tela) - Versão Lucide**

**Objetivo Final:** Substituir o botão de microfone único por dois botões distintos e funcionais usando ícones Lucide.
1.  **Botão de Microfone:** Usar `Mic` (ligado) e `MicOff` (desligado). Inicia **desligado**.
2.  **Botão de Áudio da Tela:** Usar `MonitorSpeaker` para representar áudio da tela. Inicia **ligado**.

---

### **Fase 1: Limpeza da Lógica Antiga e Reestruturação da Interface**

**Objetivo:** Remover completamente a funcionalidade atual do botão de microfone e redesenhar a interface para acomodar dois novos botões com ícones Lucide.

*   **Ação 1.1: Remover Lógica Existente (Hook)**
    *   **Onde:** No arquivo `app/coach/capture/lib/useDailyTranscription.ts`.
    *   **O que fazer:** Localize qualquer função ou lógica de `setState` que esteja sendo usada para ligar/desligar o microfone (ex: `toggleMicrofone`, `toggleMute`, etc.). **Remova completamente** essa função e sua exportação no `return` do hook.

*   **Ação 1.2: Adicionar Importações dos Ícones Lucide**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Adicione os imports dos ícones que vamos usar:
    ```typescript
    import { Mic, MicOff, MonitorSpeaker } from 'lucide-react';
    ```

*   **Ação 1.3: Reestruturar a Interface (Componente)**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Encontre o `<button>` do microfone existente. **Substitua-o** por uma `div` que conterá os dois novos botões, lado a lado, usando os ícones Lucide. Por enquanto, eles não terão funcionalidade.

    ```jsx
    {/* Substitua o botão antigo por esta estrutura */}
    <div className="flex w-full gap-2">
      {/* Botão do Microfone - Sem função ainda */}
      <button 
        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
      >
        <MicOff size={16} />
        <span>MIC OFF</span>
      </button>

      {/* Botão de Áudio da Tela - Sem função ainda */}
      <button 
        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(74, 222, 128, 0.3)' }}
      >
        <MonitorSpeaker size={16} />
        <span>TELA ON</span>
      </button>
    </div>
    ```

*   **Critério de Teste (Fase 1):**
    *   **Como testar:** Salve os arquivos e rode a aplicação.
    *   **Resultado esperado:** No lugar do botão único de microfone, você deve ver **dois novos botões** com ícones Lucide: um com `MicOff` e texto "MIC OFF" (vermelho) e outro com `MonitorSpeaker` e texto "TELA ON" (verde). Clicar neles não fará nada. O código antigo foi removido, garantindo que não haverá conflitos.

---

### **Fase 2: Implementação da Nova Lógica de Controle no Hook**

**Objetivo:** Criar os estados e as funções de controle para o microfone e o áudio da tela dentro do hook `useDailyTranscription`, usando os métodos corretos da SDK do Daily.co.

*   **Ação 2.1: Adicionar Novos Estados**
    *   **Onde:** Na interface `TranscriptionState` em `useDailyTranscription.ts`.
    *   **O que fazer:** Adicione dois booleanos para rastrear o estado de cada fonte de áudio.
        ```typescript
        export interface TranscriptionState {
          // ...outros estados
          isMicrophoneEnabled: boolean;
          isScreenAudioEnabled: boolean;
        }
        ```
    *   No `useState` inicial, defina os valores padrão conforme solicitado:
        ```typescript
        useState<TranscriptionState>({
          // ...outros estados
          isMicrophoneEnabled: false, // Microfone inicia desligado
          isScreenAudioEnabled: true,  // Áudio da tela inicia ligado
        });
        ```

*   **Ação 2.2: Criar Funções de Controle**
    *   **Onde:** Dentro do hook `useDailyTranscription.ts`.
    *   **O que fazer:** Crie duas novas funções, uma para cada botão, e exponha-as no `return`.

    ```typescript
    // Função para o microfone do usuário
    const toggleMicrophone = useCallback(() => {
      const nextState = !state.isMicrophoneEnabled;
      callObjectRef.current?.setMicrophone(nextState);
      setState(prev => ({ ...prev, isMicrophoneEnabled: nextState }));
      console.log(`🎤 Microfone foi ${nextState ? 'LIGADO' : 'DESLIGADO'}`);
    }, [state.isMicrophoneEnabled]);

    // Função para o áudio da tela
    const toggleScreenAudio = useCallback(() => {
      const nextState = !state.isScreenAudioEnabled;
      callObjectRef.current?.setScreenAudio(nextState);
      setState(prev => ({ ...prev, isScreenAudioEnabled: nextState }));
      console.log(`🖥️ Áudio da tela foi ${nextState ? 'LIGADO' : 'DESLIGADO'}`);
    }, [state.isScreenAudioEnabled]);

    // Exponha tudo no return do hook
    return {
      // ...outros retornos
      isMicrophoneEnabled: state.isMicrophoneEnabled,
      isScreenAudioEnabled: state.isScreenAudioEnabled,
      toggleMicrophone,
      toggleScreenAudio,
    };
    ```

*   **⚠️ Pontos de Atenção (Fase 2):**
    1.  **Métodos Corretos da SDK:** Usar `callObjectRef.current?.setMicrophone(boolean)` e `callObjectRef.current?.setScreenAudio(boolean)` é crucial. Esses métodos da Daily.co ativam/desativam a **transmissão de áudio** da faixa específica, sem parar a faixa em si (o vídeo da tela continua).
    2.  **Estado Inicial:** A definição dos estados iniciais (`isMicrophoneEnabled: false`, `isScreenAudioEnabled: true`) é fundamental para que a aplicação comece no estado desejado pelo usuário.

*   **Critério de Teste (Fase 2):**
    *   **Como testar:** Salve o arquivo. A aplicação deve funcionar sem erros.
    *   **Resultado esperado:** A lógica de controle agora existe no hook, pronta para ser conectada à interface. Nenhuma mudança visual ocorrerá ainda.

---

### **Fase 3: Conexão Final da Interface e Testes Funcionais**

**Objetivo:** Conectar as novas funções e estados aos botões na interface, implementando a lógica de estilo e ícones dinâmicos.

*   **Ação 3.1: Conectar o Botão do Microfone**
    *   **Onde:** Em `DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Primeiro, consuma os novos valores do hook. Depois, atualize o botão `MIC` com ícones dinâmicos.

    ```jsx
    // Consuma do hook
    const { 
      isMicrophoneEnabled, 
      toggleMicrophone, 
      isScreenAudioEnabled, 
      toggleScreenAudio 
    } = useDailyTranscription(...);

    // Atualize o JSX do botão do microfone com ícones dinâmicos
    <button 
      onClick={toggleMicrophone}
      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
      style={isMicrophoneEnabled ? 
        { backgroundColor: 'rgba(74, 222, 128, 0.2)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(74, 222, 128, 0.3)' } :
        { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }
      }
    >
      {isMicrophoneEnabled ? <Mic size={16} /> : <MicOff size={16} />}
      <span>{isMicrophoneEnabled ? 'MIC ON' : 'MIC OFF'}</span>
    </button>
    ```

*   **Ação 3.2: Conectar o Botão de Áudio da Tela**
    *   **Onde:** Em `DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Atualize o botão `TELA` de forma similar, mantendo sempre o ícone `MonitorSpeaker`.
    ```jsx
    <button 
      onClick={toggleScreenAudio}
      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
      style={isScreenAudioEnabled ? 
        { backgroundColor: 'rgba(74, 222, 128, 0.2)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(74, 222, 128, 0.3)' } :
        { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }
      }
    >
      <MonitorSpeaker size={16} />
      <span>{isScreenAudioEnabled ? 'TELA ON' : 'TELA OFF'}</span>
    </button>
    ```

*   **Critério de Teste (Fase 3):**
    *   **Como testar:** Este é o teste funcional completo.
        1.  **Teste de Estado Inicial:** Inicie a aplicação e a transcrição. Compartilhe uma tela com áudio (ex: um vídeo do YouTube).
            *   **Verifique:** O botão do microfone deve estar vermelho com ícone `MicOff` e texto "MIC OFF". O botão da tela deve estar verde com ícone `MonitorSpeaker` e texto "TELA ON". O áudio do vídeo deve ser transcrito, mas sua voz não.
        2.  **Teste do Microfone:**
            *   Clique no botão "MIC OFF". Ele deve ficar verde com ícone `Mic` e texto "MIC ON".
            *   **Verifique:** Agora sua voz deve ser transcrita.
            *   Clique no botão "MIC ON". Ele deve ficar vermelho com ícone `MicOff` e texto "MIC OFF".
            *   **Verifique:** A transcrição da sua voz deve parar.
        3.  **Teste do Áudio da Tela:**
            *   Clique no botão "TELA ON". Ele deve ficar vermelho com ícone `MonitorSpeaker` e texto "TELA OFF".
            *   **Verifique:** A transcrição do áudio do vídeo deve parar, mas o compartilhamento de tela visual não é interrompido.
            *   Clique no botão "TELA OFF". Ele deve ficar verde com ícone `MonitorSpeaker` e texto "TELA ON".
            *   **Verifique:** A transcrição do áudio do vídeo deve recomeçar.

---

**Resumo dos Ícones Lucide Utilizados:**
- **`Mic`** - Microfone ligado (verde)
- **`MicOff`** - Microfone desligado (vermelho) 
- **`MonitorSpeaker`** - Áudio da tela (sempre o mesmo ícone, cores mudam conforme estado)