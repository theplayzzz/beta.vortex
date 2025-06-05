export function PlanningCardSkeleton() {
  return (
    <div className="bg-eerie-black rounded-lg border border-accent/20 p-6 animate-pulse flex flex-col h-full">
      {/* Estrutura do Card com altura fixa */}
      <div className="flex flex-col h-full min-h-[280px]">
        {/* Header do Card - Altura fixa */}
        <div className="flex items-start justify-between mb-4 min-h-[80px]">
          <div className="flex-1 pr-2">
            {/* Título */}
            <div className="h-6 bg-seasalt/10 rounded w-3/4 mb-2"></div>
            {/* Descrição */}
            <div className="h-4 bg-seasalt/10 rounded w-5/6 mb-1"></div>
            <div className="h-4 bg-seasalt/10 rounded w-1/2"></div>
          </div>
          
          {/* Menu de Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-8 bg-seasalt/10 rounded"></div>
          </div>
        </div>

        {/* Informações do Cliente - Altura fixa */}
        <div className="flex items-center gap-3 mb-4 p-4 bg-night rounded-lg min-h-[72px]">
          <div className="w-4 h-4 bg-seasalt/10 rounded flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-seasalt/10 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-seasalt/10 rounded w-1/2"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-16 h-6 bg-seasalt/10 rounded-full"></div>
          </div>
        </div>

        {/* Spacer para empurrar o footer para baixo */}
        <div className="flex-1"></div>

        {/* Footer do Card - Altura fixa */}
        <div className="flex items-center justify-between text-sm pt-3 border-t border-accent/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-seasalt/10 rounded"></div>
            <div className="h-3 bg-seasalt/10 rounded w-20"></div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-6 bg-seasalt/10 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 