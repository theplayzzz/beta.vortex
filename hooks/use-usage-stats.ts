import { useQuery } from '@tanstack/react-query'
import type { UsageStats } from '@/app/api/usage/stats/route'

async function fetchUsageStats(): Promise<UsageStats> {
  const response = await fetch('/api/usage/stats', {
    method: 'GET',
    cache: 'no-store'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch usage stats')
  }
  
  return response.json()
}

export function useUsageStats() {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: fetchUsageStats,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Helper functions for UI
export function getUsageColor(percentage: number): string {
  if (percentage < 50) return 'sgbus-green'
  if (percentage < 80) return 'periwinkle' 
  return 'red-500' // danger color
}

export function getUsageStatus(percentage: number): 'low' | 'medium' | 'high' {
  if (percentage < 50) return 'low'
  if (percentage < 80) return 'medium'
  return 'high'
}

export function formatTranscriptionTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}