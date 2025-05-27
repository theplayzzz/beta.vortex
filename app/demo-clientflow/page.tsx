"use client";

import ClientFlowExample from "@/components/examples/client-flow-example";

export default function DemoClientFlowPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-seasalt mb-2">
          Demonstração ClientFlow Modal
        </h1>
        <p className="text-periwinkle">
          Exemplos de como usar o ClientFlow Modal em diferentes contextos
        </p>
      </div>

      <div className="space-y-8">
        {/* Modo: Apenas Criação */}
        <div>
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            Modo: Apenas Criação
          </h2>
          <p className="text-periwinkle mb-4 text-sm">
            Usado na página de clientes onde sempre queremos criar um novo cliente.
          </p>
          <ClientFlowExample 
            mode="create-only"
            title="Novo Cliente"
            description="Crie um novo cliente para sua carteira"
          />
        </div>

        {/* Modo: Seleção ou Criação */}
        <div>
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            Modo: Seleção ou Criação
          </h2>
          <p className="text-periwinkle mb-4 text-sm">
            Usado em outras funcionalidades onde podemos reutilizar clientes existentes ou criar novos.
          </p>
          <ClientFlowExample 
            mode="select-or-create"
            title="Selecionar Cliente para Planejamento"
            description="Escolha um cliente existente ou crie um novo para este planejamento"
          />
        </div>

        {/* Informações de Implementação */}
        <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            📋 Como Implementar
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-seasalt mb-2">1. Importar o Hook</h3>
              <div className="bg-night p-4 rounded-lg border border-seasalt/10">
                <code className="text-sgbus-green text-sm">
                  {`import { useClientFlow } from "@/hooks/use-client-flow";`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-seasalt mb-2">2. Configurar o Hook</h3>
              <div className="bg-night p-4 rounded-lg border border-seasalt/10">
                <code className="text-sgbus-green text-sm whitespace-pre-line">
{`const clientFlow = useClientFlow({
  title: "Título do Modal",
  description: "Descrição do modal",
  onClientSelected: (client) => {
    // Lógica quando cliente é selecionado
    console.log('Cliente:', client);
  }
});`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-seasalt mb-2">3. Adicionar Botão e Modal</h3>
              <div className="bg-night p-4 rounded-lg border border-seasalt/10">
                <code className="text-sgbus-green text-sm whitespace-pre-line">
{`<button onClick={clientFlow.openModal}>
  Abrir Modal
</button>

<ClientFlowModal {...clientFlow.modalProps} />`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-seasalt mb-2">4. Funcionalidades Disponíveis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="text-periwinkle">✅ Busca de clientes com debounce</div>
                  <div className="text-periwinkle">✅ Auto-save durante digitação</div>
                  <div className="text-periwinkle">✅ Validação de campos obrigatórios</div>
                  <div className="text-periwinkle">✅ Estados de loading e erro</div>
                </div>
                <div className="space-y-2">
                  <div className="text-periwinkle">✅ Indicador visual de completude</div>
                  <div className="text-periwinkle">✅ Integração com API real</div>
                  <div className="text-periwinkle">✅ Interface responsiva</div>
                  <div className="text-periwinkle">✅ Animações suaves</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 