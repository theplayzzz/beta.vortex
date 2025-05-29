export function PlanningCardSkeleton() {
  return (
    <div className="bg-eerie-black rounded-lg border border-accent/20 p-6 animate-pulse">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Título */}
          <div className="h-6 bg-seasalt/10 rounded w-3/4 mb-2"></div>
          {/* Descrição */}
          <div className="h-4 bg-seasalt/10 rounded w-1/2"></div>
        </div>
        
        {/* Menu de Ações */}
        <div className="ml-4">
          <div className="w-8 h-8 bg-seasalt/10 rounded"></div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-night rounded-lg">
        <div className="w-4 h-4 bg-seasalt/10 rounded flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-seasalt/10 rounded w-2/3 mb-1"></div>
          <div className="h-3 bg-seasalt/10 rounded w-1/2"></div>
        </div>
        <div className="w-16 h-6 bg-seasalt/10 rounded-full"></div>
      </div>

      {/* Footer do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-seasalt/10 rounded"></div>
          <div className="h-4 bg-seasalt/10 rounded w-20"></div>
        </div>

        {/* Status */}
        <div className="w-16 h-6 bg-seasalt/10 rounded"></div>
      </div>
    </div>
  );
} 