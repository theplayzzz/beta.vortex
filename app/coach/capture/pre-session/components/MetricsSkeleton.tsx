/**
 * Loading skeleton component for metrics cards
 * Implements ETAPA 5 requirements from plan-009
 */

export default function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-skeleton">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-eerie-black border border-seasalt/10 rounded-lg p-6 animate-pulse">
          <div className="mb-3">
            <div className="h-4 bg-seasalt/20 rounded w-2/3"></div>
          </div>
          <div>
            <div className="h-8 bg-seasalt/20 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-seasalt/20 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
}