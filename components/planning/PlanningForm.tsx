'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { SectorDetailsTab } from './tabs/SectorDetailsTab';
import { MarketingTab } from './tabs/MarketingTab';
import { CommercialTab } from './tabs/CommercialTab';
import { PlanningFormData, getDefaultValues } from '@/lib/planning/formSchema';
import { usePlanningForm } from '@/hooks/usePlanningForm';
import { validateCompleteForm, ValidationError } from '@/lib/planning/formValidation';

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
  
  // Estado para armazenar erros de validação do submit
  const [submitValidationErrors, setSubmitValidationErrors] = useState<Record<string, Record<string, string>>>({});
  
  // Estado para campos que foram tocados (focados e depois perderam o foco)
  const [touchedFields, setTouchedFields] = useState<Record<string, Set<string>>>({});
  
  // Estado para erros dinâmicos em tempo real
  const [realTimeErrors, setRealTimeErrors] = useState<Record<string, Record<string, string>>>({});
  
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
    defaultValues: getDefaultValues(client.industry),
    mode: 'onSubmit'
  });

  // Função para mudança segura de aba
  const safeSetCurrentTab = useCallback((tabIndex: number) => {
    setCurrentTab(tabIndex);
  }, [setCurrentTab]);

  // Disponibilizar função de mudança de aba para componente pai usando useRef pattern
  useEffect(() => {
    if (onTabChangeRef) {
      onTabChangeRef.current = safeSetCurrentTab;
    }
  }, [onTabChangeRef, safeSetCurrentTab]);

  // Função para auto-save no onBlur - REMOVIDA PARA EVITAR REDUNDÂNCIA
  const handleSaveOnBlur = useCallback(() => {
    const currentFormData = form.getValues();
    // A lógica de `updateFormData` agora é centralizada no `handleFieldChange`
    // para evitar chamadas duplas. O hook já lida com o "auto-save".
    console.log(' FYI: onBlur acionado, mas o salvamento agora é centralizado.');
  }, [form]);

  // Função para marcar campo como tocado (touched)
  const markFieldAsTouched = useCallback((tabId: string, fieldName: string) => {
    setTouchedFields(prev => {
      const newTouched = { ...prev };
      if (!newTouched[tabId]) {
        newTouched[tabId] = new Set();
      }
      newTouched[tabId].add(fieldName);
      return newTouched;
    });
  }, []);

  // Função para validar campo em tempo real e atualizar erros
  const validateFieldRealTime = useCallback((tabId: string, fieldName: string, value: any) => {
    let error: string | null = null;
    
    // Validação mais inteligente baseada no tipo de campo
    // Para campos numéricos, 0 é um valor válido
    if (tabId === 'detalhes_setor') {
      // Para detalhes do setor, importar as perguntas e validar baseado no tipo
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        error = `Campo obrigatório`;
      }
      // Para campos numéricos, não considerar 0 como erro
      if (typeof value === 'number' && value >= 0) {
        error = null; // 0 ou qualquer número positivo é válido
      }
    } else {
      // Para outras abas, validação básica
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        error = `Campo obrigatório`;
      }
    }
    
    setRealTimeErrors(prev => {
      const newErrors = { ...prev };
      if (!newErrors[tabId]) {
        newErrors[tabId] = {};
      }
      
      if (error) {
        newErrors[tabId][fieldName] = error;
      } else {
        delete newErrors[tabId][fieldName];
        // Se não há mais erros nesta aba, remover o objeto
        if (Object.keys(newErrors[tabId]).length === 0) {
          delete newErrors[tabId];
        }
      }
      
      return newErrors;
    });
  }, []);

  // Função para calcular quais abas têm erro baseado em campos tocados
  const updateTabErrorState = useCallback(() => {
    const tabsWithErrorsSet = new Set<number>();
    
    // Combinar erros do submit + erros em tempo real
    const allErrors = { ...submitValidationErrors, ...realTimeErrors };
    
    Object.entries(allErrors).forEach(([tabId, tabErrors]) => {
      const tabIndex = TABS.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return;
      
      const touchedFieldsForTab = touchedFields[tabId] || new Set();
      
      // Verificar se há algum campo tocado com erro
      const hasTouchedFieldWithError = Object.entries(tabErrors).some(([fieldName, error]) => {
        return touchedFieldsForTab.has(fieldName) && error;
      });
      
      if (hasTouchedFieldWithError) {
        tabsWithErrorsSet.add(tabIndex);
      }
    });
    
    setTabsWithErrors(tabsWithErrorsSet);
  }, [submitValidationErrors, realTimeErrors, touchedFields]);

  // Atualizar estado de erro das abas quando algo mudar
  useEffect(() => {
    updateTabErrorState();
  }, [updateTabErrorState]);

  // Carregar dados salvos do localStorage apenas uma vez na montagem
  useEffect(() => {
    // Os dados iniciais vêm do hook, que já os carrega do localStorage.
    // Aqui, apenas garantimos que o formulário seja populado com esses dados.
    console.log('🔍 Verificando dados iniciais para carregar no formulário:', {
      formData,
      hasData: formData && Object.keys(formData).length > 0
    });

    if (formData && Object.keys(formData).length > 0) {
      console.log('🔄 Resetando formulário com dados iniciais:', formData);
      form.reset(formData as PlanningFormData);

      // Disparar validação após o reset para garantir que o estado de `isValid` reflita os dados carregados
      setTimeout(() => {
        form.trigger();
        console.log('✅ Formulário inicializado e revalidado com dados salvos.');
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- Array de dependências VAZIO para rodar apenas uma vez

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

    // Limpar erro de validação do submit quando campo é alterado
    if (submitValidationErrors[currentTabId]?.[field]) {
      setSubmitValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[currentTabId]) {
          const { [field]: _, ...restErrors } = newErrors[currentTabId];
          newErrors[currentTabId] = restErrors;
        }
        return newErrors;
      });
    }

    // Validar campo em tempo real se foi tocado
    const touchedFieldsForTab = touchedFields[currentTabId] || new Set();
    if (touchedFieldsForTab.has(field)) {
      validateFieldRealTime(currentTabId, field, value);
    }

    // Centralizar o auto-save aqui
    const currentFormData = form.getValues();
    updateFormData(currentFormData as Partial<PlanningFormData>);

  }, [form, currentTab, updateFormData, submitValidationErrors, touchedFields, validateFieldRealTime]);

  // Nova função para lidar com onBlur
  const handleFieldBlur = useCallback((field: string) => {
    const safeCurrentTab = normalizeTabIndex(currentTab);
    const currentTabId = TABS[safeCurrentTab].id;
    
    // Marcar campo como tocado
    markFieldAsTouched(currentTabId, field);
    
    // Obter valor atual do campo para validar
    const currentFormData = form.getValues();
    let currentValue: any;
    
    switch (currentTabId) {
      case 'informacoes_basicas':
        currentValue = (currentFormData.informacoes_basicas as any)?.[field];
        break;
      case 'detalhes_setor':
        currentValue = (currentFormData.detalhes_do_setor as any)?.[field];
        break;
      case 'marketing':
        currentValue = (currentFormData.marketing as any)?.[field];
        break;
      case 'comercial':
        currentValue = (currentFormData.comercial as any)?.[field];
        break;
      default:
        currentValue = (currentFormData as any)[field];
    }
    
    // Validar campo em tempo real
    validateFieldRealTime(currentTabId, field, currentValue);
    
    console.log(`🔍 Campo ${field} perdeu foco - marcado como touched`);
  }, [currentTab, form, markFieldAsTouched, validateFieldRealTime]);

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

    // Validar formulário completo antes do submit
    const validationResult = validateCompleteForm(data);
    
    if (!validationResult.isValid) {
      console.log('❌ Validação do submit falhou:', validationResult);
      
      // Organizar erros por aba para passar aos componentes
      const errorsByTab: Record<string, Record<string, string>> = {};
      
      validationResult.errors.forEach(tabError => {
        if (tabError.hasErrors) {
          const tabId = getTabIdFromKey(tabError.tab);
          errorsByTab[tabId] = tabError.fieldErrors;
          
          // Marcar TODOS os campos com erro como tocados para mostrar os erros
          Object.keys(tabError.fieldErrors).forEach(fieldName => {
            markFieldAsTouched(tabId, fieldName);
          });
        }
      });
      
      // Atualizar estado de erros para passar aos componentes
      setSubmitValidationErrors(errorsByTab);
      
      // Navegar para primeira aba com erro
      if (validationResult.firstErrorTab !== undefined) {
        setCurrentTab(validationResult.firstErrorTab);
      }
      
      console.log('🚫 Submissão cancelada devido a erros de validação');
      return;
    }
    
    // Limpar erros se validação passou
    setSubmitValidationErrors({});
    setRealTimeErrors({});
    setTouchedFields({});
    
    console.log('📞 Chamando onSubmit com dados:', data);
    onSubmit(data);
    console.log('✅ onSubmit chamado com sucesso');
  }, [onSubmit, form, markFieldAsTouched]);

  // Função helper para mapear tab key para tab id
  const getTabIdFromKey = (tabKey: string): string => {
    const mapping: Record<string, string> = {
      'informacoes_basicas': 'informacoes_basicas',
      'detalhes_do_setor': 'detalhes_setor',
      'marketing': 'marketing',
      'comercial': 'comercial'
    };
    return mapping[tabKey] || tabKey;
  };

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
            O componente para a aba &quot;{currentTabConfig.label}&quot; não foi encontrado.
          </p>
        </div>
      );
    }

    const tabData = getCurrentTabData();

    console.log(`🔍 Dados da aba ${currentTabConfig.id}:`, tabData);

    // Obter erros específicos desta aba - combinar erros de submit + tempo real
    const submitErrors = submitValidationErrors[currentTabConfig.id] || {};
    const realTimeTabErrors = realTimeErrors[currentTabConfig.id] || {};
    const touchedFieldsForTab = touchedFields[currentTabConfig.id] || new Set();
    
    // REGRA IMPORTANTE: Só mostrar erros para campos que foram tocados pelo usuário
    const tabErrors: Record<string, string> = {};
    
    // Erros de submit (SÓ para campos tocados - nunca mostrar erro sem interação)
    Object.entries(submitErrors).forEach(([fieldName, error]) => {
      if (touchedFieldsForTab.has(fieldName)) {
        tabErrors[fieldName] = error;
      }
    });
    
    // Erros em tempo real (só para campos tocados)
    Object.entries(realTimeTabErrors).forEach(([fieldName, error]) => {
      if (touchedFieldsForTab.has(fieldName)) {
        tabErrors[fieldName] = error;
      }
    });

    const commonProps = {
      formData: tabData || {},
      onFieldChange: handleFieldChange,
      onFieldBlur: handleFieldBlur,
      errors: tabErrors // Agora passa os erros filtrados por campos tocados
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
    <div className="space-y-6" data-component="planning-form">
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
                role="tab"
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