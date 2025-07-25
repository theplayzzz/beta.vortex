'use client';

import { Check, Loader2, Sparkles, AlertCircle, Clock } from 'lucide-react';

type TabState = 'generating' | 'ready' | 'new' | 'error' | 'waiting';

interface TabStatusIndicatorProps {
  state: TabState;
  message?: string;
  className?: string;
}

export function TabStatusIndicator({ state, message, className = '' }: TabStatusIndicatorProps) {
  // Configuração de ícones e estilos por estado
  const stateConfig = {
    generating: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: message || "IA Gerando...",
      className: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      animation: "animate-pulse"
    },
    ready: {
      icon: <Check className="h-4 w-4" />,
      text: message || "Pronto",
      className: "bg-gradient-to-r from-green-500/10 via-green-500/20 to-green-500/10 text-green-400 border border-green-500/30 hover:from-green-500/20 hover:via-green-500/30 hover:to-green-500/20",
      animation: "" // Sem animação para estado estável
    },
    new: {
      icon: <Sparkles className="h-4 w-4" />,
      text: message || "Novo",
      className: "bg-sgbus-green/20 text-sgbus-green border border-sgbus-green/30",
      animation: ""
    },
    waiting: {
      icon: <Clock className="h-4 w-4" />,
      text: message || "Aguardando",
      className: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      animation: ""
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      text: message || "Erro",
      className: "bg-red-500/20 text-red-400 border border-red-500/30",
      animation: ""
    }
  };
  
  const config = stateConfig[state];
  if (!config) return null;
  
  return (
    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all duration-300 ${config.className} ${config.animation} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
} 