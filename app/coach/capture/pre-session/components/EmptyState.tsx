/**
 * Empty state component for when no transcription sessions are found
 * Implements ETAPA 5 requirements from plan-009
 */

import { FileText } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="text-center py-8" data-testid="empty-state">
      <FileText size={48} className="text-periwinkle mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-seasalt mb-2">Nenhuma sessão encontrada</h3>
      <p className="text-periwinkle">Crie sua primeira sessão de transcrição para começar.</p>
    </div>
  )
}