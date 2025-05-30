'use client';

import { useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ProposalsList } from '@/components/proposals';

export default function PropostasPage() {
  const [filter, setFilter] = useState<string>('all');

  // Dados mockados para desenvolvimento - serão substituídos pela API
  const mockStats = {
    total: 12,
    draft: 3,
    sent: 4,
    accepted: 3,
    rejected: 2
  };

  // Propostas mockadas para testar os componentes
  const mockProposals = [
    {
      id: '1',
      title: 'Consultoria em Marketing Digital',
      status: 'DRAFT' as const,
      version: 1,
      createdAt: '2025-01-25T10:00:00Z',
      updatedAt: '2025-01-25T10:00:00Z',
      Client: {
        id: 'client1',
        name: 'Tech Solutions LTDA',
        industry: 'Tecnologia',
        richnessScore: 85
      }
    },
    {
      id: '2',
      title: 'Implementação de Sistema CRM',
      status: 'SENT' as const,
      version: 2,
      createdAt: '2025-01-20T14:30:00Z',
      updatedAt: '2025-01-22T16:00:00Z',
      Client: {
        id: 'client2',
        name: 'Varejo Express',
        industry: 'Varejo',
        richnessScore: 62
      }
    },
    {
      id: '3',
      title: 'Auditoria de Performance Web',
      status: 'ACCEPTED' as const,
      version: 1,
      createdAt: '2025-01-18T09:15:00Z',
      updatedAt: '2025-01-19T11:30:00Z',
      Client: {
        id: 'client3',
        name: 'StartupTech Inc',
        industry: 'Startups',
        richnessScore: 94
      }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Propostas Comerciais</h1>
          <p className="text-seasalt/70">
            Gerencie suas propostas comerciais e acompanhe o status
          </p>
        </div>
        
        <Link
          href="/propostas/nova"
          className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Proposta
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-seasalt">{mockStats.total}</p>
              <p className="text-seasalt/70 text-sm">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-seasalt">{mockStats.draft}</p>
              <p className="text-seasalt/70 text-sm">Rascunhos</p>
            </div>
          </div>
        </div>

        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-sgbus-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-seasalt">{mockStats.sent}</p>
              <p className="text-seasalt/70 text-sm">Enviadas</p>
            </div>
          </div>
        </div>

        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-seasalt">{mockStats.accepted}</p>
              <p className="text-seasalt/70 text-sm">Aprovadas</p>
            </div>
          </div>
        </div>

        <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-seasalt">{mockStats.rejected}</p>
              <p className="text-seasalt/70 text-sm">Rejeitadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-seasalt mb-4">Suas Propostas</h2>
          
          <ProposalsList 
            proposals={mockProposals}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
} 