'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Clock, Mail, Phone, MessageCircle, RefreshCw } from 'lucide-react'

export default function PendingApprovalPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
      <div className="max-w-md w-full rounded-xl shadow-2xl p-8 text-center border border-opacity-10 transition-all duration-300 hover:shadow-3xl hover:transform hover:-translate-y-1" 
           style={{ 
             backgroundColor: 'var(--eerie-black, #171818)',
             borderColor: 'var(--seasalt, #f9fbfc)'
           }}>
        
        {/* Ícone de relógio */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300" 
               style={{ 
                 backgroundColor: 'rgba(107, 233, 76, 0.1)',
                 borderColor: 'var(--sgbus-green, #6be94c)'
               }}>
            <Clock className="w-8 h-8" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold mb-4" 
            style={{ color: 'var(--seasalt, #f9fbfc)' }}>
          Conta Aguardando Aprovação
        </h1>

        {/* Mensagem personalizada */}
        <div className="mb-6">
          <p className="mb-4" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Olá {user?.firstName || 'usuário'},
          </p>
          <p className="mb-4" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Sua conta foi criada com sucesso e está aguardando aprovação da nossa equipe. 
            Isso geralmente leva até 24 horas durante dias úteis.
          </p>
          <p className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Você receberá um email de confirmação assim que sua conta for aprovada e 
            poderá acessar todos os recursos da plataforma.
          </p>
        </div>

        {/* Status */}
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(107, 233, 76, 0.05)',
               borderColor: 'var(--sgbus-green, #6be94c)'
             }}>
          <div className="flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
            <span className="font-medium" style={{ color: 'var(--sgbus-green, #6be94c)' }}>
              Status: Aguardando Aprovação
            </span>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            Precisa de ajuda?
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com" 
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
              href="https://wa.me/5511999999999" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--sgbus-green, #6be94c)' }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--sgbus-green, #6be94c)',
              color: 'var(--night, #0e0f0f)',
              boxShadow: 'inset 0 0 0 2px var(--sgbus-green, #6be94c)'
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar Status
          </button>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ 
              border: '1px solid var(--periwinkle, #cfc6fe)',
              color: 'var(--periwinkle, #cfc6fe)',
              backgroundColor: 'transparent'
            }}
          >
            Sair da Conta
          </button>
        </div>

        {/* Data de registro */}
        {user?.createdAt && (
          <div className="mt-6 text-xs" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Conta criada em: {new Date(user.createdAt).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}
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