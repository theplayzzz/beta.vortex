"use client";

import { useState, useCallback } from 'react';

export interface BonusClaimResponse {
  success: boolean;
  message: string;
  bonus?: {
    type: string;
    amount: number;
    claimedAt: string;
  };
  error?: string;
}

export interface BonusClaimState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: BonusClaimResponse | null;
}

export function useBonusClaim() {
  const [state, setState] = useState<BonusClaimState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  });

  const claimBonus = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: null,
    }));

    try {
      const response = await fetch('/api/bonus/claim-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: BonusClaimResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resgatar bônus');
      }

      setState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data,
      });

      console.log('BONUS_CLAIM_SUCCESS_FRONTEND:', {
        success: data.success,
        amount: data.bonus?.amount,
        timestamp: new Date().toISOString()
      });

      // Atualizar a página após sucesso para carregar novos valores
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        data: null,
      });

      console.error('BONUS_CLAIM_ERROR_FRONTEND:', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    claimBonus,
    resetState,
  };
}