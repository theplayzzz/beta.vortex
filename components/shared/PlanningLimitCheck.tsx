"use client";

import { useRawUsage } from '@/hooks/use-raw-usage';
import { AlertTriangle, CreditCard, Home, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export interface PlanningLimitInfo {
  exceeded: boolean;
  used: number;
  limit: number;
  baseLimit: number;
  bonusLimit: number;
  available: number;
  isLoading: boolean;
}

// Hook customizado para verificar limite de planejamentos
export function usePlanningLimit(): PlanningLimitInfo {
  const { data: rawUsage, isLoading: isRawUsageLoading } = useRawUsage();

  if (!rawUsage || isRawUsageLoading) {
    return {
      exceeded: false,
      used: 0,
      limit: 0,
      baseLimit: 0,
      bonusLimit: 0,
      available: 0,
      isLoading: true,
    };
  }

  const currentUsed = rawUsage.usedPlannings;
  const limitSnapshot = rawUsage.limitSnapshotPlannings;
  const bonusLimit = rawUsage.bonusPlannings;
  const totalLimit = limitSnapshot + bonusLimit;
  const available = Math.max(0, totalLimit - currentUsed);

  return {
    exceeded: currentUsed >= totalLimit,
    used: currentUsed,
    limit: totalLimit,
    baseLimit: limitSnapshot,
    bonusLimit: bonusLimit,
    available: available,
    isLoading: false,
  };
}

interface PlanningLimitBlockerProps {
  title: string;
  description: string;
  limitInfo: PlanningLimitInfo;
  showHomeButton?: boolean;
  onBack?: () => void;
}

// Componente de mensagem de bloqueio quando limite é excedido
export function PlanningLimitBlocker({
  title,
  description,
  limitInfo,
  showHomeButton = true,
  onBack
}: PlanningLimitBlockerProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-eerie-black border border-red-500/20 rounded-lg p-8 text-center max-w-md">
        <div className="mb-6">
          <AlertTriangle size={64} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-seasalt mb-2">
            {title}
          </h2>
          <p className="text-red-300">
            {description}
          </p>
        </div>

        {/* Estatísticas de uso */}
        <div className="bg-night rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-periwinkle" />
            <h3 className="text-sm font-medium text-seasalt">Uso do Plano</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-seasalt/70">
              <span>Usado este mês:</span>
              <span className="text-red-400 font-medium">{limitInfo.used}</span>
            </div>
            <div className="flex justify-between text-seasalt/70">
              <span>Limite do plano:</span>
              <span>{limitInfo.baseLimit}</span>
            </div>
            {limitInfo.bonusLimit > 0 && (
              <div className="flex justify-between text-seasalt/70">
                <span>Bônus disponível:</span>
                <span className="text-sgbus-green">{limitInfo.bonusLimit}</span>
              </div>
            )}
            <div className="border-t border-seasalt/10 pt-2 mt-2">
              <div className="flex justify-between text-seasalt font-medium">
                <span>Total disponível:</span>
                <span>{limitInfo.limit}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-seasalt/70 text-sm">
            Você já utilizou todos os planejamentos disponíveis este mês. 
            Para criar mais planejamentos, considere fazer upgrade do seu plano 
            ou aguarde o próximo período de cobrança.
          </p>
          
          <div className="flex flex-col gap-2">
            {showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Home size={20} />
                Voltar ao Dashboard
              </Link>
            )}
            
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-seasalt/10 hover:bg-seasalt/20 text-seasalt rounded-lg transition-colors"
              >
                Voltar
              </button>
            )}
            
            <Link
              href="/pricing" // Assumindo que existe uma página de preços
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-periwinkle/20 hover:bg-periwinkle/30 text-periwinkle rounded-lg transition-colors"
            >
              <TrendingUp size={16} />
              Ver Planos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlanningLimitWarningProps {
  limitInfo: PlanningLimitInfo;
  className?: string;
}

// Componente de aviso quando está próximo do limite (mas ainda não excedeu)
export function PlanningLimitWarning({ limitInfo, className = "" }: PlanningLimitWarningProps) {
  if (limitInfo.isLoading || limitInfo.exceeded || limitInfo.available > 2) {
    return null;
  }

  return (
    <div className={`bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-yellow-400">
          Limite próximo do esgotamento
        </h3>
      </div>
      <p className="text-yellow-300 text-sm">
        Você tem apenas {limitInfo.available} planejamento(s) restante(s) este mês 
        ({limitInfo.used}/{limitInfo.limit} usado).
      </p>
    </div>
  );
}