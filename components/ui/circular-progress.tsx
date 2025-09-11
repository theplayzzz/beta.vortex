'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  color?: 'sgbus-green' | 'periwinkle' | 'red' | 'warning'
  children?: React.ReactNode
}

const colorMap = {
  'sgbus-green': '#6be94c',
  'periwinkle': '#cfc6fe',
  'red': '#ef4444',
  'warning': '#f59e0b'
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className = '',
  showPercentage = false,
  color = 'sgbus-green',
  children
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(249, 251, 252, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ 
            duration: 1.5, 
            ease: "easeInOut",
            delay: 0.2 
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${colorMap[color]}40)`
          }}
        />
      </svg>
      
      {/* Content in the center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-seasalt">
              {Math.round(animatedValue)}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

interface LinearProgressProps {
  value: number
  max: number
  height?: number
  className?: string
  color?: 'sgbus-green' | 'periwinkle' | 'red' | 'warning'
  showLabel?: boolean
}

export function LinearProgress({
  value,
  max,
  height = 8,
  className = '',
  color = 'sgbus-green',
  showLabel = false
}: LinearProgressProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  const getColorClasses = () => {
    switch (color) {
      case 'sgbus-green':
        return 'from-sgbus-green to-sgbus-green/80'
      case 'periwinkle':
        return 'from-periwinkle to-periwinkle/80'
      case 'red':
        return 'from-red-500 to-red-400'
      case 'warning':
        return 'from-yellow-500 to-yellow-400'
      default:
        return 'from-sgbus-green to-sgbus-green/80'
    }
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-seasalt/70 mb-2">
          <span>{value} usado</span>
          <span>{max} limite</span>
        </div>
      )}
      
      <div 
        className="bg-night rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div 
          className={`h-full bg-gradient-to-r ${getColorClasses()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            delay: 0.3 
          }}
          style={{
            boxShadow: `0 0 10px ${colorMap[color]}60`
          }}
        />
      </div>
      
      {showLabel && (
        <div className="flex justify-between text-xs text-seasalt/50 mt-1">
          <span>{Math.round(percentage)}%</span>
          <span>{max - value} disponível</span>
        </div>
      )}
    </div>
  )
}