'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlanningFormData, calculateProgress } from '@/lib/planning/formSchema';

interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
  createdAt?: Date;
}

export function usePlanningForm(client: Client) {
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState<Partial<PlanningFormData>>({});

  // Função para carregar dados do localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const draftKey = `planning-form-draft-${client.id}`;
      const saved = localStorage.getItem(draftKey);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📁 Dados carregados do localStorage:', parsed);
        
        // Verificar se tem estrutura aninhada de dados
        let loadedFormData = parsed.formData || parsed;
        
        setFormData(loadedFormData);
        return loadedFormData;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
    }
    return null;
  }, [client.id]);

  // Carregar dados salvos na inicialização
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Função para salvar no localStorage
  const saveToLocalStorage = useCallback((data: Partial<PlanningFormData>) => {
    try {
      const draftKey = `planning-form-draft-${client.id}`;
      
      const draftData = {
        client,
        formData: data,
        savedAt: new Date().toISOString(),
        sessionId: `session_${Date.now()}`
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      console.log('💾 Draft salvo no localStorage:', draftKey);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  }, [client]);

  // Função para atualizar progresso
  const updateProgress = useCallback((data: Partial<PlanningFormData>) => {
    const newProgress = calculateProgress(data);
    setProgress(newProgress);
    console.log('📊 Progresso atualizado:', newProgress + '%');
    return newProgress;
  }, []);

  // Função para atualizar dados do formulário
  const updateFormData = useCallback((data: Partial<PlanningFormData>) => {
    setFormData(data);
    saveToLocalStorage(data);
    updateProgress(data);
  }, [saveToLocalStorage, updateProgress]);

  // Função para preparar payload final
  const prepareFinalPayload = useCallback((data: PlanningFormData) => {
    const payload = {
      // Dados para StrategicPlanning.formDataJSON
      formDataJSON: {
        client_context: {
          client_id: client.id,
          client_name: client.name,
          industry: client.industry,
          richness_score: client.richnessScore,
          business_details: client.businessDetails || null
        },
        form_data: {
          ...data
        },
        submission_metadata: {
          submitted_at: new Date().toISOString(),
          progress_at_submission: calculateProgress(data),
          version: "1.0"
        }
      },
      // Dados para StrategicPlanning.clientSnapshot
      clientSnapshot: {
        id: client.id,
        name: client.name,
        industry: client.industry,
        richnessScore: client.richnessScore,
        businessDetails: client.businessDetails || null,
        createdAt: client.createdAt?.toISOString() || new Date().toISOString(),
        snapshot_timestamp: new Date().toISOString()
      }
    };

    console.log('📋 Payload final preparado:', payload);
    return payload;
  }, [client]);

  // Função para limpar dados do localStorage
  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem(`planning-form-draft-${client.id}`);
    console.log('🗑️ LocalStorage limpo');
  }, [client.id]);

  // Função para verificar se há dados salvos
  const hasSavedData = useCallback(() => {
    const savedData = localStorage.getItem(`planning-form-draft-${client.id}`);
    return !!savedData;
  }, [client.id]);

  return {
    progress,
    formData,
    updateFormData,
    updateProgress,
    prepareFinalPayload,
    clearLocalStorage,
    hasSavedData,
    saveToLocalStorage
  };
} 