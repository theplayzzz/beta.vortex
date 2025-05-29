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
  const [formData, setFormData] = useState<Partial<PlanningFormData> | null>(null);

  // Recovery de dados do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`planning-form-draft-${client.id}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Verificar se é estrutura aninhada (modo de edição)
        if (parsedData.formData) {
          console.log('📂 Dados de edição recuperados do localStorage:', parsedData);
          setFormData(parsedData.formData);
        } 
        // Verificar se é estrutura direta (modo de criação)
        else if (parsedData.informacoes_basicas || parsedData.marketing || parsedData.comercial || parsedData.detalhes_do_setor) {
          console.log('📂 Dados diretos recuperados do localStorage:', parsedData);
          setFormData(parsedData);
        }
        // Estrutura desconhecida, tentar usar como está
        else {
          console.log('📂 Dados em estrutura desconhecida:', parsedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar dados do formulário:', error);
        localStorage.removeItem(`planning-form-draft-${client.id}`);
      }
    }
  }, [client.id]);

  // Função para salvar no localStorage
  const saveToLocalStorage = useCallback((data: Partial<PlanningFormData>) => {
    try {
      localStorage.setItem(`planning-form-draft-${client.id}`, JSON.stringify(data));
      console.log('💾 Dados salvos no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  }, [client.id]);

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