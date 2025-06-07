'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { XCircle, Mail, Phone, MessageCircle, AlertTriangle } from 'lucide-react'

export default function AccountRejectedPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de X */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Conta Não Aprovada
        </h1>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Lamentamos informar que sua solicitação de conta não foi aprovada neste momento.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-left">
                <p className="font-medium mb-1">Motivos possíveis:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Informações incompletas ou incorretas</li>
                  <li>Não atendimento aos critérios de elegibilidade</li>
                  <li>Documentação insuficiente</li>
                  <li>Violação dos termos de uso</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-red-700">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Status: Conta Rejeitada</span>
          </div>
        </div>

        {/* Próximos passos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            O que fazer agora?
          </h3>
          <div className="text-sm text-blue-700 text-left space-y-2">
            <p>• Entre em contato conosco para entender os motivos específicos</p>
            <p>• Corrija as informações necessárias</p>
            <p>• Solicite uma nova análise da sua conta</p>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Entre em contato para esclarecimentos
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com?subject=Conta Rejeitada - Solicitar Revisão" 
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
              href="https://wa.me/5511999999999?text=Olá, minha conta foi rejeitada e gostaria de entender os motivos" 
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
          <a
            href="mailto:suporte@empresa.com?subject=Conta Rejeitada - Solicitar Revisão"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Solicitar Revisão
          </a>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Sair da Conta
          </button>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Você pode criar uma nova conta após resolver as questões identificadas.</p>
        </div>
      </div>
    </div>
  )
} 