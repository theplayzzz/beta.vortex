import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AIGeneratedContent, AIMetadata } from '@/lib/proposals/types';

// Tipos baseados no modelo Prisma
export interface Proposal {
  id: string;
  title: string;
  generatedContent: string | null;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION' | 'ARCHIVED';
  version: number;
  clientId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // 🆕 Novos campos da IA
  aiGeneratedContent: AIGeneratedContent | null;
  proposalHtml: string | null;
  proposalMarkdown: string | null;
  aiMetadata: AIMetadata | null;
  
  // 🆕 Dados do formulário e snapshot do cliente
  formDataJSON: any | null;
  clientSnapshot: any | null;
  
  Client?: {
    id: string;
    name: string;
    industry: string | null;
    richnessScore: number;
    businessDetails?: string | null;
    contactEmail?: string | null;
    website?: string | null;
  };
  parsedContent?: any;
}

export interface ProposalFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProposalListResponse {
  proposals: Proposal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProposalData {
  titulo_da_proposta: string;
  tipo_de_proposta: string;
  clientId: string;
  nome_da_contratada: string;
  membros_da_equipe?: string;
  modalidade_entrega: string;
  servicos_incluidos: string[];
  requisitos_especiais?: string;
  orcamento_estimado: string;
  forma_prazo_pagamento: string;
  urgencia_do_projeto: string;
  tomador_de_decisao: string;
  resumo_dor_problema_cliente: string;
  contexto_adicional?: string;
}

export interface UpdateProposalData {
  title?: string;
  status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION' | 'ARCHIVED';
  generatedContent?: string;
}

// Hook para listar propostas
export function useProposals(filters: ProposalFilters = {}) {
  return useQuery<ProposalListResponse>({
    queryKey: ['proposals', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (filters.status) searchParams.append('status', filters.status);
      if (filters.clientId) searchParams.append('clientId', filters.clientId);
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.page) searchParams.append('page', filters.page.toString());
      if (filters.limit) searchParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/proposals?${searchParams.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar propostas');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para buscar proposta específica
export function useProposal(id: string | null, options?: { alwaysFresh?: boolean }) {
  return useQuery<Proposal>({
    queryKey: ['proposal', id],
    queryFn: async () => {
      if (!id) throw new Error('ID da proposta é obrigatório');
      
      // 🔥 SEMPRE BUSCAR DADOS FRESCOS: Adicionar timestamp para evitar cache do browser
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/proposals/${id}?_t=${timestamp}`, {
        // Forçar bypass do cache do browser
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar proposta');
      }
      
      return response.json();
    },
    enabled: !!id,
    // 🔥 CONFIGURAÇÃO PARA SEMPRE BUSCAR DADOS FRESCOS
    staleTime: options?.alwaysFresh ? 0 : 1000 * 60 * 5, // Se alwaysFresh=true, sempre considerar stale
    gcTime: options?.alwaysFresh ? 0 : 1000 * 60 * 10, // Se alwaysFresh=true, não manter em cache
    refetchOnMount: options?.alwaysFresh ? 'always' : true, // Sempre refetch ao montar se alwaysFresh=true
    refetchOnWindowFocus: options?.alwaysFresh ? true : false, // Refetch ao focar janela se alwaysFresh=true
    refetchOnReconnect: true, // Sempre refetch ao reconectar
  });
}

// Hook para criar proposta simples (rascunho)
export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation<Proposal, Error, CreateProposalData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar proposta');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache das propostas
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

// Hook para gerar proposta via IA (webhook)
export function useGenerateProposal() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateProposalData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar proposta');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // 🔥 LIMPEZA AGRESSIVA DE CACHE PARA GARANTIR DADOS FRESCOS
      console.log(`🧹 [CACHE] Limpando cache para nova proposta ${data.proposal?.id}...`);
      
      // 1. Invalidar TODAS as queries de propostas
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-stats'] });
      
      // 2. Remover qualquer cache existente da proposta específica
      if (data.proposal?.id) {
        queryClient.removeQueries({ queryKey: ['proposal', data.proposal.id] });
        
        // 3. Forçar refetch imediato da proposta específica
        queryClient.prefetchQuery({
          queryKey: ['proposal', data.proposal.id],
          queryFn: async () => {
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/proposals/${data.proposal.id}?_t=${timestamp}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (!response.ok) {
              throw new Error('Erro ao buscar proposta');
            }
            
            return response.json();
          },
          staleTime: 0, // Sempre considerar stale
          gcTime: 0, // Não manter em cache
        });
        
        console.log(`✅ [CACHE] Cache limpo e dados frescos carregados para proposta ${data.proposal.id}`);
      }
    },
    onError: (error) => {
      console.error('❌ [GENERATE] Erro ao gerar proposta:', error);
      
      // Limpar cache em caso de erro também
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
  });
}

// Hook para atualizar proposta
export function useUpdateProposal(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Proposal, Error, UpdateProposalData>({
    mutationFn: async (data) => {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar proposta');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Atualizar cache da proposta específica
      queryClient.setQueryData(['proposal', id], data);
      
      // Invalidar cache das propostas
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

// Hook para deletar proposta
export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { id: string; hardDelete?: boolean }>({
    mutationFn: async ({ id, hardDelete = false }) => {
      const url = hardDelete 
        ? `/api/proposals/${id}?hard=true`
        : `/api/proposals/${id}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar proposta');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Remover do cache da proposta específica
      queryClient.removeQueries({ queryKey: ['proposal', variables.id] });
      
      // Invalidar cache das propostas
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

// Hook para estatísticas (derivado dos dados das propostas)
export function useProposalStats() {
  return useQuery({
    queryKey: ['proposal-stats'],
    queryFn: async () => {
      // Buscar todas as propostas para calcular stats (máximo 100 por limitação da API)
      const response = await fetch('/api/proposals?limit=100');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }
      
      const data: ProposalListResponse = await response.json();
      const proposals = data.proposals;
      
      return {
        total: proposals.length,
        draft: proposals.filter(p => p.status === 'DRAFT').length,
        sent: proposals.filter(p => p.status === 'SENT').length,
        accepted: proposals.filter(p => p.status === 'ACCEPTED').length,
        inNegotiation: proposals.filter(p => p.status === 'NEGOTIATION').length,
        rejected: proposals.filter(p => p.status === 'REJECTED').length,
        archived: proposals.filter(p => p.status === 'ARCHIVED').length,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
} 