"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";

interface MaintenanceBannerProps {
  className?: string;
}

export default function MaintenanceBanner({ className = "" }: MaintenanceBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pathname = usePathname();

  // Banner sempre aparece quando a página carrega ou quando troca de rota
  useEffect(() => {
    // Reset do estado quando a rota muda
    setIsVisible(false);
    setIsAnimating(false);
    
    // Pequeno delay para uma animação mais suave
    const timer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 500);

    // Cleanup do timer se o componente for desmontado
    return () => clearTimeout(timer);
  }, [pathname]); // Dependência no pathname garante que execute a cada mudança de rota

  const handleClose = () => {
    setIsAnimating(false);
    // Adiciona um delay para a animação de saída antes de ocultar
    setTimeout(() => {
      setIsVisible(false);
      // Banner será fechado apenas temporariamente
      // Ressurgirá SEMPRE em: recarregamento, mudança de página, navegação
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
              <p className="text-xs text-periwinkle leading-relaxed mb-2">
                O servidor está passando por manutenção. Algumas funções podem não funcionar corretamente durante este período.
              </p>
              <p className="text-xs text-periwinkle/80 leading-relaxed">
                Assim que tudo estiver funcionando normalmente, uma mensagem indicará a resolução.
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

        {/* Barra de status de manutenção */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-periwinkle/60">Status do Sistema</span>
            <span className="text-xs text-amber-400 font-medium">Em Manutenção</span>
          </div>
          <div className="h-2 bg-eerie-black/50 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
