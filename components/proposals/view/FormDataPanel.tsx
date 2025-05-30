'use client';

import { Calendar, Target, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';

interface FormDataPanelProps {
  formData: any;
  clientSnapshot: any;
}

export function FormDataPanel({ formData, clientSnapshot }: FormDataPanelProps) {
  if (!formData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
        <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
          <Target className="h-5 w-5 text-sgbus-green" />
          Informações da Proposta
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-seasalt/70">Tipo de Proposta</label>
            <p className="text-seasalt">{formData.tipo_proposta}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-seasalt/70">Modalidade de Entrega</label>
            <p className="text-seasalt">{formData.modalidade_entrega}</p>
          </div>
          
          {formData.descricao_objetivo && (
            <div>
              <label className="text-sm font-medium text-seasalt/70">Objetivo</label>
              <p className="text-seasalt">{formData.descricao_objetivo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Serviços Incluídos */}
      {formData.servicos_incluidos && formData.servicos_incluidos.length > 0 && (
        <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
          <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
            <Users className="h-5 w-5 text-sgbus-green" />
            Serviços Incluídos
          </h3>
          <div className="flex flex-wrap gap-2">
            {formData.servicos_incluidos.map((servico: string, index: number) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-sgbus-green/20 text-sgbus-green border border-sgbus-green/40 rounded-full text-sm"
              >
                {servico}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes do Projeto */}
      <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
        <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
          <Clock className="h-5 w-5 text-sgbus-green" />
          Detalhes do Projeto
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-seasalt/70">Urgência</label>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                formData.urgencia_projeto === 'Alta' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : 'bg-sgbus-green/20 text-sgbus-green border border-sgbus-green/40'
              }`}>
                {formData.urgencia_projeto}
              </span>
            </div>
          </div>
          
          {formData.prazo_estimado && (
            <div>
              <label className="text-sm font-medium text-seasalt/70">Prazo Estimado</label>
              <p className="text-seasalt">{formData.prazo_estimado}</p>
            </div>
          )}
          
          {formData.orcamento_estimado && (
            <div>
              <label className="text-sm font-medium text-seasalt/70">Orçamento Estimado</label>
              <p className="text-seasalt flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-sgbus-green" />
                {formData.orcamento_estimado}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tomador de Decisão */}
      <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
        <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
          <Users className="h-5 w-5 text-sgbus-green" />
          Decisão
        </h3>
        <div>
          <label className="text-sm font-medium text-seasalt/70">Tomador de Decisão</label>
          <p className="text-seasalt">{formData.tomador_decisao}</p>
        </div>
      </div>

      {/* Informações Adicionais */}
      {(formData.requisitos_especiais || formData.concorrentes_considerados || formData.contexto_adicional) && (
        <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
          <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
            <AlertCircle className="h-5 w-5 text-sgbus-green" />
            Informações Adicionais
          </h3>
          <div className="space-y-4">
            {formData.requisitos_especiais && (
              <div>
                <label className="text-sm font-medium text-seasalt/70">Requisitos Especiais</label>
                <p className="text-seasalt">{formData.requisitos_especiais}</p>
              </div>
            )}
            
            {formData.concorrentes_considerados && (
              <div>
                <label className="text-sm font-medium text-seasalt/70">Concorrentes Considerados</label>
                <p className="text-seasalt">{formData.concorrentes_considerados}</p>
              </div>
            )}
            
            {formData.contexto_adicional && (
              <div>
                <label className="text-sm font-medium text-seasalt/70">Contexto Adicional</label>
                <p className="text-seasalt">{formData.contexto_adicional}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snapshot do Cliente */}
      {clientSnapshot && (
        <div className="bg-night/50 border border-sgbus-green/20 rounded-lg p-6">
          <h3 className="text-seasalt flex items-center gap-2 mb-4 font-semibold">
            <Calendar className="h-5 w-5 text-sgbus-green" />
            Cliente (Snapshot)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-seasalt/70">Nome:</span>
              <span className="text-seasalt">{clientSnapshot.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-seasalt/70">Indústria:</span>
              <span className="text-seasalt">{clientSnapshot.industry || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-seasalt/70">Score de Riqueza:</span>
              <span className="px-3 py-1 bg-sgbus-green/20 text-sgbus-green border border-sgbus-green/40 rounded-full text-sm">
                {clientSnapshot.richnessScore}/100
              </span>
            </div>
            {clientSnapshot.snapshotAt && (
              <div className="text-xs text-seasalt/50 pt-2 border-t border-sgbus-green/20">
                Snapshot criado em: {new Date(clientSnapshot.snapshotAt).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 