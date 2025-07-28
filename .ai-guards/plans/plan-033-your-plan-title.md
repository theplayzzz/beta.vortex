
### **Plano de Implementação: Substituição do Botão Reconectar por Tutorial + Modal**

**Objetivo Final:** 
1. **Remover completamente** o botão "RECONECTAR" e toda sua lógica
2. **Substituir** por um botão "TUTORIAL" no mesmo local
3. **Implementar** o modal de tutorial funcional
4. **Configurar** aparição automática na primeira visita

---

### **Fase 1: Remoção Completa do Botão Reconectar**

**Objetivo:** Eliminar totalmente o botão "RECONECTAR" e qualquer lógica de reconexão associada a ele.

*   **Ação 1.1: Localizar e Remover o Botão Reconectar**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Encontrar e **deletar completamente** o botão "RECONECTAR" e seu JSX.
    ```jsx
    // REMOVER ESTE BLOCO COMPLETAMENTE:
    <button 
      className="px-2 py-1 rounded text-xs transition-all duration-200" 
      style="background-color: rgba(207, 198, 254, 0.2); color: var(--periwinkle);"
      onClick={...} // qualquer função que esteja aqui
    >
      RECONECTAR
    </button>
    ```

*   **Ação 1.2: Remover Lógica de Reconexão (se existir)**
    *   **Onde:** No arquivo `app/coach/capture/lib/useDailyTranscription.ts`.
    *   **O que fazer:** Procurar por qualquer função relacionada à reconexão (como `reconnect`, `handleReconnect`, etc.) e **remover completamente**.
    ```typescript
    // PROCURAR E REMOVER funções como:
    // - const reconnect = ...
    // - const handleReconnect = ...
    // - qualquer lógica de reconnect no return do hook
    ```

*   **Ação 1.3: Limpar Imports e Estados Relacionados**
    *   **Onde:** Em ambos os arquivos (`DailyTranscriptionDisplay.tsx` e `useDailyTranscription.ts`).
    *   **O que fazer:** Remover qualquer import, estado ou variável que era usada exclusivamente para reconexão.

*   **Critério de Teste (Fase 1):**
    *   **Como testar:** Salvar os arquivos e rodar a aplicação.
    *   **Resultado esperado:** A aplicação deve funcionar normalmente, mas **sem o botão "RECONECTAR"**. Não deve haver erros no console relacionados a funções de reconexão inexistentes.

---

### **Fase 2: Criação do Botão Tutorial**

**Objetivo:** Adicionar o novo botão "TUTORIAL" no local onde estava o "RECONECTAR" e torná-lo funcional para abrir o modal.

*   **Ação 2.1: Adicionar Estado para Controlar o Modal**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Adicionar o estado que controlará a abertura/fechamento do modal.
    ```typescript
    // Adicionar no início do componente, junto com outros useState
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    ```

*   **Ação 2.2: Adicionar o Botão Tutorial**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Inserir o novo botão "TUTORIAL" **exatamente no local** onde estava o botão "RECONECTAR".
    ```jsx
    {/* Adicionar no local onde estava o botão RECONECTAR */}
    <button 
      className="px-2 py-1 rounded text-xs transition-all duration-200" 
      style={{ backgroundColor: 'rgba(207, 198, 254, 0.2)', color: 'var(--periwinkle)' }}
      onClick={() => setIsTutorialOpen(true)}
    >
      TUTORIAL
    </button>
    ```

*   **Ação 2.3: Criar Modal Temporário para Teste**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Adicionar um modal simples temporário para testar se o botão está funcionando.
    ```jsx
    {/* Adicionar no final do JSX principal, antes do fechamento */}
    {isTutorialOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Tutorial Modal</h2>
          <p>Este é um teste do modal de tutorial!</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setIsTutorialOpen(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    )}
    ```

*   **Critério de Teste (Fase 2):**
    *   **Como testar:** 
        1. Salvar os arquivos e rodar a aplicação
        2. Localizar o botão "TUTORIAL" onde antes estava "RECONECTAR"
        3. Clicar no botão "TUTORIAL"
        4. Verificar se o modal simples abre
        5. Clicar em "Fechar" e verificar se o modal fecha
    *   **Resultado esperado:** Botão "TUTORIAL" visível e funcional, abrindo/fechando o modal de teste corretamente.

---

### **Fase 3: Criação do Componente Modal Completo**

**Objetivo:** Substituir o modal temporário por um componente completo e profissional com todo o conteúdo do tutorial.

*   **Ação 3.1: Criar o Componente TutorialModal**
    *   **Onde:** Criar novo arquivo `app/coach/capture/components/TutorialModal.tsx`.
    *   **O que fazer:** Criar componente modal responsivo com conteúdo completo.
    ```typescript
    import { X, Play, Monitor, Mic, MicOff, MonitorSpeaker, Trash2, Brain, AlertCircle } from 'lucide-react';

    interface TutorialModalProps {
      isOpen: boolean;
      onClose: () => void;
    }

    export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
      if (!isOpen) return null;

      return (
        // Modal com:
        // - Overlay escuro clicável para fechar
        // - Container responsivo (max-w-4xl)
        // - Header com título e botão X
        // - Body com scroll (max-h-[80vh] overflow-y-auto)
        // - Conteúdo estruturado em seções
        // - Footer com botão "Entendi"
      );
    }
    ```

*   **Ação 3.2: Estruturar o Conteúdo do Tutorial**
    *   **Onde:** Dentro do componente `TutorialModal.tsx`.
    *   **O que fazer:** Criar o conteúdo completo solicitado, organizando em seções visuais.
    ```jsx
    // Estrutura do conteúdo:
    // 1. Título: "Como usar a Plataforma de Transcrição e Análise"
    // 2. Introdução: Explicação breve da funcionalidade
    // 3. Passo 1: Clicar em INICIAR (com ícone Play)
    // 4. Passo 2: Compartilhamento de tela + áudio (com ícone Monitor)
    // 5. Passo 3: Aguardar conexão (status conectado)
    // 6. Controles disponíveis:
    //    - Botões de microfone (Mic/MicOff)
    //    - Botão de áudio da tela (MonitorSpeaker)
    //    - Botão de limpeza (Trash2)
    //    - Botão de análise (Brain)
    // 7. Observação importante sobre contexto (com ícone AlertCircle)
    ```

*   **Ação 3.3: Substituir Modal Temporário**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Remover o modal temporário e importar/usar o componente completo.
    ```typescript
    // Adicionar import
    import TutorialModal from './TutorialModal';

    // Substituir o modal temporário por:
    <TutorialModal 
      isOpen={isTutorialOpen}
      onClose={() => setIsTutorialOpen(false)}
    />
    ```

*   **Critério de Teste (Fase 3):**
    *   **Como testar:** 
        1. Clicar no botão "TUTORIAL"
        2. Verificar se o modal completo abre com todo o conteúdo
        3. Testar responsividade (redimensionar janela)
        4. Testar scroll (se necessário)
        5. Testar fechamento (botão X, overlay, botão "Entendi")
    *   **Resultado esperado:** Modal profissional, responsivo, com conteúdo completo e bem estruturado.

---

### **Fase 4: Sistema de Primeira Visita**

**Objetivo:** Implementar a detecção de primeira visita para abrir o modal automaticamente.

*   **Ação 4.1: Criar Hook de Primeira Visita**
    *   **Onde:** Criar novo arquivo `app/coach/capture/lib/useFirstVisit.ts`.
    *   **O que fazer:** Implementar hook para gerenciar primeira visita.
    ```typescript
    import { useState, useEffect, useCallback } from 'react';

    export function useFirstVisit(pageKey: string) {
      const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
      const [isLoading, setIsLoading] = useState<boolean>(true);

      useEffect(() => {
        const visitKey = `first-visit-${pageKey}`;
        const hasVisited = localStorage.getItem(visitKey);
        
        setIsFirstVisit(!hasVisited);
        setIsLoading(false);
      }, [pageKey]);

      const markAsVisited = useCallback(() => {
        const visitKey = `first-visit-${pageKey}`;
        localStorage.setItem(visitKey, 'true');
        setIsFirstVisit(false);
      }, [pageKey]);

      return { isFirstVisit, isLoading, markAsVisited };
    }
    ```

*   **Ação 4.2: Integrar Hook no Componente**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Usar o hook e configurar abertura automática.
    ```typescript
    // Adicionar import
    import { useFirstVisit } from '../lib/useFirstVisit';

    // Dentro do componente, adicionar:
    const { isFirstVisit, isLoading, markAsVisited } = useFirstVisit('daily-co-tutorial');

    // useEffect para abrir modal na primeira visita
    useEffect(() => {
      if (!isLoading && isFirstVisit) {
        setIsTutorialOpen(true);
      }
    }, [isFirstVisit, isLoading]);
    ```

*   **Ação 4.3: Atualizar Modal para Marcar Visita**
    *   **Onde:** No arquivo `app/coach/capture/components/DailyTranscriptionDisplay.tsx`.
    *   **O que fazer:** Modificar a função `onClose` do modal para marcar como visitado quando for primeira visita.
    ```jsx
    <TutorialModal 
      isOpen={isTutorialOpen}
      onClose={() => {
        setIsTutorialOpen(false);
        if (isFirstVisit) {
          markAsVisited();
        }
      }}
    />
    ```

*   **Critério de Teste (Fase 4):**
    *   **Como testar:** Teste completo da funcionalidade:
        1. **Limpar localStorage:** Abrir DevTools → Application → Storage → Clear All
        2. **Primeira visita:** Acessar `/coach/capture/daily-co` - modal deve abrir automaticamente
        3. **Fechar modal:** Modal deve fechar e marcar como visitado
        4. **Recarregar página:** Modal não deve abrir automaticamente
        5. **Botão manual:** Clicar em "TUTORIAL" deve abrir modal
        6. **Nova primeira visita:** Limpar localStorage novamente e repetir teste
    *   **Resultado esperado:** Sistema completo funcionando - modal abre automaticamente na primeira visita e pode ser aberto manualmente via botão "TUTORIAL".

---

### **Resumo dos Arquivos Afetados:**

**Arquivos Novos:**
- `app/coach/capture/components/TutorialModal.tsx` - Componente do modal completo
- `app/coach/capture/lib/useFirstVisit.ts` - Hook para detecção de primeira visita

**Arquivos Modificados:**
- `app/coach/capture/components/DailyTranscriptionDisplay.tsx` - Remoção do botão reconectar, adição do botão tutorial e integração do modal
- `app/coach/capture/lib/useDailyTranscription.ts` - Remoção de qualquer lógica de reconexão (se existir)

**Fluxo Final:**
1. **Primeira visita:** Modal abre automaticamente
2. **Visitas posteriores:** Modal disponível via botão "TUTORIAL"
3. **Conteúdo:** Tutorial completo sobre uso da ferramenta
4. **UX:** Modal responsivo, com scroll e múltiplas formas de fechamento