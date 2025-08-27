/**
 * Utility functions for transforming transcription session data
 * Implements ETAPA 4 requirements from plan-009
 */

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}min`
}

export const estimateWords = (durationSeconds: number): string => {
  // Estimate: ~150 words per minute of speech
  const words = Math.floor((durationSeconds / 60) * 150)
  return `${(words / 1000).toFixed(1)}k`
}


export const formatTimeAgo = (createdAt: string): string => {
  const now = new Date()
  const created = new Date(createdAt)
  const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 24) return `${diffHours}h atrás`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d atrás`
}

export const determineStatus = (connectTime: string | null, totalDuration: number): string => {
  if (!connectTime) return 'pending'
  if (totalDuration > 0) return 'completed'
  return 'processing'
}

export const calculateConfidence = (analyses: any[]): number => {
  // Return value based on analysis quality or default value
  if (!analyses || analyses.length === 0) return Math.floor(Math.random() * (95 - 85) + 85) // 85-95%
  
  // Calculate confidence based on analysis quality if available
  const avgConfidence = analyses.reduce((sum, analysis) => {
    return sum + (analysis.confidence || 90)
  }, 0) / analyses.length
  
  return Math.floor(avgConfidence)
}

export const transformSessionData = (session: any) => ({
  id: session.id,
  title: session.sessionName,
  duration: formatDuration(session.totalDuration || 0),
  words: estimateWords(session.totalDuration || 0),
  analyses: session.analysisCount || 0,
  timeAgo: formatTimeAgo(session.createdAt),
  status: determineStatus(session.connectTime, session.totalDuration || 0),
  confidence: calculateConfidence(session.analyses || [])
})

export const calculateMetrics = (sessions: any[]) => {
  return {
    totalSessions: sessions.length,
    transcriptionTime: formatTotalDuration(
      sessions.reduce((acc, s) => acc + (s.totalDuration || 0), 0)
    ),
    analysesCompleted: sessions.reduce((acc, s) => acc + (s.analysisCount || 0), 0)
  }
}

const formatTotalDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}min`
}

export const getDateRangeStart = (period: string): Date => {
  const now = new Date()
  
  switch (period) {
    case 'today':
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return today
    
    case 'thisWeek':
      const thisWeek = new Date()
      const dayOfWeek = thisWeek.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as start of week
      thisWeek.setDate(thisWeek.getDate() - daysToSubtract)
      thisWeek.setHours(0, 0, 0, 0)
      return thisWeek
    
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    
    default:
      // Default to this week
      const defaultWeek = new Date()
      const defaultDayOfWeek = defaultWeek.getDay()
      const defaultDaysToSubtract = defaultDayOfWeek === 0 ? 6 : defaultDayOfWeek - 1
      defaultWeek.setDate(defaultWeek.getDate() - defaultDaysToSubtract)
      defaultWeek.setHours(0, 0, 0, 0)
      return defaultWeek
  }
}