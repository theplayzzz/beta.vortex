'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProposalFormSchema } from '@/lib/proposals/formSchema';
import { MODALIDADES_ENTREGA, SERVICOS_MARKETING, SERVICOS_COMERCIAIS, SERVICOS_IMPLEMENTACAO } from '@/lib/proposals/proposalConfig';

interface ScopeTabProps {
  form: UseFormReturn<ProposalFormSchema>;
}

export function ScopeTab({ form }: ScopeTabProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  const selectedServices = watch('servicos_incluidos') || [];

  const handleServiceToggle = (service: string) => {
    const currentServices = selectedServices;
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setValue('servicos_incluidos', updatedServices, { shouldValidate: true });
  };

  const handleGroupToggle = (groupServices: readonly string[]) => {
    const currentServices = selectedServices;
    const groupServicesArray = [...groupServices];
    const allGroupSelected = groupServicesArray.every(service => currentServices.includes(service));
    
    let updatedServices;
    if (allGroupSelected) {
      // Deselecionar todos do grupo
      updatedServices = currentServices.filter(service => !groupServicesArray.includes(service));
    } else {
      // Selecionar todos do grupo
      const newServices = groupServicesArray.filter(service => !currentServices.includes(service));
      updatedServices = [...currentServices, ...newServices];
    }
    
    setValue('servicos_incluidos', updatedServices, { shouldValidate: true });
  };

  const isGroupSelected = (groupServices: readonly string[]) => {
    return [...groupServices].every(service => selectedServices.includes(service));
  };

  const isGroupPartiallySelected = (groupServices: readonly string[]) => {
    const groupServicesArray = [...groupServices];
    const selectedCount = groupServicesArray.filter(service => selectedServices.includes(service)).length;
    return selectedCount > 0 && selectedCount < groupServicesArray.length;
  };

  const ServiceGroup = ({ 
    title, 
    letter, 
    services, 
    description 
  }: { 
    title: string; 
    letter: string; 
    services: readonly string[]; 
    description: string;
  }) => {
    const isSelected = isGroupSelected(services);
    const isPartial = isGroupPartiallySelected(services);

    return (
      <div className="bg-night rounded-lg p-4 border border-accent/10">
        {/* Header do grupo */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => handleGroupToggle(services)}
              className={`flex items-center p-2 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-sgbus-green/10 border-sgbus-green text-seasalt'
                  : isPartial
                    ? 'bg-yellow-500/10 border-yellow-500 text-seasalt'
                    : 'border-accent/20 text-seasalt/70 hover:border-accent/40'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                isSelected 
                  ? 'bg-sgbus-green border-sgbus-green' 
                  : isPartial
                    ? 'bg-yellow-500 border-yellow-500'
                    : 'border-accent/40'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-night" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {isPartial && (
                  <div className="w-2 h-2 bg-night rounded-sm" />
                )}
              </div>
              <div>
                <div className="text-left">
                  <span className="font-bold text-sgbus-green">{letter})</span>
                  <span className="font-semibold ml-2">{title}</span>
                </div>
                <p className="text-xs text-seasalt/50 text-left">{description}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Lista de serviços do grupo */}
        <div className="space-y-2 ml-4">
          {services.map((service) => {
            const isServiceSelected = selectedServices.includes(service);
            return (
              <label
                key={service}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  isServiceSelected
                    ? 'bg-sgbus-green/5 border-sgbus-green/30 text-seasalt'
                    : 'border-accent/10 text-seasalt/70 hover:border-accent/20 hover:bg-accent/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isServiceSelected}
                  onChange={() => handleServiceToggle(service)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                  isServiceSelected ? 'bg-sgbus-green border-sgbus-green' : 'border-accent/40'
                }`}>
                  {isServiceSelected && (
                    <svg className="w-2 h-2 text-night" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{service}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-seasalt mb-2">Escopo de Serviços</h3>
        <p className="text-seasalt/70 text-sm">
          Defina a modalidade de entrega e quais serviços serão incluídos
        </p>
      </div>

      {/* Modalidade de Entrega */}
      <div>
        <label htmlFor="modalidade_entrega" className="block text-sm font-medium text-seasalt mb-2">
          Modalidade de Entrega *
        </label>
        <select
          {...register('modalidade_entrega')}
          id="modalidade_entrega"
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione a modalidade de entrega</option>
          {MODALIDADES_ENTREGA.map((modalidade) => (
            <option key={modalidade} value={modalidade}>
              {modalidade}
            </option>
          ))}
        </select>
        {errors.modalidade_entrega && (
          <p className="mt-1 text-sm text-red-400">{errors.modalidade_entrega.message}</p>
        )}
        <p className="mt-1 text-sm text-seasalt/50">
          Como o trabalho será estruturado e entregue
        </p>
      </div>

      {/* Serviços Incluídos */}
      <div>
        <label className="block text-sm font-medium text-seasalt mb-3">
          Serviços Incluídos * ({selectedServices.length} selecionados)
        </label>
        <p className="text-sm text-seasalt/60 mb-4">
          As entregas serão organizadas conforme os blocos abaixo.
        </p>

        <div className="space-y-6">
          <ServiceGroup
            letter="A"
            title="SERVIÇOS DE MARKETING"
            description="Consultivo e Executivo"
            services={SERVICOS_MARKETING}
          />

          <ServiceGroup
            letter="B"
            title="SERVIÇOS COMERCIAIS"
            description="Consultivo e Executivo"
            services={SERVICOS_COMERCIAIS}
          />

          <ServiceGroup
            letter="C"
            title="IMPLEMENTAÇÃO/FERRAMENTAS"
            description="Técnico e Operacional"
            services={SERVICOS_IMPLEMENTACAO}
          />
        </div>

        {errors.servicos_incluidos && (
          <p className="mt-3 text-sm text-red-400">{errors.servicos_incluidos.message}</p>
        )}
        <p className="mt-3 text-sm text-seasalt/50">
          Selecione pelo menos um serviço que será incluído na proposta
        </p>
      </div>

      {/* Requisitos Especiais */}
      <div>
        <label htmlFor="requisitos_especiais" className="block text-sm font-medium text-seasalt mb-2">
          Requisitos Especiais
        </label>
        <textarea
          {...register('requisitos_especiais')}
          id="requisitos_especiais"
          rows={3}
          placeholder="Descreva requisitos específicos, ferramentas necessárias, integrações, compliance, etc..."
          className="w-full px-3 py-2 bg-night border border-accent/20 rounded-lg text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.requisitos_especiais ? (
            <p className="text-sm text-red-400">{errors.requisitos_especiais.message}</p>
          ) : (
            <p className="text-sm text-seasalt/50">
              Opcional. Requisitos técnicos, de compliance ou outras especificações.
            </p>
          )}
          <p className="text-xs text-seasalt/50">
            {watch('requisitos_especiais')?.length || 0}/500
          </p>
        </div>
      </div>
    </div>
  );
} 