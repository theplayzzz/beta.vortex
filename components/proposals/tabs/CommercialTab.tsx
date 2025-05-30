'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProposalFormSchema } from '@/lib/proposals/formSchema';
import { URGENCIA_PROJETO, ORCAMENTO_ESTIMADO } from '@/lib/proposals/proposalConfig';

interface CommercialTabProps {
  form: UseFormReturn<ProposalFormSchema>;
}

export function CommercialTab({ form }: CommercialTabProps) {
  const { register, formState: { errors }, watch } = form;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-seasalt mb-2">Contexto Comercial</h3>
        <p className="text-seasalt/70 text-sm">
          Informações sobre orçamento, urgência e decisores do projeto
        </p>
      </div>

      {/* Orçamento Estimado */}
      <div>
        <label htmlFor="orcamento_estimado" className="block text-sm font-medium text-seasalt mb-2">
          Orçamento Estimado
        </label>
        <select
          {...register('orcamento_estimado')}
          id="orcamento_estimado"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione a faixa de orçamento (opcional)</option>
          {ORCAMENTO_ESTIMADO.map((orcamento) => (
            <option key={orcamento} value={orcamento}>
              {orcamento}
            </option>
          ))}
        </select>
        {errors.orcamento_estimado && (
          <p className="mt-1 text-sm text-red-400">{errors.orcamento_estimado.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Opcional. Faixa de investimento disponível para o projeto
        </p>
      </div>

      {/* Urgência do Projeto */}
      <div>
        <label htmlFor="urgencia_projeto" className="block text-sm font-medium text-seasalt mb-2">
          Urgência do Projeto *
        </label>
        <select
          {...register('urgencia_projeto')}
          id="urgencia_projeto"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione a urgência do projeto</option>
          {URGENCIA_PROJETO.map((urgencia) => (
            <option key={urgencia} value={urgencia}>
              {urgencia}
            </option>
          ))}
        </select>
        {errors.urgencia_projeto && (
          <p className="mt-1 text-sm text-red-400">{errors.urgencia_projeto.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Quando o cliente precisa ver resultados concretos
        </p>
      </div>

      {/* Tomador de Decisão */}
      <div>
        <label htmlFor="tomador_decisao" className="block text-sm font-medium text-seasalt mb-2">
          Tomador de Decisão *
        </label>
        <input
          {...register('tomador_decisao')}
          type="text"
          id="tomador_decisao"
          placeholder="Ex: João Silva - CEO, Maria Santos - Diretora de Marketing"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.tomador_decisao && (
          <p className="mt-1 text-sm text-red-400">{errors.tomador_decisao.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Quem tem autoridade para aprovar a proposta
        </p>
      </div>

      {/* Concorrentes Considerados */}
      <div>
        <label htmlFor="concorrentes_considerados" className="block text-sm font-medium text-seasalt mb-2">
          Concorrentes Considerados
        </label>
        <textarea
          {...register('concorrentes_considerados')}
          id="concorrentes_considerados"
          rows={3}
          placeholder="Liste outras empresas ou profissionais que estão concorrendo ou foram considerados..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.concorrentes_considerados ? (
            <p className="text-sm text-red-400">{errors.concorrentes_considerados.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Opcional. Isso ajuda a personalizar a proposta e destacar diferenciais.
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('concorrentes_considerados')?.length || 0}/300
          </p>
        </div>
      </div>

      {/* Contexto Adicional */}
      <div>
        <label htmlFor="contexto_adicional" className="block text-sm font-medium text-seasalt mb-2">
          Contexto Adicional
        </label>
        <textarea
          {...register('contexto_adicional')}
          id="contexto_adicional"
          rows={4}
          placeholder="Descreva qualquer informação adicional relevante: histórico de projetos anteriores, desafios específicos, expectativas especiais, etc..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.contexto_adicional ? (
            <p className="text-sm text-red-400">{errors.contexto_adicional.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Opcional. Qualquer informação que possa ser útil para criar uma proposta mais assertiva.
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('contexto_adicional')?.length || 0}/800
          </p>
        </div>
      </div>
    </div>
  );
} 