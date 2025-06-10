'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { Pause, Mail, Phone, MessageCircle, AlertCircle } from 'lucide-react'

export default function AccountSuspendedPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
      <div className="max-w-md w-full rounded-xl shadow-2xl p-8 text-center border border-opacity-10 transition-all duration-300 hover:shadow-3xl hover:transform hover:-translate-y-1" 
           style={{ 
             backgroundColor: 'var(--eerie-black, #171818)',
             borderColor: 'var(--seasalt, #f9fbfc)'
           }}>
        
        {/* Ícone de pausa */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300" 
               style={{ 
                 backgroundColor: 'rgba(255, 165, 0, 0.1)',
                 borderColor: '#ffa500'
               }}>
            <Pause className="w-8 h-8" style={{ color: '#ffa500' }} />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold mb-4" 
            style={{ color: 'var(--seasalt, #f9fbfc)' }}>
          Conta Temporariamente Suspensa
        </h1>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="mb-4" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Sua conta foi temporariamente suspensa devido a questões que precisam ser resolvidas.
          </p>
          <div className="rounded-lg p-4 border transition-all duration-200" 
               style={{ 
                 backgroundColor: 'rgba(255, 165, 0, 0.05)',
                 borderColor: '#ffa500'
               }}>
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#ffa500' }} />
              <div className="text-sm text-left">
                <p className="font-medium mb-1" style={{ color: '#ffa500' }}>Motivos possíveis para suspensão:</p>
                <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                  <li>Atividade suspeita na conta</li>
                  <li>Violação dos termos de uso</li>
                  <li>Problemas de segurança</li>
                  <li>Verificação adicional necessária</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(255, 165, 0, 0.05)',
               borderColor: '#ffa500'
             }}>
          <div className="flex items-center justify-center">
            <Pause className="w-5 h-5 mr-2" style={{ color: '#ffa500' }} />
            <span className="font-medium" style={{ color: '#ffa500' }}>
              Status: Conta Suspensa
            </span>
          </div>
        </div>

        {/* Informações importantes */}
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(207, 198, 254, 0.05)',
               borderColor: 'var(--periwinkle, #cfc6fe)'
             }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Como resolver?
          </h3>
          <div className="text-sm text-left space-y-2" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            <p>• Entre em contato conosco imediatamente</p>
            <p>• Forneça informações para verificação</p>
            <p>• Aguarde análise da nossa equipe</p>
            <p>• A suspensão pode ser revertida após esclarecimentos</p>
          </div>
        </div>

        {/* Aviso importante */}
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(107, 233, 76, 0.05)',
               borderColor: 'var(--sgbus-green, #6be94c)'
             }}>
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
            <div className="text-xs text-left">
              <p className="font-medium mb-1" style={{ color: 'var(--sgbus-green, #6be94c)' }}>Importante:</p>
              <p style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                Durante a suspensão, o acesso aos recursos da plataforma está bloqueado. Entre em contato o mais rápido possível para resolver a situação.
              </p>
            </div>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            Contato urgente
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com?subject=Conta Suspensa - Solicitar Revisão Urgente" 
              className="flex items-center justify-center text-sm transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--periwinkle, #cfc6fe)' }}
            >
              <Mail className="w-4 h-4 mr-2" />
              suporte@empresa.com
            </a>
            <a 
              href="tel:+5511999999999" 
              className="flex items-center justify-center text-sm transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--periwinkle, #cfc6fe)' }}
            >
              <Phone className="w-4 h-4 mr-2" />
              (11) 99999-9999
            </a>
            <a 
              href="https://wa.me/5511999999999?text=Urgente: Minha conta foi suspensa e preciso resolver" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--sgbus-green, #6be94c)' }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp (Urgente)
            </a>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="mailto:suporte@empresa.com?subject=Conta Suspensa - Solicitar Revisão Urgente"
            className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--sgbus-green, #6be94c)',
              color: 'var(--night, #0e0f0f)',
              boxShadow: 'inset 0 0 0 2px var(--sgbus-green, #6be94c)'
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            Entrar em Contato Agora
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ 
              border: '1px solid #ffa500',
              color: '#ffa500',
              backgroundColor: 'transparent'
            }}
          >
            Verificar Status
          </button>
          <SignOutButton redirectUrl="/sign-in">
            <button className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                border: '1px solid var(--periwinkle, #cfc6fe)',
                color: 'var(--periwinkle, #cfc6fe)',
                backgroundColor: 'transparent'
              }}
            >
              Sair da Conta
            </button>
          </SignOutButton>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-xs" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
          <p>Suspensões são geralmente temporárias e podem ser resolvidas rapidamente.</p>
        </div>
      </div>

      {/* CSS Variables inline para garantir compatibilidade */}
      <style jsx>{`
        :root {
          --night: #0e0f0f;
          --eerie-black: #171818;
          --sgbus-green: #6be94c;
          --seasalt: #f9fbfc;
          --periwinkle: #cfc6fe;
        }
      `}</style>
    </div>
  )
} 