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
          Defina o título, tipo e dados da contratada
        </p>
      </div>

      {/* Título da Proposta */}
      <div>
        <label htmlFor="titulo_da_proposta" className="block text-sm font-medium text-seasalt mb-2">
          Título da Proposta *
        </label>
        <input
          {...register('titulo_da_proposta')}
          type="text"
          id="titulo_da_proposta"
          placeholder="Ex: Consultoria em Marketing Digital para E-commerce"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.titulo_da_proposta && (
          <p className="mt-1 text-sm text-red-400">{errors.titulo_da_proposta.message}</p>
        )}
      </div>

      {/* Tipo de Proposta */}
      <div>
        <label htmlFor="tipo_de_proposta" className="block text-sm font-medium text-seasalt mb-2">
          Tipo de Proposta *
        </label>
        <select
          {...register('tipo_de_proposta')}
          id="tipo_de_proposta"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione o tipo de proposta</option>
          {TIPOS_PROPOSTA.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {errors.tipo_de_proposta && (
          <p className="mt-1 text-sm text-red-400">{errors.tipo_de_proposta.message}</p>
        )}
      </div>

      {/* Nome da Contratada */}
      <div>
        <label htmlFor="nome_da_contratada" className="block text-sm font-medium text-seasalt mb-2">
          Nome da Contratada *
        </label>
        <input
          {...register('nome_da_contratada')}
          type="text"
          id="nome_da_contratada"
          placeholder="Digite seu nome ou o nome da sua empresa"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        />
        {errors.nome_da_contratada && (
          <p className="mt-1 text-sm text-red-400">{errors.nome_da_contratada.message}</p>
        )}
      </div>

      {/* Membros da Equipe */}
      <div>
        <label htmlFor="membros_da_equipe" className="block text-sm font-medium text-seasalt mb-2">
          Membros da Equipe <span className="text-seasalt/50">(opcional)</span>
        </label>
        <textarea
          {...register('membros_da_equipe')}
          id="membros_da_equipe"
          rows={3}
          placeholder="Ex: João Silva (Designer), Maria Santos (Desenvolvedora)"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.membros_da_equipe ? (
            <p className="text-sm text-red-400">{errors.membros_da_equipe.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Liste os profissionais que farão parte da equipe do projeto
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('membros_da_equipe')?.length || 0}/300
          </p>
        </div>
      </div>
    </div>
  );
} 