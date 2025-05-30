'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
  title = "Confirmar Ação",
  confirmText = "Sim",
  cancelText = "Cancelar", 
  isLoading = false
}: ConfirmationModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-night/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-eerie-black rounded-lg border border-accent/20 shadow-2xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-seasalt/20">
          <h3 className="text-lg font-semibold text-seasalt">
            {title}
          </h3>
          {!isLoading && (
            <button
              onClick={onCancel}
              className="p-1 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-seasalt/10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-seasalt/80 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-seasalt/20">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-night/20 border-t-night rounded-full animate-spin"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 