/**
 * Loading skeleton component for transcription sessions
 * Implements ETAPA 5 requirements from plan-009
 */

interface SessionSkeletonProps {
  count?: number;
}

export default function SessionSkeleton({ count = 3 }: SessionSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse" data-testid="sessions-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-night border border-seasalt/10 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title and status */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-seasalt/20 rounded-full"></div>
                <div className="h-4 bg-seasalt/20 rounded w-3/4"></div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="h-3 bg-seasalt/20 rounded w-full"></div>
                <div className="h-3 bg-seasalt/20 rounded w-full"></div>
                <div className="h-3 bg-seasalt/20 rounded w-full"></div>
              </div>
              
              {/* Credits and time */}
              <div className="flex items-center gap-4">
                <div className="h-3 bg-seasalt/20 rounded w-16"></div>
                <div className="h-3 bg-seasalt/20 rounded w-12"></div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-seasalt/20 rounded-lg"></div>
              <div className="w-8 h-8 bg-seasalt/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}