"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Gift, CheckCircle, AlertCircle } from "lucide-react";
import { useBonusClaim } from "@/hooks/useBonusClaim";
import { useBonusClaimStatus } from "@/hooks/useBonusClaimStatus";

interface PromoNotificationProps {
  className?: string;
}

export default function PromoNotification({ className = "" }: PromoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pathname = usePathname();
  
  const { hasClaimedBonus, isLoading: statusLoading, markBonusAsClaimed } = useBonusClaimStatus();
  const { claimBonus, isLoading, isSuccess, isError, error } = useBonusClaim();

  // Banner only shows if user hasn't claimed the bonus yet
  useEffect(() => {
    if (statusLoading || hasClaimedBonus) {
      setIsVisible(false);
      return;
    }

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
  }, [pathname, statusLoading, hasClaimedBonus]);

  const handleClose = () => {
    setIsAnimating(false);
    // Adiciona um delay para a animação de saída antes de ocultar
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleClaimBonus = async () => {
    try {
      await claimBonus();
      markBonusAsClaimed();
      
      // Auto-hide after successful claim
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error claiming bonus:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Balão promocional */}
      <div
        className={`
          absolute top-full right-0 mt-2 z-50
          w-80 max-w-sm
          bg-eerie-black border border-sgbus-green/30 
          rounded-lg shadow-lg shadow-black/20
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        `}
      >
        {/* Seta apontando para cima */}
        <div className="absolute -top-2 right-4">
          <div className="w-4 h-4 bg-eerie-black border-l border-t border-sgbus-green/30 rotate-45"></div>
        </div>

        {/* Conteúdo do banner */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone promocional */}
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-sgbus-green" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Gift className="w-5 h-5 text-sgbus-green" />
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-seasalt mb-1">
                {isSuccess ? "🎉 Bônus Resgatado!" : "🎉 Funções Operacionais!"}
              </h3>
              {isSuccess ? (
                <p className="text-xs text-sgbus-green leading-relaxed mb-2">
                  Parabéns! Você resgatou 2 planejamentos refinados gratuitos. Eles já estão disponíveis para uso.
                </p>
              ) : isError ? (
                <div>
                  <p className="text-xs text-red-400 leading-relaxed mb-2">
                    {error || "Erro ao resgatar o bônus. Tente novamente."}
                  </p>
                  <p className="text-xs text-periwinkle/80 leading-relaxed">
                    Se o problema persistir, entre em contato com o suporte.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-periwinkle leading-relaxed mb-2">
                    Todas as funções já estão funcionando perfeitamente! Como bônus, você pode resgatar 2 planejamentos refinados gratuitos clicando no botão abaixo.
                  </p>
                  <p className="text-xs text-periwinkle/80 leading-relaxed">
                    Esta oferta é limitada e pode ser resgatada apenas uma vez.
                  </p>
                </div>
              )}
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-periwinkle/60 hover:text-seasalt transition-colors rounded"
              aria-label="Fechar oferta promocional"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Botão de resgate ou status */}
        <div className="px-4 pb-3">
          {!isSuccess && !isError && (
            <button
              onClick={handleClaimBonus}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-sgbus-green text-eerie-black font-medium text-sm rounded-md hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Resgatar bônus de planejamentos gratuitos"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-eerie-black/30 border-t-eerie-black rounded-full animate-spin"></div>
                  Resgatando...
                </span>
              ) : (
                "Resgatar Bônus"
              )}
            </button>
          )}
          
          {isError && (
            <button
              onClick={handleClaimBonus}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-amber-500 text-eerie-black font-medium text-sm rounded-md hover:bg-amber-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Tentando novamente..." : "Tentar Novamente"}
            </button>
          )}

          {isSuccess && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-sgbus-green/20 text-sgbus-green text-sm rounded-md">
              <CheckCircle className="w-4 h-4" />
              <span>Bônus resgatado com sucesso!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
