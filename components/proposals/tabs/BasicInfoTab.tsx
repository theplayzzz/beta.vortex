'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProposalFormSchema } from '@/lib/proposals/formSchema';
import { TIPOS_PROPOSTA } from '@/lib/proposals/proposalConfig';

interface BasicInfoTabProps {
  form: UseFormReturn<ProposalFormSchema>;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
  const { register, formState: { errors }, watch } = form;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-seasalt mb-2">Informações Básicas</h3>
        <p className="text-seasalt/70 text-sm">
          Defina o título, tipo e objetivo principal da proposta
        </p>
      </div>

      {/* Título da Proposta */}
      <div>
        <label htmlFor="titulo_proposta" className="block text-sm font-medium text-seasalt mb-2">
          Título da Proposta *
        </label>
        <input
          {...register('titulo_proposta')}
          type="text"
          id="titulo_proposta"
          placeholder="Ex: Consultoria em Marketing Digital para E-commerce"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.titulo_proposta && (
          <p className="mt-1 text-sm text-red-400">{errors.titulo_proposta.message}</p>
        )}
      </div>

      {/* Tipo de Proposta */}
      <div>
        <label htmlFor="tipo_proposta" className="block text-sm font-medium text-seasalt mb-2">
          Tipo de Proposta *
        </label>
        <select
          {...register('tipo_proposta')}
          id="tipo_proposta"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione o tipo de proposta</option>
          {TIPOS_PROPOSTA.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {errors.tipo_proposta && (
          <p className="mt-1 text-sm text-red-400">{errors.tipo_proposta.message}</p>
        )}
      </div>

      {/* Descrição/Objetivo */}
      <div>
        <label htmlFor="descricao_objetivo" className="block text-sm font-medium text-seasalt mb-2">
          Descrição e Objetivo *
        </label>
        <textarea
          {...register('descricao_objetivo')}
          id="descricao_objetivo"
          rows={4}
          placeholder="Descreva detalhadamente o objetivo da proposta, o que será entregue e quais problemas serão resolvidos..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.descricao_objetivo ? (
            <p className="text-sm text-red-400">{errors.descricao_objetivo.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Mínimo 20 caracteres. Seja específico sobre os resultados esperados.
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('descricao_objetivo')?.length || 0}/1000
          </p>
        </div>
      </div>

      {/* Prazo Estimado */}
      <div>
        <label htmlFor="prazo_estimado" className="block text-sm font-medium text-seasalt mb-2">
          Prazo Estimado *
        </label>
        <input
          {...register('prazo_estimado')}
          type="text"
          id="prazo_estimado"
          placeholder="Ex: 3 meses, 6 semanas, 45 dias úteis"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.prazo_estimado && (
          <p className="mt-1 text-sm text-red-400">{errors.prazo_estimado.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Informe o tempo necessário para conclusão do projeto
        </p>
      </div>
    </div>
  );
} 