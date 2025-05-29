'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building, 
  Edit3, 
  MoreVertical,
  Clock,
  Target,
  Database,
  Star
} from 'lucide-react';
import { FormDataDisplay } from './FormDataDisplay';
import { RichnessScoreBadge } from './RichnessScoreBadge';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  businessDetails?: string;
  contactEmail?: string;
  website?: string;
}

interface Planning {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formDataJSON?: any;
  clientSnapshot?: any;
  Client: Client;
}

interface PlanningDetailsProps {
  planning: Planning;
  isLoading?: boolean;
}

const statusConfig = {
  DRAFT: {
    label: 'Rascunho',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '📝'
  },
  ACTIVE: {
    label: 'Ativo',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🚀'
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '✅'
  },
  ARCHIVED: {
    label: 'Arquivado',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: '📦'
  },
  PENDING_AI_BACKLOG_GENERATION: {
    label: 'Aguardando IA',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '🤖'
  },
  AI_BACKLOG_VISIBLE: {
    label: 'Backlog IA Gerado',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    icon: '🎯'
  }
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `${diffInDays} dias atrás`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
  return `${Math.floor(diffInDays / 30)} meses atrás`;
}

export function PlanningDetails({ planning, isLoading = false }: PlanningDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'form-data' | 'client-info'>('overview');

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-eerie-black rounded w-1/3"></div>
          <div className="h-4 bg-eerie-black rounded w-2/3"></div>
          <div className="h-32 bg-eerie-black rounded"></div>
        </div>
      </div>
    );
  }

  const status = statusConfig[planning.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/planejamentos"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">{planning.title}</h1>
            <p className="text-seasalt/70 mt-1">
              {planning.description || 'Sem descrição'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/planejamentos/${planning.id}/editar`}
            className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Link>
          <button className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status e Metadados */}
      <div className="bg-eerie-black rounded-lg border border-accent/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">{status.icon}</span>
            </div>
            <div>
              <p className="text-seasalt/70 text-sm">Status</p>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
                {status.label}
              </div>
            </div>
          </div>

          {/* Data de Criação */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-seasalt/70 text-sm">Criado</p>
              <p className="text-seasalt font-medium text-sm">{formatDate(planning.createdAt)}</p>
              <p className="text-seasalt/60 text-xs">{formatRelativeDate(planning.createdAt)}</p>
            </div>
          </div>

          {/* Última Atualização */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-seasalt/70 text-sm">Atualizado</p>
              <p className="text-seasalt font-medium text-sm">{formatDate(planning.updatedAt)}</p>
              <p className="text-seasalt/60 text-xs">{formatRelativeDate(planning.updatedAt)}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-seasalt/70 text-sm">Cliente</p>
              <p className="text-seasalt font-medium text-sm">{planning.Client.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <RichnessScoreBadge score={planning.Client.richnessScore} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        <div className="border-b border-accent/20 px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Target },
              { id: 'form-data', label: 'Dados do Formulário', icon: Database },
              { id: 'client-info', label: 'Informações do Cliente', icon: User },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-sgbus-green text-sgbus-green'
                    : 'border-transparent text-seasalt/70 hover:text-seasalt hover:border-seasalt/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Aba: Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-seasalt mb-4">Resumo do Planejamento</h3>
                <div className="bg-night rounded-lg p-4">
                  <p className="text-seasalt/90 leading-relaxed">
                    {planning.description || 'Este planejamento ainda não possui uma descrição detalhada.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-seasalt mb-3">Informações Técnicas</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-seasalt/70 text-sm">ID do Planejamento</dt>
                      <dd className="text-seasalt font-mono text-sm bg-night rounded px-2 py-1 mt-1">
                        {planning.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-seasalt/70 text-sm">Dados Estruturados</dt>
                      <dd className="text-seasalt text-sm mt-1">
                        {planning.formDataJSON ? '✅ Disponível' : '❌ Não disponível'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-seasalt/70 text-sm">Snapshot do Cliente</dt>
                      <dd className="text-seasalt text-sm mt-1">
                        {planning.clientSnapshot ? '✅ Preservado' : '❌ Não preservado'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-md font-medium text-seasalt mb-3">Status do Cliente</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-seasalt/70 text-sm">Nome</dt>
                      <dd className="text-seasalt text-sm mt-1">{planning.Client.name}</dd>
                    </div>
                    <div>
                      <dt className="text-seasalt/70 text-sm">Setor</dt>
                      <dd className="text-seasalt text-sm mt-1">
                        {planning.Client.industry || 'Não informado'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-seasalt/70 text-sm">Score de Dados</dt>
                      <dd className="text-seasalt text-sm mt-1 flex items-center gap-2">
                        <RichnessScoreBadge score={planning.Client.richnessScore} />
                        <span>{planning.Client.richnessScore}%</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Aba: Dados do Formulário */}
          {activeTab === 'form-data' && (
            <div>
              <h3 className="text-lg font-semibold text-seasalt mb-4">Dados do Formulário Multi-Etapas</h3>
              <FormDataDisplay formData={planning.formDataJSON} />
            </div>
          )}

          {/* Aba: Informações do Cliente */}
          {activeTab === 'client-info' && (
            <div>
              <h3 className="text-lg font-semibold text-seasalt mb-4">Snapshot do Cliente</h3>
              <div className="bg-night rounded-lg p-6">
                {planning.clientSnapshot ? (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(planning.clientSnapshot)
                      .filter(([key, value]) => 
                        value !== null && 
                        value !== undefined && 
                        value !== '' &&
                        key !== 'id' &&
                        key !== 'userId' &&
                        key !== 'createdAt' &&
                        key !== 'updatedAt' &&
                        key !== 'deletedAt'
                      )
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-seasalt/70 text-sm mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </dt>
                          <dd className="text-seasalt text-sm bg-eerie-black rounded p-2">
                            {String(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-seasalt/30 mx-auto mb-4" />
                    <p className="text-seasalt/70">
                      Snapshot do cliente não disponível para este planejamento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 