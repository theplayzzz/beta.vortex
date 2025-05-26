export default function TarefasPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Lista Refinada</h1>
          <p className="text-seasalt/70 mt-1">
            Gerencie suas tarefas e acompanhe o progresso
          </p>
        </div>
        <button className="bg-periwinkle hover:bg-periwinkle/90 text-night px-4 py-2 rounded-lg font-medium transition-colors">
          Nova Tarefa
        </button>
      </div>

      {/* Filtros e Visualização */}
      <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm">
              <option>Todos os status</option>
              <option>A fazer</option>
              <option>Em andamento</option>
              <option>Revisão</option>
              <option>Concluído</option>
            </select>
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm">
              <option>Todas as prioridades</option>
              <option>Urgente</option>
              <option>Alta</option>
              <option>Média</option>
              <option>Baixa</option>
            </select>
            <div className="flex items-center space-x-2 bg-[#2A1B45] rounded-lg p-1">
              <button className="px-3 py-1 bg-sgbus-green text-night rounded text-sm font-medium">
                Lista
              </button>
              <button className="px-3 py-1 text-seasalt/70 hover:text-seasalt rounded text-sm">
                Kanban
              </button>
            </div>
          </div>
          <div className="text-sm text-seasalt/70">
            0 tarefas encontradas
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        <div className="p-6 text-center">
          <div className="text-seasalt/50 text-6xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Nenhuma tarefa ainda
          </h3>
          <p className="text-seasalt/70 mb-6">
            Suas tarefas aparecerão aqui quando você criar planejamentos ou adicionar tarefas manualmente
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="bg-periwinkle hover:bg-periwinkle/90 text-night px-6 py-3 rounded-lg font-medium transition-colors">
              Criar Tarefa Manual
            </button>
            <button className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors">
              Criar Planejamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 