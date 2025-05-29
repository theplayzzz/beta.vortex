'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ClientHeader } from './ClientHeader';
import { FormProgress } from './FormProgress';
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
}

interface Tab {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

export function PlanningForm({ client, onSubmit, onSaveDraft }: PlanningFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const { progress, formData, updateFormData, prepareFinalPayload, hasSavedData } = usePlanningForm(client);

  const form = useForm<PlanningFormData>({
    resolver: zodResolver(planningFormSchema),
    defaultValues: getDefaultValues(client.industry),
    mode: 'onChange'
  });

  // Auto-save para localStorage
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateFormData(data as Partial<PlanningFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, updateFormData]);

  // Carregar dados salvos do localStorage
  useEffect(() => {
    if (formData) {
      form.reset(formData as any);
      console.log('🔄 Formulário resetado com dados salvos');
    }
  }, [formData, form]);

  const tabs: Tab[] = [
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

  const handleFieldChange = (field: string, value: any) => {
    form.setValue(field as any, value, { shouldValidate: true });
  };

  const handleSaveDraft = () => {
    const currentData = form.getValues();
    onSaveDraft(currentData);
  };

  const handleFormSubmit = (data: PlanningFormData) => {
    console.log('📝 Formulário submetido:', data);
    onSubmit(data);
  };

  const handleTabChange = (tabIndex: number) => {
    // Validar a aba atual antes de mudar (opcional)
    setCurrentTab(tabIndex);
  };

  const getCurrentTabData = () => {
    const allData = form.getValues();
    const currentTabId = tabs[currentTab].id;
    
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
  };

  const getCurrentTabErrors = () => {
    const errors = form.formState.errors;
    const currentTabId = tabs[currentTab].id;
    
    switch (currentTabId) {
      case 'informacoes_basicas':
        return errors.informacoes_basicas || {};
      case 'detalhes_setor':
        return errors.detalhes_do_setor || {};
      case 'marketing':
        return errors.marketing || {};
      case 'comercial':
        return errors.comercial || {};
      default:
        return {};
    }
  };

  const renderCurrentTab = () => {
    const TabComponent = tabs[currentTab].component;
    const tabData = getCurrentTabData();
    const tabErrors = getCurrentTabErrors();

    const commonProps = {
      formData: tabData,
      onFieldChange: handleFieldChange,
      errors: tabErrors
    };

    switch (tabs[currentTab].id) {
      case 'informacoes_basicas':
        return <TabComponent {...commonProps} client={client} />;
      case 'detalhes_setor':
        return <TabComponent {...commonProps} sector={client.industry} />;
      case 'marketing':
      case 'comercial':
        return <TabComponent {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ClientHeader client={client} />
      <FormProgress currentProgress={progress} currentTab={currentTab} />

      {/* Recovery notification */}
      {hasSavedData() && (
        <div className="mb-6 p-4 bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sgbus-green">💾</span>
            <p className="text-sgbus-green text-sm">
              Dados recuperados automaticamente do seu último preenchimento.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-seasalt/20">
          {tabs.map((tab, index) => (
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
                    : 'bg-eerie-black text-periwinkle'
                }`}>
                  {index + 1}
                </span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="min-h-[400px]">
            {renderCurrentTab()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 border-t border-seasalt/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
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
                className="bg-eerie-black text-seasalt hover:bg-eerie-black/80"
              >
                💾 Salvar Rascunho
              </Button>

              {currentTab < tabs.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentTab(Math.min(tabs.length - 1, currentTab + 1))}
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
      </Form>

      {/* Progress Summary */}
      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-periwinkle">
            Progresso geral: <strong className="text-seasalt">{progress}%</strong>
          </span>
          <span className="text-periwinkle">
            Aba {currentTab + 1} de {tabs.length}: <strong className="text-seasalt">{tabs[currentTab].label}</strong>
          </span>
        </div>
      </div>
    </div>
  );
} 