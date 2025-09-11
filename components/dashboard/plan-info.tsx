'use client'

import { motion } from 'framer-motion'
import { Shield, Star, AlertCircle } from 'lucide-react'
import type { UsageStats } from '@/app/api/usage/stats/route'

interface PlanInfoProps {
  usageStats: UsageStats
  delay?: number
}

export function PlanInfo({ usageStats, delay = 0 }: PlanInfoProps) {
  const { planInfo } = usageStats
  
  const getPlanIcon = () => {
    if (planInfo.isNoUserPlan) return AlertCircle
    if (!planInfo.hasActivePlan) return AlertCircle
    return planInfo.name.includes('Admin') ? Star : Shield
  }
  
  const getPlanColor = () => {
    if (planInfo.isNoUserPlan) return 'text-red-400'
    if (!planInfo.hasActivePlan) return 'text-red-400'
    return planInfo.name.includes('Admin') ? 'text-yellow-400' : 'text-sgbus-green'
  }
  
  const getPlanStatus = () => {
    if (planInfo.isNoUserPlan) return 'Sem Acesso'
    if (!planInfo.hasActivePlan) return 'Nenhum Plano'
    return 'Ativo'
  }

  const Icon = getPlanIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-eerie-black rounded-lg p-4 border border-accent/20"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${planInfo.isNoUserPlan ? 'bg-red-500/20' : 'bg-sgbus-green/20'}`}>
          <Icon className={`w-5 h-5 ${getPlanColor()}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-seasalt truncate">
              {planInfo.name}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              planInfo.isNoUserPlan ? 'bg-red-500/20 text-red-400' :
              planInfo.hasActivePlan ? 'bg-sgbus-green/20 text-sgbus-green' :
              'bg-red-500/20 text-red-400'
            }`}>
              {getPlanStatus()}
            </span>
          </div>
          
          <p className="text-xs text-seasalt/70 mt-1">
            Período: {usageStats.currentPeriod}
          </p>
        </div>
      </div>
      
      {planInfo.isNoUserPlan && (
        <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-red-400">
            Acesso limitado. Entre em contato para ativar seu plano.
          </p>
        </div>
      )}
    </motion.div>
  )
}