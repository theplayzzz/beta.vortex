"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import NotesAndAttachments from "@/components/client/notes-and-attachments";

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
    type: 'text' | 'textarea' | 'email' | 'tel' | 'url';
    placeholder: string;
  }[];
}

const sections: Section[] = [
  {
    id: 'basic',
    title: 'Informações Básicas',
    icon: User,
    fields: [
      { key: 'name', label: 'Nome do Cliente', type: 'text', placeholder: 'Nome da empresa ou pessoa' },
      { key: 'industry', label: 'Setor de Atuação', type: 'text', placeholder: 'Ex: Tecnologia, Consultoria, E-commerce' },
      { key: 'serviceOrProduct', label: 'Serviço/Produto', type: 'text', placeholder: 'Breve descrição do que oferece' },
      { key: 'initialObjective', label: 'Objetivo Inicial', type: 'textarea', placeholder: 'Objetivo principal do cliente' }
    ]
  },
  {
    id: 'contact',
    title: 'Informações de Contato',
    icon: Mail,
    fields: [
      { key: 'contactEmail', label: 'E-mail', type: 'email', placeholder: 'contato@empresa.com' },
      { key: 'contactPhone', label: 'Telefone', type: 'tel', placeholder: '(11) 99999-9999' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://www.empresa.com' },
      { key: 'address', label: 'Endereço', type: 'textarea', placeholder: 'Endereço completo da empresa' }
    ]
  },
  {
    id: 'business',
    title: 'Detalhes do Negócio',
    icon: Building,
    fields: [
      { key: 'businessDetails', label: 'Detalhes do Negócio', type: 'textarea', placeholder: 'Descrição detalhada do negócio, modelo de atuação, etc.' },
      { key: 'targetAudience', label: 'Público-Alvo', type: 'textarea', placeholder: 'Descrição do público-alvo, personas, segmentação' }
    ]
  },
  {
    id: 'marketing',
    title: 'Objetivos de Marketing',
    icon: Target,
    fields: [
      { key: 'marketingObjectives', label: 'Objetivos de Marketing', type: 'textarea', placeholder: 'Metas e objetivos de marketing específicos' },
      { key: 'historyAndStrategies', label: 'Histórico e Estratégias', type: 'textarea', placeholder: 'Histórico de campanhas e estratégias anteriores' }
    ]
  },
  {
    id: 'analysis',
    title: 'Análise de Mercado',
    icon: AlertCircle,
    fields: [
      { key: 'challengesOpportunities', label: 'Desafios e Oportunidades', type: 'textarea', placeholder: 'Principais desafios e oportunidades identificadas' },
      { key: 'competitors', label: 'Concorrentes', type: 'textarea', placeholder: 'Análise da concorrência e posicionamento' }
    ]
  },
  {
    id: 'resources',
    title: 'Recursos e Preferências',
    icon: Globe,
    fields: [
      { key: 'resourcesBudget', label: 'Recursos e Orçamento', type: 'textarea', placeholder: 'Recursos disponíveis, orçamento, limitações' },
      { key: 'toneOfVoice', label: 'Tom de Voz', type: 'textarea', placeholder: 'Tom de voz desejado para comunicação' },
      { key: 'preferencesRestrictions', label: 'Preferências e Restrições', type: 'textarea', placeholder: 'Preferências específicas e restrições importantes' }
    ]
  }
];

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Simular carregamento de dados do cliente
  useEffect(() => {
    const loadClientData = async () => {
      setIsLoading(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data baseado no ID
      const mockClient: ClientData = {
        id: clientId,
        name: `Cliente ${clientId}`,
        industry: 'Tecnologia',
        serviceOrProduct: 'Desenvolvimento de software',
        initialObjective: 'Aumentar presença digital e gerar mais leads',
        contactEmail: 'contato@cliente.com',
        contactPhone: '(11) 99999-9999',
        website: 'https://www.cliente.com',
        address: '',
        businessDetails: '',
        targetAudience: '',
        marketingObjectives: '',
        historyAndStrategies: '',
        challengesOpportunities: '',
        competitors: '',
        resourcesBudget: '',
        toneOfVoice: '',
        preferencesRestrictions: '',
        richnessScore: 0,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      };

      setClientData(mockClient);
      setIsLoading(false);
    };

    loadClientData();
  }, [clientId]);

  // Calcular RichnessScore em tempo real
  const calculateRichnessScore = (data: ClientData): number => {
    const fields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ];
    
    const filledFields = fields.filter(field => {
      const value = data[field as keyof ClientData];
      return value && value.toString().trim().length > 0;
    });

    return Math.round((filledFields.length / fields.length) * 100);
  };

  // Atualizar RichnessScore quando dados mudarem
  useEffect(() => {
    if (clientData) {
      const newScore = calculateRichnessScore(clientData);
      if (newScore !== clientData.richnessScore) {
        setClientData(prev => prev ? { ...prev, richnessScore: newScore } : null);
      }
    }
  }, [clientData]);

  // Auto-save com debounce
  useEffect(() => {
    if (!clientData || isLoading) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [clientData, isLoading]);

  const handleFieldChange = (field: keyof ClientData, value: string) => {
    setClientData(prev => prev ? { ...prev, [field]: value } : null);
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

  // Arquivar cliente
  const handleArchiveClient = async () => {
    if (!confirm('Tem certeza que deseja arquivar este cliente? Ele poderá ser restaurado posteriormente.')) return;

    try {
      setArchiving(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirecionar para lista de clientes
        window.location.href = '/clientes';
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao arquivar cliente');
      }
    } catch (error) {
      console.error('Erro ao arquivar cliente:', error);
      alert('Erro ao arquivar cliente');
    } finally {
      setArchiving(false);
    }
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

  if (!clientData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/clientes"
            className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-seasalt" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-seasalt">
              {clientData.name}
            </h1>
            <p className="text-periwinkle">
              {clientData.industry || 'Setor não informado'} • Criado em {clientData.createdAt.toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          {/* Menu de ações */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-seasalt" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-eerie-black border border-seasalt/10 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleArchiveClient}
                  disabled={archiving}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-seasalt/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  {archiving ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {archiving ? 'Arquivando...' : 'Arquivar Cliente'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RichnessScore Header */}
        <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-seasalt mb-1">
                Completude do Perfil
              </h2>
              <p className="text-periwinkle text-sm">
                {getMotivationalMessage(clientData.richnessScore)}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getRichnessColor(clientData.richnessScore)}`}>
                {clientData.richnessScore}%
              </div>
              <div className="flex items-center text-xs text-periwinkle mt-1">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 bg-sgbus-green rounded-full mr-2 animate-pulse" />
                    Salvando...
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="h-3 w-3 text-sgbus-green mr-1" />
                    Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-night rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getRichnessGradient(clientData.richnessScore)} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${clientData.richnessScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionFields = section.fields;
          const filledFields = sectionFields.filter(field => {
            const value = clientData[field.key];
            return value && value.toString().trim().length > 0;
          });
          const completionPercentage = Math.round((filledFields.length / sectionFields.length) * 100);

          return (
            <motion.div
              key={section.id}
              className="bg-eerie-black rounded-lg border border-seasalt/10 overflow-hidden"
              layout
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-seasalt/5 transition-colors"
              >
                <div className="flex items-center">
                  <section.icon className="h-5 w-5 text-sgbus-green mr-3" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-seasalt">
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
                    <ChevronDown className="h-5 w-5 text-seasalt" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-seasalt" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-seasalt/10">
                      {sectionFields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-seasalt mb-2">
                            {field.label}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={clientData[field.key] as string || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={4}
                              className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={clientData[field.key] as string || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Seção de Notas e Anexos */}
      <div className="mt-12">
        <NotesAndAttachments clientId={clientId} />
      </div>
    </div>
  );
} 