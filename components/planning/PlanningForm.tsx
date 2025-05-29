'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { SectorDetailsTab } from './tabs/SectorDetailsTab';
import { MarketingTab } from './tabs/MarketingTab';
import { CommercialTab } from './tabs/CommercialTab';
import { planningFormSchema, PlanningFormData, getDefaultValues } from '@/lib/planning/formSchema';
import { usePlanningForm } from '@/hooks/usePlanningForm';

interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
  createdAt?: Date;
}

interface PlanningFormProps {
  client: Client;
  onSubmit: (data: PlanningFormData) => void;
  onSaveDraft: (data: PlanningFormData) => void;
  onTabChangeRef?: (setTabFunction: (tab: number) => void) => void;
}

interface Tab {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

// Definir tabs fora do componente para evitar problemas de inicialização
const TABS: Tab[] = [
  { 
    id: "informacoes_basicas", 
    label: "Informações Básicas", 
    component: BasicInfoTab 
  },
  { 
    id: "detalhes_setor", 
    label: "Detalhes do Setor", 
    component: SectorDetailsTab 
  },
  { 
    id: "marketing", 
    label: "Marketing", 
    component: MarketingTab 
  },
  { 
    id: "comercial", 
    label: "Comercial", 
    component: CommercialTab 
  }
];

// Função para validar e normalizar o índice da aba
const normalizeTabIndex = (index: any): number => {
  // Converter para number e verificar se é válido
  const numIndex = typeof index === 'number' ? index : parseInt(index, 10);
  
  // Se for NaN, undefined, null ou inválido, retornar 0
  if (isNaN(numIndex) || numIndex < 0 || numIndex >= TABS.length) {
    console.warn(`⚠️ Índice de aba inválido: ${index}, usando 0`);
    return 0;
  }
  
  return numIndex;
};

export function PlanningForm({ client, onSubmit, onSaveDraft, onTabChangeRef }: PlanningFormProps) {
  console.log('🚀 PlanningForm inicializando com cliente:', client);

  // Inicializar com 0 e garantir que sempre seja um número válido
  const [currentTabState, setCurrentTabState] = useState<number>(0);
  
  // Getter que sempre retorna um valor válido
  const currentTab = normalizeTabIndex(currentTabState);
  
  // Setter que sempre define um valor válido
  const setCurrentTab = useCallback((newTab: number | string) => {
    const validTab = normalizeTabIndex(newTab);
    setCurrentTabState(validTab);
    console.log(`🔄 Aba alterada para: ${validTab} (${TABS[validTab]?.label || 'Indefinida'})`);
  }, []);

  const { formData, updateFormData } = usePlanningForm(client);

  const form = useForm<PlanningFormData>({
    resolver: zodResolver(planningFormSchema),
    defaultValues: getDefaultValues(client.industry),
    mode: 'onChange'
  });

  // Função para mudança segura de aba
  const safeSetCurrentTab = useCallback((tabIndex: number) => {
    setCurrentTab(tabIndex);
  }, [setCurrentTab]);

  // Disponibilizar função de mudança de aba para componente pai
  useEffect(() => {
    if (onTabChangeRef) {
      onTabChangeRef(safeSetCurrentTab);
    }
  }, [onTabChangeRef, safeSetCurrentTab]);

  // Auto-save para localStorage com throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((data) => {
      // Debounce para evitar muitas atualizações
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateFormData(data as Partial<PlanningFormData>);
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [updateFormData, form]);

  // Carregar dados salvos do localStorage apenas uma vez
  useEffect(() => {
    console.log('🔍 Verificando dados para carregar no formulário:', {
      formData,
      hasData: formData && Object.keys(formData).length > 0,
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid
    });

    if (formData && Object.keys(formData).length > 0) {
      // Resetar o formulário com os dados salvos
      console.log('🔄 Resetando formulário com dados salvos:', formData);
      form.reset(formData as PlanningFormData);
      
      // Forçar revalidação após reset
      setTimeout(() => {
        form.trigger();
        console.log('✅ Formulário resetado e revalidado');
      }, 100);
    }
  }, [formData, form]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    // currentTab já é normalizado, mas vamos ser extra cuidadosos
    const safeCurrentTab = normalizeTabIndex(currentTab);
    const currentTabId = TABS[safeCurrentTab].id;
    let fieldPath: string;

    // Mapear o campo para a estrutura aninhada baseada na aba atual
    switch (currentTabId) {
      case 'informacoes_basicas':
        fieldPath = `informacoes_basicas.${field}`;
        break;
      case 'detalhes_setor':
        fieldPath = `detalhes_do_setor.${field}`;
        break;
      case 'marketing':
        fieldPath = `marketing.${field}`;
        break;
      case 'comercial':
        fieldPath = `comercial.${field}`;
        break;
      default:
        fieldPath = field;
    }

    form.setValue(fieldPath as any, value, { shouldValidate: true, shouldDirty: true });
    console.log(`📝 Campo atualizado: ${fieldPath} = ${value}`);
  }, [form, currentTab]);

  const handleSaveDraft = useCallback(() => {
    const currentData = form.getValues();
    onSaveDraft(currentData);
  }, [form, onSaveDraft]);

  const handleFormSubmit = useCallback((data: PlanningFormData) => {
    console.log('📝 Formulário submetido:', data);
    onSubmit(data);
  }, [onSubmit]);

  const handleTabChange = useCallback((tabIndex: number) => {
    safeSetCurrentTab(tabIndex);
  }, [safeSetCurrentTab]);

  const getCurrentTabData = useCallback(() => {
    const allData = form.getValues();
    const safeCurrentTab = normalizeTabIndex(currentTab);
    const currentTabId = TABS[safeCurrentTab].id;
    
    switch (currentTabId) {
      case 'informacoes_basicas':
        return allData.informacoes_basicas || {};
      case 'detalhes_setor':
        return allData.detalhes_do_setor || {};
      case 'marketing':
        return allData.marketing || {};
      case 'comercial':
        return allData.comercial || {};
      default:
        return {};
    }
  }, [form, currentTab]);

  const getCurrentTabErrors = useCallback(() => {
    const errors = form.formState.errors;
    const safeCurrentTab = normalizeTabIndex(currentTab);
    const currentTabId = TABS[safeCurrentTab].id;
    
    // Função helper para extrair mensagens de erro de forma segura
    const extractErrorMessages = (errorObj: any): Record<string, string> => {
      if (!errorObj || typeof errorObj !== 'object') return {};
      
      const result: Record<string, string> = {};
      
      try {
        Object.keys(errorObj).forEach(key => {
          const error = errorObj[key];
          if (error) {
            if (typeof error === 'string') {
              result[key] = error;
            } else if (error && typeof error === 'object' && error.message) {
              result[key] = String(error.message);
            } else if (error) {
              result[key] = 'Erro de validação';
            }
          }
        });
      } catch (e) {
        console.warn('Erro ao processar erros de validação:', e);
      }
      
      return result;
    };
    
    switch (currentTabId) {
      case 'informacoes_basicas':
        return extractErrorMessages(errors.informacoes_basicas);
      case 'detalhes_setor':
        return extractErrorMessages(errors.detalhes_do_setor);
      case 'marketing':
        return extractErrorMessages(errors.marketing);
      case 'comercial':
        return extractErrorMessages(errors.comercial);
      default:
        return {};
    }
  }, [form.formState.errors, currentTab]);

  const renderCurrentTab = () => {
    // currentTab já é normalizado, mas vamos garantir mais uma vez
    const safeCurrentTab = normalizeTabIndex(currentTab);
    console.log(`🔍 Renderizando aba - currentTab: ${safeCurrentTab}, TABS.length: ${TABS.length}`);

    const currentTabConfig = TABS[safeCurrentTab];
    console.log(`🔍 Configuração da aba:`, currentTabConfig);
    
    if (!currentTabConfig) {
      console.error(`❌ Configuração da aba não encontrada para índice: ${safeCurrentTab}`);
      return (
        <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="font-medium mb-2">Erro de configuração</h4>
          <p className="text-sm">
            Configuração da aba não encontrada. Índice: {safeCurrentTab}, Total: {TABS.length}
          </p>
          <button 
            onClick={() => setCurrentTab(0)}
            className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded text-sm"
          >
            Voltar para primeira aba
          </button>
        </div>
      );
    }

    const TabComponent = currentTabConfig.component;
    if (!TabComponent) {
      console.error(`❌ Componente não encontrado para aba: ${currentTabConfig.id}`);
      return (
        <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="font-medium mb-2">Componente não encontrado</h4>
          <p className="text-sm">
            O componente para a aba "{currentTabConfig.label}" não foi encontrado.
          </p>
        </div>
      );
    }

    const tabData = getCurrentTabData();
    const tabErrors = getCurrentTabErrors();

    console.log(`🔍 Dados da aba ${currentTabConfig.id}:`, tabData);
    console.log(`🔍 Erros da aba ${currentTabConfig.id}:`, tabErrors);

    const commonProps = {
      formData: tabData || {},
      onFieldChange: handleFieldChange,
      errors: tabErrors || {}
    };

    try {
      switch (currentTabConfig.id) {
        case 'informacoes_basicas':
          return <TabComponent {...commonProps} client={client} />;
        case 'detalhes_setor':
          return <TabComponent {...commonProps} sector={client.industry} />;
        case 'marketing':
        case 'comercial':
          return <TabComponent {...commonProps} />;
        default:
          return <div className="text-seasalt">Aba não encontrada</div>;
      }
    } catch (error) {
      console.error(`❌ Erro ao renderizar aba ${currentTabConfig.id}:`, error);
      return (
        <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="font-medium mb-2">Erro ao carregar aba</h4>
          <p className="text-sm">
            Ocorreu um erro ao renderizar esta aba. Verifique o console para mais detalhes.
          </p>
          <pre className="text-xs mt-2 bg-night p-2 rounded overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        <nav className="flex space-x-8 border-b border-seasalt/20 p-4">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(index)}
              className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                currentTab === index
                  ? 'border-sgbus-green text-sgbus-green'
                  : 'border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                  currentTab === index 
                    ? 'bg-sgbus-green text-night' 
                    : 'bg-night text-periwinkle border border-seasalt/20'
                }`}>
                  {index + 1}
                </span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Form Content */}
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="p-6">
          <div className="min-h-[500px]">
            {renderCurrentTab()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 border-t border-seasalt/20 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => safeSetCurrentTab(currentTab - 1)}
              disabled={currentTab === 0}
              className="bg-transparent border-seasalt/20 text-seasalt hover:bg-seasalt/10"
            >
              ← Anterior
            </Button>

            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                className="bg-night text-seasalt hover:bg-night/80 border border-seasalt/20"
              >
                💾 Salvar Rascunho
              </Button>

              {currentTab < TABS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => safeSetCurrentTab(currentTab + 1)}
                  className="bg-sgbus-green text-night hover:bg-sgbus-green/90"
                >
                  Próximo →
                </Button>
              ) : (
                <Button 
                  type="submit"
                  className="bg-sgbus-green text-night hover:bg-sgbus-green/90"
                >
                  🚀 Finalizar Planejamento
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 