import { useQuery } from '@tanstack/react-query';

interface SessionStats {
  totalSessions: number;
  transcriptionTime: string;
  analysesCompleted: number;
}

interface SessionStatsResponse {
  sessions: any[];
  metrics: SessionStats;
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: async (): Promise<SessionStats> => {
      const response = await fetch('/api/transcription-sessions');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas de sessões');
      }
      
      const data: SessionStatsResponse = await response.json();
      return data.metrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
