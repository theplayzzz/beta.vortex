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
  onTabChangeRef?: React.MutableRefObject<(tab: number) => void>;
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
  const [tabsWithErrors, setTabsWithErrors] = useState<Set<number>>(new Set());
  const [pendingTabNavigation, setPendingTabNavigation] = useState<number | null>(null);
  
  // Getter que sempre retorna um valor válido
  const currentTab = normalizeTabIndex(currentTabState);
  
  // Setter que sempre define um valor válido
  const setCurrentTab = useCallback((newTab: number | string) => {
    const validTab = normalizeTabIndex(newTab);
    setCurrentTabState(validTab);
    console.log(`🔄 Aba alterada para: ${validTab} (${TABS[validTab]?.label || 'Indefinida'})`);
  }, []);

  // useEffect para lidar com navegação pendente de aba (corrige o erro de React)
  useEffect(() => {
    if (pendingTabNavigation !== null) {
      console.log(`🎯 Executando navegação pendente para aba: ${pendingTabNavigation}`);
      setCurrentTab(pendingTabNavigation);
      setPendingTabNavigation(null);
    }
  }, [pendingTabNavigation, setCurrentTab]);

  const { formData, updateFormData } = usePlanningForm(client);

  const form = useForm<PlanningFormData>({
    resolver: zodResolver(planningFormSchema),
    defaultValues: getDefaultValues(client.industry),
    mode: 'onBlur'
  });

  // Função para mudança segura de aba
  const safeSetCurrentTab = useCallback((tabIndex: number) => {
    setCurrentTab(tabIndex);
  }, [setCurrentTab]);

  // Disponibilizar função de mudança de aba para componente pai usando useRef pattern
  const tabChangeRef = useCallback((callback: (tab: number) => void) => {
    if (onTabChangeRef) {
      onTabChangeRef.current = callback;
    }
  }, [onTabChangeRef]);

  // Chamar o callback quando a função estiver pronta (após primeiro render)
  useEffect(() => {
    tabChangeRef(safeSetCurrentTab);
  }, [tabChangeRef, safeSetCurrentTab]);

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

    form.setValue(fieldPath as any, value, { shouldValidate: false, shouldDirty: true });
    console.log(`📝 Campo atualizado: ${fieldPath} = ${value}`);
  }, [form, currentTab]);

  const handleSaveDraft = useCallback(() => {
    const currentData = form.getValues();
    onSaveDraft(currentData);
  }, [form, onSaveDraft]);

  // Função helper para extrair mensagem de erro de forma segura
  const extractErrorMessage = (error: any): string => {
    if (!error) return 'Erro de validação';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error.message) return String(error.message);
    return 'Erro de validação';
  };

  // Função helper para nomes dos campos mais amigáveis
  const getFieldDisplayName = (fieldKey: string): string => {
    const fieldNames: { [key: string]: string } = {
      titulo_planejamento: 'Título do Planejamento',
      descricao_objetivo: 'Descrição do Objetivo',
      setor: 'Setor',
      maturidade_marketing: 'Maturidade de Marketing',
      meta_marketing: 'Meta de Marketing',
      meta_marketing_personalizada: 'Meta Marketing Personalizada',
      maturidade_comercial: 'Maturidade Comercial',
      meta_comercial: 'Meta Comercial',
      meta_comercial_personalizada: 'Meta Comercial Personalizada',
    };
    
    return fieldNames[fieldKey] || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleFormSubmit = useCallback(async (data: PlanningFormData) => {
    console.log('📝 INÍCIO DA SUBMISSÃO - Tentando submeter formulário:', data);
    console.log('📝 Estado do formulário:', {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      isValidating: form.formState.isValidating,
      errors: form.formState.errors
    });
    
    try {
      // Validar todo o formulário
      console.log('🔍 Iniciando validação completa do formulário...');
      const isValid = await form.trigger();
      console.log('🔍 Resultado da validação:', isValid);
      
      if (!isValid) {
        console.log('❌ Formulário tem erros, verificando abas...');
        
        // Obter todos os erros
        const errors = form.formState.errors;
        console.log('🔍 Erros encontrados:', errors);
        
        // Mapear erros para abas
        const tabsWithErrorsData: { tabIndex: number; tabName: string; errors: string[] }[] = [];
        const errorTabIndices = new Set<number>();
        
        // Verificar aba 1: Informações Básicas
        if (errors.informacoes_basicas) {
          const basicErrors = Object.entries(errors.informacoes_basicas).map(([field, error]) => {
            return `${getFieldDisplayName(field)}: ${extractErrorMessage(error)}`;
          });
          
          if (basicErrors.length > 0) {
            tabsWithErrorsData.push({
              tabIndex: 0,
              tabName: 'Informações Básicas',
              errors: basicErrors
            });
            errorTabIndices.add(0);
          }
        }
        
        // Verificar aba 2: Detalhes do Setor
        if (errors.detalhes_do_setor) {
          const sectorErrors = Object.entries(errors.detalhes_do_setor).map(([field, error]) => {
            return `${getFieldDisplayName(field)}: ${extractErrorMessage(error)}`;
          });
          
          if (sectorErrors.length > 0) {
            tabsWithErrorsData.push({
              tabIndex: 1,
              tabName: 'Detalhes do Setor',
              errors: sectorErrors
            });
            errorTabIndices.add(1);
          }
        }
        
        // Verificar aba 3: Marketing
        if (errors.marketing) {
          const marketingErrors = Object.entries(errors.marketing).map(([field, error]) => {
            return `${getFieldDisplayName(field)}: ${extractErrorMessage(error)}`;
          });
          
          if (marketingErrors.length > 0) {
            tabsWithErrorsData.push({
              tabIndex: 2,
              tabName: 'Marketing',
              errors: marketingErrors
            });
            errorTabIndices.add(2);
          }
        }
        
        // Verificar aba 4: Comercial
        if (errors.comercial) {
          const commercialErrors = Object.entries(errors.comercial).map(([field, error]) => {
            return `${getFieldDisplayName(field)}: ${extractErrorMessage(error)}`;
          });
          
          if (commercialErrors.length > 0) {
            tabsWithErrorsData.push({
              tabIndex: 3,
              tabName: 'Comercial',
              errors: commercialErrors
            });
            errorTabIndices.add(3);
          }
        }
        
        // Atualizar estado das abas com erro
        setTabsWithErrors(errorTabIndices);
        
        if (tabsWithErrorsData.length > 0) {
          const firstErrorTab = tabsWithErrorsData[0];
          
          // Mostrar mensagem de erro específica
          const errorMessage = tabsWithErrorsData.length === 1 
            ? `Há ${firstErrorTab.errors.length} erro(s) na aba "${firstErrorTab.tabName}"`
            : `Há erros em ${tabsWithErrorsData.length} abas. Navegando para "${firstErrorTab.tabName}"`;
          
          console.log(`🎯 ${errorMessage}`);
          console.log('📋 Detalhes dos erros:', firstErrorTab.errors);
          
          // Usar estado pendente para navegação de aba (corrige o erro de React)
          console.log(`🎯 Programando navegação para aba com erro: ${firstErrorTab.tabIndex}`);
          setPendingTabNavigation(firstErrorTab.tabIndex);
          
          console.log('❌ SUBMISSÃO CANCELADA - Erros de validação encontrados');
          return;
        } else {
          // Se não há erros específicos mas validação falhou, permitir submissão mesmo assim
          console.log('⚠️ Validação falhou mas não foram encontrados erros específicos, prosseguindo...');
        }
      } else {
        // Limpar erros das abas se tudo estiver válido
        setTabsWithErrors(new Set());
        console.log('✅ Validação passou - todas as abas estão válidas');
      }
      
      // Se chegou aqui, formulário está válido ou não tem erros específicos
      console.log('✅ PROSSEGUINDO COM SUBMISSÃO - Formulário considerado válido');
      console.log('📤 Dados finais para submissão:', data);
      
      console.log('📞 Chamando onSubmit com dados:', data);
      onSubmit(data);
      console.log('✅ onSubmit chamado com sucesso');
      
    } catch (error) {
      console.error('❌ ERRO NA SUBMISSÃO:', error);
      
      // Em caso de erro, tentar submeter mesmo assim
      console.log('🔄 Tentando submissão de emergência...');
      
      try {
        onSubmit(data);
        console.log('✅ Submissão de emergência bem-sucedida');
      } catch (emergencyError) {
        console.error('❌ Falha na submissão de emergência:', emergencyError);
      }
    }
  }, [onSubmit, form]);

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

    console.log(`🔍 Dados da aba ${currentTabConfig.id}:`, tabData);

    const commonProps = {
      formData: tabData || {},
      onFieldChange: handleFieldChange,
      errors: {} // Sempre vazio agora que removemos as mensagens
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
          {TABS.map((tab, index) => {
            const hasError = tabsWithErrors.has(index);
            const isActive = currentTab === index;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(index)}
                className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? hasError 
                      ? 'border-red-500 text-red-500' 
                      : 'border-sgbus-green text-sgbus-green'
                    : hasError
                      ? 'border-transparent text-red-400 hover:text-red-300 hover:border-red-400/40'
                      : 'border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                    isActive 
                      ? hasError
                        ? 'bg-red-500 text-white' 
                        : 'bg-sgbus-green text-night'
                      : hasError
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-night text-periwinkle border border-seasalt/20'
                  }`}>
                    {hasError ? '!' : index + 1}
                  </span>
                  <span>{tab.label}</span>
                  {hasError && !isActive && (
                    <span className="text-red-400 text-xs">●</span>
                  )}
                </span>
              </button>
            );
          })}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔄 Botão PRÓXIMO clicado - navegando para próxima aba');
                    safeSetCurrentTab(currentTab + 1);
                  }}
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