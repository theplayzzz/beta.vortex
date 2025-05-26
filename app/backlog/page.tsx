export default function BacklogPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Planejamento</h1>
          <p className="text-seasalt/70 mt-1">
            Gerencie seus planejamentos estratégicos e backlogs
          </p>
        </div>
        <button className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors">
          Novo Planejamento
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm">
              <option>Todos os status</option>
              <option>Rascunho</option>
              <option>Em andamento</option>
              <option>Concluído</option>
            </select>
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm">
              <option>Todos os clientes</option>
            </select>
          </div>
          <div className="text-sm text-seasalt/70">
            0 planejamentos encontrados
          </div>
        </div>
      </div>

      {/* Lista de Planejamentos */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        <div className="p-6 text-center">
          <div className="text-seasalt/50 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Nenhum planejamento ainda
          </h3>
          <p className="text-seasalt/70 mb-6">
            Crie seu primeiro planejamento estratégico com a ajuda da IA
          </p>
          <button className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors">
            Criar Primeiro Planejamento
          </button>
        </div>
      </div>
    </div>
  );
} 