"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  User, 
  Building, 
  Target, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  ChevronDown,
  ChevronRight,
  Save,
  Edit3,
  Check,
  AlertCircle,
  Archive,
  MoreVertical,
  ChevronLeft,
  FileText,
  Users,
  Megaphone,
  Clock,
  Zap,
  Award,
  DollarSign,
  MessageCircle,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import Link from "next/link";
import NotesAndAttachments from "@/components/client/notes-and-attachments";
import { SectorSelect } from "@/components/ui/sector-select";
import { DisabledSection } from "@/components/ui/disabled-section";
import { useClient, useUpdateClient, useDeleteClient } from "@/lib/react-query";

interface ClientData {
  id: string;
  name: string;
  industry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  businessDetails?: string;
  targetAudience?: string;
  marketingObjectives?: string;
  historyAndStrategies?: string;
  challengesOpportunities?: string;
  competitors?: string;
  resourcesBudget?: string;
  toneOfVoice?: string;
  preferencesRestrictions?: string;
  richnessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: {
    key: keyof ClientData;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'sector-select';
    placeholder: string;
  }[];
}

const SECTIONS: Section[] = [
  {
    id: 'basic',
    title: 'Informações Básicas',
    icon: User,
    fields: [
      { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da empresa ou cliente' },
      { key: 'industry', label: 'Setor de Atuação', type: 'sector-select', placeholder: 'Selecione o setor' },
      { key: 'serviceOrProduct', label: 'Produto/Serviço Principal', type: 'text', placeholder: 'Descreva o principal produto ou serviço' },
      { key: 'initialObjective', label: 'Objetivo Inicial', type: 'textarea', placeholder: 'Qual é o principal objetivo do cliente?' }
    ]
  },
  {
    id: 'contact',
    title: 'Informações de Contato',
    icon: Phone,
    fields: [
      { key: 'contactEmail', label: 'E-mail', type: 'email', placeholder: 'email@empresa.com' },
      { key: 'contactPhone', label: 'Telefone', type: 'tel', placeholder: '(11) 99999-9999' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://www.empresa.com' },
      { key: 'address', label: 'Endereço', type: 'text', placeholder: 'Endereço completo da empresa' }
    ]
  },
  {
    id: 'business',
    title: 'Detalhes do Negócio',
    icon: Building,
    fields: [
      { key: 'businessDetails', label: 'Detalhes do Negócio', type: 'textarea', placeholder: 'Descreva mais detalhes sobre o negócio e contexto' },
      { key: 'targetAudience', label: 'Público-alvo', type: 'textarea', placeholder: 'Quem é o público-alvo ideal?' },
      { key: 'competitors', label: 'Concorrentes', type: 'textarea', placeholder: 'Principais concorrentes no mercado' }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing e Objetivos',
    icon: Megaphone,
    fields: [
      { key: 'marketingObjectives', label: 'Objetivos de Marketing', type: 'textarea', placeholder: 'Quais são os principais objetivos de marketing?' },
      { key: 'historyAndStrategies', label: 'Histórico e Estratégias', type: 'textarea', placeholder: 'Estratégias já utilizadas e histórico relevante' },
      { key: 'challengesOpportunities', label: 'Desafios e Oportunidades', type: 'textarea', placeholder: 'Principais desafios e oportunidades identificadas' }
    ]
  },
  {
    id: 'resources',
    title: 'Recursos e Preferências',
    icon: DollarSign,
    fields: [
      { key: 'resourcesBudget', label: 'Recursos e Orçamento', type: 'textarea', placeholder: 'Informações sobre recursos disponíveis e orçamento' },
      { key: 'toneOfVoice', label: 'Tom de Voz', type: 'textarea', placeholder: 'Como a marca se comunica? Qual o tom desejado?' },
      { key: 'preferencesRestrictions', label: 'Preferências e Restrições', type: 'textarea', placeholder: 'Preferências específicas e restrições importantes' }
    ]
  }
];

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [showActions, setShowActions] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [localClientData, setLocalClientData] = useState<ClientData | null>(null);
  const [isSticky, setIsSticky] = useState(false);

  const { 
    data: clientResponse, 
    isLoading, 
    error: clientError,
    refetch 
  } = useClient(clientId);

  const { 
    mutate: updateClient, 
    isPending: isUpdating,
    error: updateError 
  } = useUpdateClient();

  const { 
    mutate: deleteClient, 
    isPending: isDeleting 
  } = useDeleteClient();

  const clientData = clientResponse?.client;

  useEffect(() => {
    if (clientData && !hasUserChanges) {
      setLocalClientData({
        ...clientData,
        createdAt: new Date(clientData.createdAt),
        updatedAt: new Date(clientData.updatedAt)
      });
    }
  }, [clientData, hasUserChanges]);

  // Throttle function for scroll performance
  const throttle = (func: Function, delay: number) => {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    };
  };

  // Scroll detection for sticky bar
  useEffect(() => {
    const handleScroll = throttle(() => {
      const currentScrollY = window.scrollY;
      setIsSticky(currentScrollY > 100);
    }, 16); // 60fps throttling

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Função para salvar dados quando campo perde foco
  const handleSave = () => {
    // Só salvar se há mudanças do usuário e dados válidos
    if (!localClientData || isLoading || !hasUserChanges) {
      return;
    }

    // Garantir que não está tentando salvar dados inválidos
    if (!localClientData.name || localClientData.name.trim() === '') {
      return;
    }

    const validData = getValidClientData(localClientData);
    
    updateClient({
      id: clientId,
      ...validData,
    }, {
      onSuccess: () => {
        setLastSaved(new Date());
        setHasUserChanges(false);
      },
      onError: (error) => {
        console.error('Erro ao salvar cliente:', error);
      }
    });
  };

  const calculateRichnessScore = (data: ClientData): number => {
    const allFields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ];

    const transformedData = { ...data };
    
    const filledFields = allFields.filter(field => {
      const value = transformedData[field as keyof ClientData];
      return value && value.toString().trim().length > 0;
    });

    const score = Math.round((filledFields.length / allFields.length) * 100);
    
    return score;
  };

  useEffect(() => {
    if (localClientData) {
      const newScore = calculateRichnessScore(localClientData);
      if (newScore !== localClientData.richnessScore) {
        // Atualizar o score sem marcar como mudança do usuário
        setLocalClientData(prev => prev ? { ...prev, richnessScore: newScore } : null);
      }
    }
  }, [localClientData?.industry, localClientData?.serviceOrProduct, localClientData?.initialObjective, 
      localClientData?.contactEmail, localClientData?.contactPhone, localClientData?.website, 
      localClientData?.address, localClientData?.businessDetails, localClientData?.targetAudience,
      localClientData?.marketingObjectives, localClientData?.historyAndStrategies, localClientData?.challengesOpportunities,
      localClientData?.competitors, localClientData?.resourcesBudget, localClientData?.toneOfVoice, 
      localClientData?.preferencesRestrictions]);

  const getValidClientData = (data: ClientData) => {
    // Função auxiliar para limpar strings vazias
    const cleanValue = (value: string | undefined | null) => {
      if (!value || value.trim() === '') return undefined;
      return value.trim();
    };

    const explicitData = {
      name: cleanValue(data.name),
      industry: cleanValue(data.industry),
      serviceOrProduct: cleanValue(data.serviceOrProduct),
      initialObjective: cleanValue(data.initialObjective),
      contactEmail: cleanValue(data.contactEmail),
      contactPhone: cleanValue(data.contactPhone),
      website: cleanValue(data.website),
      address: cleanValue(data.address),
      businessDetails: cleanValue(data.businessDetails),
      targetAudience: cleanValue(data.targetAudience),
      marketingObjectives: cleanValue(data.marketingObjectives),
      historyAndStrategies: cleanValue(data.historyAndStrategies),
      challengesOpportunities: cleanValue(data.challengesOpportunities),
      competitors: cleanValue(data.competitors),
      resourcesBudget: cleanValue(data.resourcesBudget),
      toneOfVoice: cleanValue(data.toneOfVoice),
      preferencesRestrictions: cleanValue(data.preferencesRestrictions),
    };

    // Remover campos undefined para evitar problemas na API
    return Object.fromEntries(
      Object.entries(explicitData).filter(([_, value]) => value !== undefined)
    );
  };

  const handleFieldChange = (field: keyof ClientData, value: string) => {
    setLocalClientData(prev => prev ? { ...prev, [field]: value } : null);
    setHasUserChanges(true);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getRichnessColor = (score: number) => {
    if (score >= 80) return 'text-sgbus-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRichnessGradient = (score: number) => {
    if (score >= 80) return 'from-sgbus-green to-green-400';
    if (score >= 50) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-red-500';
  };

  const getMotivationalMessage = (score: number) => {
    if (score >= 90) return 'Perfil excepcional! 🎉';
    if (score >= 80) return 'Perfil muito completo! 🚀';
    if (score >= 60) return 'Bom progresso! Continue preenchendo 📈';
    if (score >= 40) return 'Vamos enriquecer mais dados? 💪';
    if (score >= 20) return 'Ótimo início! Adicione mais informações 🌱';
    return 'Vamos começar a preencher? ✨';
  };

  const handleArchiveClient = async () => {
    deleteClient(clientId, {
      onSuccess: () => {
        router.push('/clientes');
      },
      onError: (error) => {
        console.error('Erro ao arquivar cliente:', error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sgbus-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-periwinkle">Carregando perfil do cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientError || !localClientData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-seasalt mb-2">Cliente não encontrado</h2>
          <p className="text-periwinkle mb-6">O cliente solicitado não foi encontrado.</p>
          <Link 
            href="/clientes"
            className="inline-flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Link>
        </div>
      </div>
    );
  }

  const isLoadingAction = isUpdating || isDeleting;
  const error = updateError || null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sticky Progress Bar */}
      <AnimatePresence>
        {isSticky && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-40 bg-eerie-black/80 backdrop-blur-md border-b border-seasalt/10 motion-reduce:transition-none"
          >
            <div className="container mx-auto px-4 py-2 md:py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-sm md:text-base font-semibold text-seasalt truncate">
                    Informações do Cliente
                  </h2>
                  <p className="text-[10px] md:text-xs text-periwinkle truncate">
                    {localClientData?.name} • {getMotivationalMessage(localClientData?.richnessScore || 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="w-20 md:w-32">
                    <div className="w-full bg-night rounded-full h-1.5 md:h-2 overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getRichnessGradient(localClientData?.richnessScore || 0)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${localClientData?.richnessScore || 0}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className={`text-xs md:text-sm font-bold ${getRichnessColor(localClientData?.richnessScore || 0)}`}>
                    {localClientData?.richnessScore || 0}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/clientes"
            className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="h-4 w-4 text-seasalt" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-seasalt">
              {localClientData?.name}
            </h1>
            <p className="text-periwinkle">
              {localClientData?.industry || 'Setor não informado'} • Criado em {localClientData?.createdAt?.toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-seasalt" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-eerie-black border border-seasalt/10 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleArchiveClient}
                  disabled={isLoadingAction}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-seasalt/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  {isLoadingAction ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Archive className="h-3 w-3" />
                  )}
                  {isLoadingAction ? 'Arquivando...' : 'Arquivar Cliente'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-eerie-black rounded-lg p-4 border border-seasalt/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-seasalt mb-1">
                Informações do Cliente
              </h2>
              <p className="text-periwinkle text-sm">
                {getMotivationalMessage(localClientData?.richnessScore || 0)}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getRichnessColor(localClientData?.richnessScore || 0)}`}>
                {localClientData?.richnessScore || 0}%
              </div>
              <div className="flex items-center text-xs text-periwinkle mt-1">
                {isUpdating ? (
                  <>
                    <div className="w-2 h-2 bg-sgbus-green rounded-full mr-2 animate-pulse" />
                    Salvando...
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-sgbus-green mr-1" />
                    Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full bg-night rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getRichnessGradient(localClientData?.richnessScore || 0)} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${localClientData?.richnessScore || 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionFields = section.fields;
          const filledFields = sectionFields.filter(field => {
            const value = localClientData[field.key];
            return value && value.toString().trim().length > 0;
          });
          const completionPercentage = Math.round((filledFields.length / sectionFields.length) * 100);

          return (
            <motion.div
              key={section.id}
              className="bg-eerie-black rounded-lg border border-seasalt/10 overflow-hidden"
              layout
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-seasalt/5 transition-colors"
              >
                <div className="flex items-center">
                  <section.icon className="h-4 w-4 text-sgbus-green mr-3" />
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-seasalt">
                      {section.title}
                    </h3>
                    <p className="text-sm text-periwinkle">
                      {filledFields.length} de {sectionFields.length} campos preenchidos ({completionPercentage}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    completionPercentage === 100 ? 'bg-sgbus-green/20' : 'bg-seasalt/10'
                  }`}>
                    <span className={`text-xs font-medium ${
                      completionPercentage === 100 ? 'text-sgbus-green' : 'text-seasalt'
                    }`}>
                      {completionPercentage}%
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-seasalt" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-seasalt" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pt-6 pb-6 space-y-5 border-t border-seasalt/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        {sectionFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-seasalt mb-3">
                              {field.label}
                            </label>
                            {field.type === 'textarea' ? (
                              <textarea
                                value={localClientData[field.key] as string || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                onBlur={handleSave}
                                placeholder={field.placeholder}
                                rows={4}
                                className="w-full px-4 py-2.5 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                              />
                            ) : field.type === 'sector-select' ? (
                              <SectorSelect
                                value={localClientData[field.key] as string || ''}
                                onValueChange={(value) => handleFieldChange(field.key, value)}
                                onBlur={handleSave}
                                placeholder={field.placeholder}
                              />
                            ) : (
                              <input
                                type={field.type}
                                value={localClientData[field.key] as string || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                onBlur={handleSave}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2.5 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8">
        <DisabledSection>
          <NotesAndAttachments clientId={clientId} />
        </DisabledSection>
      </div>
    </div>
  );
} 