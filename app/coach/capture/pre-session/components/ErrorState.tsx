/**
 * Error state component for transcription sessions
 * Implements ETAPA 5 requirements from plan-009
 */

import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-8" data-testid="error-state">
      <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-seasalt mb-2">Erro ao carregar dados</h3>
      <p className="text-periwinkle mb-4">{error}</p>
      <button 
        onClick={onRetry}
        data-testid="retry-button"
        className="bg-sgbus-green text-night px-4 py-2 rounded-lg hover:bg-sgbus-green/90 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  )
}