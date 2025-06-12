'use client';

import { Brain, Target, TrendingUp, Clock, Zap, AlertTriangle } from 'lucide-react';
import { AIInsights, AIMetadata, DadosExtras } from '@/lib/proposals/types';

interface AIInsightsPanelProps {
  insights?: AIInsights;
  metadata?: AIMetadata;
  extraData?: DadosExtras;
}

export function AIInsightsPanel({ insights, metadata, extraData }: AIInsightsPanelProps) {
  if (!insights && !metadata && !extraData) {
    return (
      <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
        <div className="text-center py-8">
          <Brain className="h-8 w-8 text-seasalt/30 mx-auto mb-3" />
          <p className="text-seasalt/50 text-sm">Insights da IA não disponíveis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score de Personalização */}
      {insights && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-sgbus-green font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Score de Personalização
          </h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-seasalt mb-2">
              {insights.personalization_score}/100
            </div>
            <div className="w-full bg-night rounded-full h-2 mb-3">
              <div 
                className="bg-sgbus-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${insights.personalization_score}%` }}
              />
            </div>
            <div className="text-sm text-seasalt/70">
              Nível de confiança: {insights.confidence_level}%
            </div>
          </div>
        </div>
      )}

      {/* Fatores de Decisão */}
      {extraData?.fatores_decisao && extraData.fatores_decisao.length > 0 && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-sgbus-green font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Fatores de Decisão
          </h3>
          <ul className="space-y-2">
            {extraData.fatores_decisao.map((fator, index) => (
              <li key={index} className="text-seasalt/80 text-sm flex items-start gap-2">
                <span className="text-sgbus-green mt-1">•</span>
                <span>{fator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Próximos Passos */}
      {extraData?.next_steps && extraData.next_steps.length > 0 && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-sgbus-green font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Próximos Passos
          </h3>
          <ol className="space-y-2">
            {extraData.next_steps.map((step, index) => (
              <li key={index} className="text-seasalt/80 text-sm flex items-start gap-2">
                <span className="text-sgbus-green font-bold text-xs bg-sgbus-green/20 rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Riscos Identificados */}
      {extraData?.riscos_identificados && extraData.riscos_identificados.length > 0 && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Riscos Identificados
          </h3>
          <ul className="space-y-2">
            {extraData.riscos_identificados.map((risco, index) => (
              <li key={index} className="text-seasalt/80 text-sm flex items-start gap-2">
                <span className="text-yellow-400 mt-1">⚠</span>
                <span>{risco}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dados Comerciais */}
      {extraData && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-sgbus-green font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dados Comerciais
          </h3>
          <div className="space-y-3">
            {extraData.valor_total && (
              <div className="flex justify-between items-center">
                <span className="text-seasalt/70 text-sm">Valor Total:</span>
                <span className="text-seasalt font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(extraData.valor_total)}
                </span>
              </div>
            )}
            
            {extraData.prazo_total_dias && (
              <div className="flex justify-between items-center">
                <span className="text-seasalt/70 text-sm">Prazo:</span>
                <span className="text-seasalt font-medium">
                  {extraData.prazo_total_dias} dias
                </span>
              </div>
            )}
            
            {extraData.nivel_complexidade && (
              <div className="flex justify-between items-center">
                <span className="text-seasalt/70 text-sm">Complexidade:</span>
                <span className="text-seasalt font-medium capitalize">
                  {extraData.nivel_complexidade}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadados Técnicos */}
      {metadata && (
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <h3 className="text-sgbus-green font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Detalhes Técnicos
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-seasalt/70">Modelo:</span>
              <span className="text-seasalt">{metadata.modelUsed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-seasalt/70">Tokens:</span>
              <span className="text-seasalt">{metadata.tokensUsed.toLocaleString()}</span>
            </div>
            {metadata.qualityScore && (
              <div className="flex justify-between">
                <span className="text-seasalt/70">Qualidade:</span>
                <span className="text-seasalt">{metadata.qualityScore}/100</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-seasalt/70">Gerado em:</span>
              <span className="text-seasalt">
                {new Date(metadata.generatedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 