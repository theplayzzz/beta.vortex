'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CircularProgress, LinearProgress } from '@/components/ui/circular-progress'
import { getUsageColor, getUsageStatus, formatTranscriptionTime } from '@/hooks/use-usage-stats'
import { LucideIcon } from 'lucide-react'

interface UsageWidgetProps {
  title: string
  icon: LucideIcon
  used: number
  limit: number
  href?: string
  linkText?: string
  isTranscription?: boolean
  iconColor: 'sgbus-green' | 'periwinkle' | 'red'
  delay?: number
}

interface SimpleWidgetProps {
  title: string
  icon: LucideIcon
  value: number | string
  subtitle: string
  href?: string
  linkText?: string
  iconColor: 'sgbus-green' | 'periwinkle' | 'red'
  delay?: number
}

export function UsageWidget({
  title,
  icon: Icon,
  used,
  limit,
  href,
  linkText = "Ver todos →",
  isTranscription = false,
  iconColor,
  delay = 0
}: UsageWidgetProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const available = Math.max(0, limit - used)
  const status = getUsageStatus(percentage)
  
  // Determine progress color based on usage
  const progressColor = percentage < 50 ? 'sgbus-green' : 
                       percentage < 80 ? 'warning' : 'red'
  
  const formatValue = (value: number) => {
    return isTranscription ? formatTranscriptionTime(value) : value.toString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-eerie-black rounded-lg p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-seasalt">{title}</h3>
        <div className={`w-8 h-8 bg-${iconColor}/20 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${iconColor}`} />
        </div>
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center mb-6">
        <CircularProgress
          value={used}
          max={limit}
          size={100}
          color={progressColor}
        >
          <div className="text-center">
            <motion.div 
              className="text-2xl font-bold text-seasalt"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.5 }}
            >
              {Math.round(percentage)}%
            </motion.div>
          </div>
        </CircularProgress>
      </div>

      {/* Usage Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-seasalt/70">Usado</span>
          <span className="text-base font-medium text-seasalt">
            {formatValue(used)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-seasalt/70">Limite</span>
          <span className="text-base font-medium text-seasalt">
            {formatValue(limit)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-seasalt/70">Disponível</span>
          <span className={`text-base font-medium ${status === 'high' ? 'text-red-400' : 'text-sgbus-green'}`}>
            {formatValue(available)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <LinearProgress
          value={used}
          max={limit}
          height={6}
          color={progressColor}
        />
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'low' ? 'bg-sgbus-green/20 text-sgbus-green' :
          status === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {status === 'low' ? 'Baixo uso' : 
           status === 'medium' ? 'Uso moderado' : 
           'Uso alto'}
        </div>
      </div>

      {/* Link */}
      {href && (
        <div className="pt-4 border-t border-accent/20">
          <Link 
            href={href} 
            className={`text-${iconColor} text-sm hover:underline transition-colors`}
          >
            {linkText}
          </Link>
        </div>
      )}
    </motion.div>
  )
}

export function SimpleWidget({
  title,
  icon: Icon,
  value,
  subtitle,
  href,
  linkText = "Ver todos →",
  iconColor,
  delay = 0
}: SimpleWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-eerie-black rounded-lg p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-seasalt">{title}</h3>
        <div className={`w-8 h-8 bg-${iconColor}/20 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${iconColor}`} />
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <motion.div 
          className="text-3xl font-bold text-seasalt"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-seasalt/70">{subtitle}</div>
      </div>

      {/* Link */}
      {href && (
        <div className="mt-4 pt-4 border-t border-accent/20">
          <Link 
            href={href} 
            className={`text-${iconColor} text-sm hover:underline transition-colors`}
          >
            {linkText}
          </Link>
        </div>
      )}
    </motion.div>
  )
}

// Loading skeleton component
export function WidgetSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-eerie-black rounded-lg p-6 border border-accent/20"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-accent/20 rounded w-24 animate-pulse"></div>
        <div className="w-8 h-8 bg-accent/20 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="w-[100px] h-[100px] bg-accent/20 rounded-full animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        <div className="h-4 bg-accent/20 rounded animate-pulse"></div>
        <div className="h-4 bg-accent/20 rounded animate-pulse"></div>
        <div className="h-4 bg-accent/20 rounded animate-pulse"></div>
      </div>
    </motion.div>
  )
}