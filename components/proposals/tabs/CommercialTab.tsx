'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProposalFormSchema } from '@/lib/proposals/formSchema';
import { URGENCIA_PROJETO } from '@/lib/proposals/proposalConfig';

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
          Orçamento Estimado *
        </label>
        <input
          {...register('orcamento_estimado')}
          type="text"
          id="orcamento_estimado"
          placeholder="Ex: R$ 15.000,00 ou Entre R$ 10.000 - R$ 20.000"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.orcamento_estimado && (
          <p className="mt-1 text-sm text-red-400">{errors.orcamento_estimado.message}</p>
        )}
      </div>

      {/* Forma e Prazo de Pagamento */}
      <div>
        <label htmlFor="forma_prazo_pagamento" className="block text-sm font-medium text-seasalt mb-2">
          Forma e Prazo de Pagamento *
        </label>
        <textarea
          {...register('forma_prazo_pagamento')}
          id="forma_prazo_pagamento"
          rows={3}
          placeholder="Ex: Pagamento único em 30 dias, ou 50% inicial + 50% na entrega, ou 3x mensais com 10% desconto à vista"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.forma_prazo_pagamento ? (
            <p className="text-sm text-red-400">{errors.forma_prazo_pagamento.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Especifique condições de pagamento, parcelas e descontos
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('forma_prazo_pagamento')?.length || 0}/300
          </p>
        </div>
      </div>

      {/* Urgência do Projeto */}
      <div>
        <label htmlFor="urgencia_do_projeto" className="block text-sm font-medium text-seasalt mb-2">
          Urgência do Projeto *
        </label>
        <select
          {...register('urgencia_do_projeto')}
          id="urgencia_do_projeto"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione a urgência do projeto</option>
          {URGENCIA_PROJETO.map((urgencia) => (
            <option key={urgencia} value={urgencia}>
              {urgencia}
            </option>
          ))}
        </select>
        {errors.urgencia_do_projeto && (
          <p className="mt-1 text-sm text-red-400">{errors.urgencia_do_projeto.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Quando o cliente precisa ver resultados concretos
        </p>
      </div>

      {/* Tomador de Decisão */}
      <div>
        <label htmlFor="tomador_de_decisao" className="block text-sm font-medium text-seasalt mb-2">
          Tomador de Decisão *
        </label>
        <input
          {...register('tomador_de_decisao')}
          type="text"
          id="tomador_de_decisao"
          placeholder="Ex: João Silva - CEO, Maria Santos - Diretora de Marketing"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.tomador_de_decisao && (
          <p className="mt-1 text-sm text-red-400">{errors.tomador_de_decisao.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Quem tem autoridade para aprovar a proposta
        </p>
      </div>

      {/* Resumo da Dor/Problema do Cliente */}
      <div>
        <label htmlFor="resumo_dor_problema_cliente" className="block text-sm font-medium text-seasalt mb-2">
          Resumo da Dor/Problema do Cliente *
        </label>
        <textarea
          {...register('resumo_dor_problema_cliente')}
          id="resumo_dor_problema_cliente"
          rows={4}
          placeholder="Descreva o problema principal identificado na operação do cliente que esta proposta irá resolver..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.resumo_dor_problema_cliente ? (
            <p className="text-sm text-red-400">{errors.resumo_dor_problema_cliente.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Explique detalhadamente o problema que será solucionado
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('resumo_dor_problema_cliente')?.length || 0}/800
          </p>
        </div>
      </div>

      {/* Contexto Adicional */}
      <div>
        <label htmlFor="contexto_adicional" className="block text-sm font-medium text-seasalt mb-2">
          Contexto Adicional <span className="text-seasalt/50">(opcional)</span>
        </label>
        <textarea
          {...register('contexto_adicional')}
          id="contexto_adicional"
          rows={3}
          placeholder="Descreva qualquer informação adicional relevante: histórico de projetos anteriores, desafios específicos, expectativas especiais, etc..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.contexto_adicional ? (
            <p className="text-sm text-red-400">{errors.contexto_adicional.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Informações extras que podem ajudar na personalização da proposta
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