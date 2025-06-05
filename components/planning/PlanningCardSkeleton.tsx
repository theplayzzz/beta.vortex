export function PlanningCardSkeleton() {
  return (
    <div className="bg-eerie-black rounded-lg border border-accent/20 p-4 animate-pulse flex flex-col h-full">
      {/* Estrutura do Card com altura otimizada */}
      <div className="flex flex-col h-full">
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-2">
            {/* Título */}
            <div className="h-6 bg-seasalt/10 rounded w-3/4 mb-1"></div>
            {/* Descrição */}
            <div className="h-4 bg-seasalt/10 rounded w-5/6 mb-1"></div>
            <div className="h-4 bg-seasalt/10 rounded w-1/2"></div>
          </div>
          
          {/* Menu de Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-7 h-7 bg-seasalt/10 rounded"></div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-night rounded-lg">
          <div className="w-4 h-4 bg-seasalt/10 rounded flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-seasalt/10 rounded w-2/3 mb-1"></div>
            <div className="h-3 bg-seasalt/10 rounded w-1/2"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-16 h-6 bg-seasalt/10 rounded-full"></div>
          </div>
        </div>

        {/* Spacer reduzido */}
        <div className="flex-1 min-h-[8px]"></div>

        {/* Footer do Card */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-accent/10">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-seasalt/10 rounded"></div>
            <div className="h-3 bg-seasalt/10 rounded w-20"></div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-5 bg-seasalt/10 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 