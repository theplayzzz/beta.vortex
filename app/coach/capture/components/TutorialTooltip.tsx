import { useEffect, useState } from 'react';

interface TutorialTooltipProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function TutorialTooltip({ isVisible, onClose }: TutorialTooltipProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Pequeno delay para trigger da animação de entrada
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Aguarda animação de saída antes de remover do DOM
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`absolute top-8 -right-2 z-50 transition-all duration-300 ease-out ${
        isAnimating 
          ? 'opacity-100 transform translate-y-0 scale-100' 
          : 'opacity-0 transform -translate-y-2 scale-95'
      }`}
    >
      {/* Seta apontando para o botão - posicionada para apontar no centro do botão 18x18px */}
      <div 
        className="absolute -top-1 right-2 w-2.5 h-2.5 transform rotate-45 transition-opacity duration-300"
        style={{ 
          backgroundColor: 'rgba(251, 191, 36, 0.95)', 
          borderTop: '1px solid rgba(234, 179, 8, 0.8)',
          borderLeft: '1px solid rgba(234, 179, 8, 0.8)',
          opacity: isAnimating ? 1 : 0,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}
      ></div>
      
      {/* Conteúdo do tooltip */}
      <div 
        className="relative rounded-xl px-5 py-3 shadow-xl border whitespace-nowrap backdrop-blur-sm"
        style={{ 
          backgroundColor: 'rgba(251, 191, 36, 0.95)', 
          border: '1px solid rgba(234, 179, 8, 0.8)',
          boxShadow: '0 8px 25px rgba(251, 191, 36, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        {/* Conteúdo */}
        <p 
          className="text-base font-bold tracking-normal leading-tight" 
          style={{ 
            color: '#1a1a1a',
            opacity: 1,
            letterSpacing: '0.02em'
          }}
        >
          Tutorial de uso aqui
        </p>
      </div>
    </div>
  );
}