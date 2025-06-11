"use client"

import { useEffect, useState } from 'react'
import { SignInButton } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, RefreshCw, LogIn, ArrowLeft } from 'lucide-react'

export default function SessionExpiredPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/'
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Countdown automático para redirecionamento
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, redirectUrl])

  const handleManualRedirect = () => {
    router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`)
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-night">
      <div className="max-w-md w-full space-y-8">
        {/* Ícone e título */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-sgbus-green/10 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-sgbus-green" />
          </div>
          
          <h2 className="text-3xl font-bold text-seasalt mb-2">
            Sessão Expirada
          </h2>
          
          <p className="text-periwinkle text-lg">
            Sua sessão expirou por motivos de segurança
          </p>
        </div>

        {/* Informações */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sgbus-green rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-seasalt font-medium">Por que isso aconteceu?</p>
                <p className="text-periwinkle text-sm mt-1">
                  Tokens de autenticação expiram automaticamente após um período de inatividade para proteger sua conta.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sgbus-green rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-seasalt font-medium">O que fazer agora?</p>
                <p className="text-periwinkle text-sm mt-1">
                  Faça login novamente para continuar de onde parou. Seus dados estão seguros.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown e ações */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-periwinkle text-sm">
              Redirecionamento automático em{' '}
              <span className="text-sgbus-green font-bold text-lg">{countdown}</span>{' '}
              segundos
            </p>
            <div className="w-full bg-accent/20 rounded-full h-2 mt-2">
              <div 
                className="bg-sgbus-green h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <button 
              onClick={handleManualRedirect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <LogIn className="h-4 w-4" />
              Fazer Login Agora
            </button>

            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-eerie-black hover:bg-accent/10 text-seasalt border border-accent/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>

        {/* Dicas de segurança */}
        <div className="bg-night border border-accent/10 rounded-lg p-4">
          <h3 className="text-seasalt font-medium mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-sgbus-green" />
            Dicas de Segurança
          </h3>
          <ul className="text-periwinkle text-sm space-y-1">
            <li>• Mantenha-se ativo na plataforma para evitar expiração</li>
            <li>• Use senhas fortes e únicas</li>
            <li>• Faça logout ao usar computadores compartilhados</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 