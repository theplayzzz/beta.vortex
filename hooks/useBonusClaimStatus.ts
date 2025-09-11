"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface BonusClaimStatus {
  hasClaimedBonus: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBonusClaimStatus() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<BonusClaimStatus>({
    hasClaimedBonus: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const checkBonusStatus = async () => {
      try {
        // For now, we'll use localStorage to check if user has claimed the bonus
        // This is a simple implementation that persists across sessions
        const claimedKey = `bonus_claimed_${user.id}`;
        const hasClaimed = localStorage.getItem(claimedKey) === 'true';
        
        setStatus({
          hasClaimedBonus: hasClaimed,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error checking bonus status:', error);
        setStatus({
          hasClaimedBonus: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    };

    checkBonusStatus();
  }, [user, isLoaded]);

  const markBonusAsClaimed = () => {
    if (user) {
      const claimedKey = `bonus_claimed_${user.id}`;
      localStorage.setItem(claimedKey, 'true');
      setStatus(prev => ({ ...prev, hasClaimedBonus: true }));
    }
  };

  return {
    ...status,
    markBonusAsClaimed,
  };
}