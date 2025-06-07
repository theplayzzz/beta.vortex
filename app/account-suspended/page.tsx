'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Pause, Mail, Phone, MessageCircle, AlertCircle } from 'lucide-react'

export default function AccountSuspendedPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de pausa */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Pause className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Conta Temporariamente Suspensa
        </h1>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Sua conta foi temporariamente suspensa devido a questões que precisam ser resolvidas.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start text-orange-700">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-left">
                <p className="font-medium mb-1">Motivos possíveis para suspensão:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
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
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-orange-700">
            <Pause className="w-5 h-5 mr-2" />
            <span className="font-medium">Status: Conta Suspensa</span>
          </div>
        </div>

        {/* Informações importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Como resolver?
          </h3>
          <div className="text-sm text-blue-700 text-left space-y-2">
            <p>• Entre em contato conosco imediatamente</p>
            <p>• Forneça informações para verificação</p>
            <p>• Aguarde análise da nossa equipe</p>
            <p>• A suspensão pode ser revertida após esclarecimentos</p>
          </div>
        </div>

        {/* Aviso importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start text-yellow-700">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-left">
              <p className="font-medium">Importante:</p>
              <p>Durante a suspensão, o acesso aos recursos da plataforma está bloqueado. Entre em contato o mais rápido possível para resolver a situação.</p>
            </div>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Contato urgente
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com?subject=Conta Suspensa - Solicitar Revisão Urgente" 
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
              href="https://wa.me/5511999999999?text=Urgente: Minha conta foi suspensa e preciso resolver" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm text-green-600 hover:text-green-800"
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
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Entrar em Contato Agora
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

        {/* Rodapé */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Suspensões são geralmente temporárias e podem ser resolvidas rapidamente.</p>
        </div>
      </div>
    </div>
  )
} 