import { useQuery } from '@tanstack/react-query';
import type { RawUsageData } from '@/app/api/usage/raw/route';

async function fetchRawUsageData(): Promise<RawUsageData> {
  const response = await fetch('/api/usage/raw', {
    method: 'GET',
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch raw usage data');
  }
  
  return response.json();
}

export function useRawUsage() {
  return useQuery({
    queryKey: ['raw-usage'],
    queryFn: fetchRawUsageData,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
