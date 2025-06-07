'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Clock, Mail, Phone, MessageCircle } from 'lucide-react'

export default function PendingApprovalPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de relógio */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Conta Aguardando Aprovação
        </h1>

        {/* Mensagem personalizada */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Olá {user?.firstName || 'usuário'},
          </p>
          <p className="text-gray-600 mb-4">
            Sua conta foi criada com sucesso e está aguardando aprovação da nossa equipe. 
            Isso geralmente leva até 24 horas durante dias úteis.
          </p>
          <p className="text-sm text-gray-500">
            Você receberá um email de confirmação assim que sua conta for aprovada e 
            poderá acessar todos os recursos da plataforma.
          </p>
        </div>

        {/* Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Status: Aguardando Aprovação</span>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Precisa de ajuda?
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com" 
              className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Mail className="w-4 h-4 mr-2" />
              suporte@empresa.com
            </a>
            <a 
              href="tel:+5511999999999" 
              className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Phone className="w-4 h-4 mr-2" />
              (11) 99999-9999
            </a>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm text-green-600 hover:text-green-800"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Verificar Status
          </button>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Sair da Conta
          </button>
        </div>

        {/* Data de registro */}
        {user?.createdAt && (
          <div className="mt-6 text-xs text-gray-500">
            Conta criada em: {new Date(user.createdAt).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}
      </div>
    </div>
  )
} 