"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface MaintenanceBannerProps {
  className?: string;
}

export default function MaintenanceBanner({ className = "" }: MaintenanceBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Verifica se deve mostrar o banner ao carregar a página
  useEffect(() => {
    const hasSeenBanner = sessionStorage.getItem('maintenance-banner-closed');
    if (!hasSeenBanner) {
      // Pequeno delay para uma animação mais suave
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 500);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    // Adiciona um delay para a animação de saída antes de ocultar
    setTimeout(() => {
      setIsVisible(false);
      // Armazena no sessionStorage para não mostrar novamente na mesma sessão da aba
      // mas vai ressurgir em novas páginas/recarregamentos
      sessionStorage.setItem('maintenance-banner-closed', 'true');
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Balão de aviso */}
      <div
        className={`
          absolute top-full right-0 mt-2 z-50
          w-80 max-w-sm
          bg-eerie-black border border-accent/20 
          rounded-lg shadow-lg shadow-black/20
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        `}
      >
        {/* Seta apontando para cima */}
        <div className="absolute -top-2 right-4">
          <div className="w-4 h-4 bg-eerie-black border-l border-t border-accent/20 rotate-45"></div>
        </div>

        {/* Conteúdo do banner */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone de aviso */}
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-seasalt mb-1">
                Servidor em Manutenção
              </h3>
              <p className="text-xs text-periwinkle leading-relaxed">
                O servidor está passando por manutenção. Algumas funções podem não funcionar corretamente durante este período.
              </p>
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-periwinkle/60 hover:text-seasalt transition-colors rounded"
              aria-label="Fechar aviso de manutenção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha de status opcional */}
        <div className="h-1 bg-amber-400/20 rounded-b-lg">
          <div className="h-full w-3/4 bg-amber-400 rounded-bl-lg"></div>
        </div>
      </div>
    </div>
  );
}
