"use client";

import { useState, useEffect } from 'react';
import { X, Building2, DollarSign, AlertTriangle, Target, CheckCircle, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

interface SalesAgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalesAgentConfigData) => void;
  isLoading?: boolean;
}

export interface SalesAgentConfigData {
  companyName: string;
  industry: string;
  customIndustry?: string;
  revenue: string;
  agentType: 'GENERALISTA' | 'ESPECIALISTA';
  situation: string;
  problem: string;
  implication: string;
  solutionNeed: string;
}

const industries = [
  'Tecnologia/Software',
  'Varejo/E-commerce',
  'Serviços Financeiros',
  'Saúde/Farmacêutica',
  'Educação',
  'Manufatura/Indústria',
  'Construção/Imobiliário',
  'Agronegócio',
  'Serviços Profissionais',
  'Logística/Transporte',
  'Governo/Setor Público',
  'Outro'
];

const revenueRanges = [
  'Até R$ 70.000/mês',
  'R$ 70.000 - R$ 150.000/mês',
  'R$ 150.000 - R$ 300.000/mês',
  'R$ 300.000 - R$ 500.000/mês',
  'R$ 500.000 - R$ 750.000/mês',
  'R$ 750.000 - R$ 1.000.000/mês',
  'Mais de R$ 1.000.000/mês'
];

export default function SalesAgentConfigModal({ isOpen, onClose, onSubmit, isLoading = false }: SalesAgentConfigModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SalesAgentConfigData>({
    companyName: '',
    industry: '',
    customIndustry: '',
    revenue: '',
    agentType: 'ESPECIALISTA',
    situation: '',
    problem: '',
    implication: '',
    solutionNeed: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset isSubmitting quando isLoading mudar para false (requisição completou)
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);
  
  // Reset state quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setCurrentStep(1);
    }
  }, [isOpen]);
  
  const totalSteps = 5;
  
  const stepTitles = [
    'Informações da Empresa',
    'Situação Atual',
    'Problemas e Dores',
    'Consequências',
    'Seu Produto/Solução'
  ];
  
  const stepIcons = [
    Building2,
    CheckCircle,
    AlertTriangle,
    Target,
    Lightbulb
  ];

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Nome da empresa é obrigatório';
        } else if (formData.companyName.length > 90) {
          newErrors.companyName = 'Máximo de 90 caracteres';
        }
        
        if (!formData.industry) {
          newErrors.industry = 'Selecione uma indústria';
        }

        if (formData.industry === 'Outro' && !formData.customIndustry) {
          newErrors.customIndustry = 'Especifique a indústria';
        }

        if (!formData.revenue) {
          newErrors.revenue = 'Selecione o faturamento';
        }
        break;

      case 2:
        if (!formData.situation.trim()) {
          newErrors.situation = 'Descreva a situação atual';
        } else if (formData.situation.length > 500) {
          newErrors.situation = 'Máximo de 500 caracteres';
        }
        break;

      case 3:
        if (!formData.problem.trim()) {
          newErrors.problem = 'Descreva os problemas/dores';
        } else if (formData.problem.length > 500) {
          newErrors.problem = 'Máximo de 500 caracteres';
        }
        break;

      case 4:
        if (!formData.implication.trim()) {
          newErrors.implication = 'Descreva as consequências';
        } else if (formData.implication.length > 500) {
          newErrors.implication = 'Máximo de 500 caracteres';
        }
        break;

      case 5:
        if (!formData.solutionNeed.trim()) {
          newErrors.solutionNeed = 'Descreva seu produto/solução';
        } else if (formData.solutionNeed.length > 500) {
          newErrors.solutionNeed = 'Máximo de 500 caracteres';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Ativar loading imediatamente ao clicar em submit
        setIsSubmitting(true);
        
        // Pequeno delay para garantir que a animação seja visível
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Chamar onSubmit (não fechar o modal aqui, deixar o parent controlar)
        onSubmit(formData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: keyof SalesAgentConfigData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    const StepIcon = stepIcons[currentStep - 1];
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <StepIcon size={32} className="text-sgbus-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-seasalt">{stepTitles[0]}</h3>
              <p className="text-sm text-periwinkle mt-2">Colete as informações básicas do cliente para personalizar a transcrição e análise da reunião</p>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-seasalt mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Digite o nome da empresa..."
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none"
                maxLength={90}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-periwinkle">{formData.companyName.length}/90 caracteres</span>
                {errors.companyName && <p className="text-red-400 text-xs">{errors.companyName}</p>}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-seasalt mb-2">
                Setor da Indústria
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none"
              >
                <option value="">Selecione o setor...</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && <p className="text-red-400 text-xs mt-1">{errors.industry}</p>}
            </div>

            {formData.industry === 'Outro' && (
              <div>
                <label className="block text-sm font-medium text-seasalt mb-2">
                  Especificar Setor
                </label>
                <input
                  type="text"
                  value={formData.customIndustry || ''}
                  onChange={(e) => handleInputChange('customIndustry', e.target.value)}
                  placeholder="Especifique o setor..."
                  className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none"
                />
                {errors.customIndustry && <p className="text-red-400 text-xs mt-1">{errors.customIndustry}</p>}
              </div>
            )}

            {/* Revenue */}
            <div>
              <label className="block text-sm font-medium text-seasalt mb-2">
                Porte - Faturamento Mensal
              </label>
              <select
                value={formData.revenue}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none"
              >
                <option value="">Selecione o faturamento...</option>
                {revenueRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
              {errors.revenue && <p className="text-red-400 text-xs mt-1">{errors.revenue}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <StepIcon size={32} className="text-sgbus-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-seasalt">{stepTitles[1]}</h3>
              <p className="text-sm text-periwinkle mt-2">Como você descreveria a situação atual do seu cliente?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-seasalt mb-3">
                Situação Atual do Cliente
              </label>
              <p className="text-xs text-periwinkle mb-3 italic">
                Exemplo: &quot;Cliente usa planilhas manuais para controlar estoque de 3 lojas, com 2 funcionários dedicados a isso&quot;
              </p>
              <textarea
                value={formData.situation}
                onChange={(e) => handleInputChange('situation', e.target.value)}
                placeholder="Descreva a situação atual do cliente em relação ao problema que seu produto/serviço resolve..."
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none resize-none"
                rows={8}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-periwinkle">{formData.situation.length}/500 caracteres</span>
                {errors.situation && <p className="text-red-400 text-xs">{errors.situation}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <StepIcon size={32} className="text-sgbus-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-seasalt">{stepTitles[2]}</h3>
              <p className="text-sm text-periwinkle mt-2">Quais são os principais problemas e dores do cliente?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-seasalt mb-3">
                Problemas e Dores
              </label>
              <p className="text-xs text-periwinkle mb-3 italic">
                Exemplo: &quot;Perde 20% das vendas por ruptura de estoque, gasta 40h/mês em retrabalho manual, não consegue prever demanda&quot;
              </p>
              <textarea
                value={formData.problem}
                onChange={(e) => handleInputChange('problem', e.target.value)}
                placeholder="Descreva os principais problemas/dores que seu cliente enfrenta hoje e que seu produto/serviço pode resolver..."
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none resize-none"
                rows={8}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-periwinkle">{formData.problem.length}/500 caracteres</span>
                {errors.problem && <p className="text-red-400 text-xs">{errors.problem}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <StepIcon size={32} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-seasalt">{stepTitles[3]}</h3>
              <p className="text-sm text-periwinkle mt-2">O que acontece se não resolver esses problemas?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-seasalt mb-3">
                Consequências de Não Resolver
              </label>
              <p className="text-xs text-periwinkle mb-3 italic">
                Exemplo: &quot;Perda de R$50k/mês, impossibilidade de abrir nova filial, risco de multas regulatórias&quot;
              </p>
              <textarea
                value={formData.implication}
                onChange={(e) => handleInputChange('implication', e.target.value)}
                placeholder="O que acontece com o negócio do seu cliente se ele NÃO resolver esses problemas nos próximos 6-12 meses?"
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none resize-none"
                rows={8}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-periwinkle">{formData.implication.length}/500 caracteres</span>
                {errors.implication && <p className="text-red-400 text-xs">{errors.implication}</p>}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <StepIcon size={32} className="text-sgbus-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-seasalt">{stepTitles[4]}</h3>
              <p className="text-sm text-periwinkle mt-2">Descreva detalhadamente seu produto/solução e como ele resolve os problemas do cliente</p>
              <div className="bg-night/30 rounded-lg p-3 mt-4 text-left">
                <p className="text-xs text-periwinkle leading-relaxed">
                  <span className="text-sgbus-green font-medium">Importante:</span> Explique o que seu produto faz, seus principais diferenciais, como ele funciona e especificamente como resolve as necessidades que o cliente descreveu nas etapas anteriores. Seja detalhado - essas informações serão usadas para personalizar a transcrição da reunião.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-seasalt mb-3">
                Seu Produto/Solução e Benefícios
              </label>
              <p className="text-xs text-periwinkle mb-3 italic">
                Exemplo: &quot;Nossa plataforma SaaS automatiza controle de estoque em tempo real, integra com PDV, reduz erros em 95% e permite gerenciar múltiplas lojas remotamente&quot;
              </p>
              <textarea
                value={formData.solutionNeed}
                onChange={(e) => handleInputChange('solutionNeed', e.target.value)}
                placeholder="Descreva seu produto/solução, principais funcionalidades, diferenciais e como resolve especificamente os problemas do cliente..."
                className="w-full px-4 py-3 bg-night text-seasalt border border-seasalt/20 rounded-lg focus:border-sgbus-green focus:outline-none resize-none"
                rows={8}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-periwinkle">{formData.solutionNeed.length}/500 caracteres</span>
                {errors.solutionNeed && <p className="text-red-400 text-xs">{errors.solutionNeed}</p>}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-eerie-black border border-seasalt/10 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-seasalt/10">
          <h2 className="text-xl font-bold text-seasalt flex items-center gap-3">
            <Target size={20} className="text-sgbus-green" />
            Alimentar Informações do seu Cliente
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-periwinkle hover:text-seasalt transition-colors rounded-lg hover:bg-seasalt/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-seasalt/10">
          <div className="flex items-center justify-between text-xs text-periwinkle mb-3">
            <span>Etapa {currentStep} de {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% concluído</span>
          </div>
          <div className="w-full bg-night rounded-full h-2">
            <div 
              className="bg-sgbus-green h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Loading Overlay */}
        {(isSubmitting || isLoading) && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
            <div className="bg-eerie-black border border-sgbus-green/50 rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-seasalt/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-sgbus-green rounded-full animate-spin border-t-transparent"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-seasalt mb-2">Preparando sua sessão...</p>
                <p className="text-sm text-periwinkle">Configurando transcrição com IA</p>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-sgbus-green rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-sgbus-green rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-sgbus-green rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-seasalt/10">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep === 1 
                ? 'text-periwinkle/50 cursor-not-allowed' 
                : 'text-periwinkle hover:text-seasalt border border-seasalt/20 hover:border-seasalt/40'
            }`}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i + 1 <= currentStep ? 'bg-sgbus-green' : 'bg-seasalt/20'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-lg transition-all hover:scale-105"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isLoading}
              className={`flex items-center gap-2 px-6 py-2 font-semibold rounded-lg transition-all ${
                (isSubmitting || isLoading)
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-sgbus-green hover:bg-sgbus-green/90 text-night hover:scale-105'
              }`}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                  Criando Sessão...
                </>
              ) : (
                <>
                  Iniciar Sessão
                  <Target size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}