"use client"

import { SignOutButton } from '@clerk/nextjs'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ⏳ Aguardando Aprovação
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sua conta está sendo analisada por nossa equipe
          </p>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>📧 Você foi aprovado via email?</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Faça logout e login novamente para atualizar seu status
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <SignOutButton redirectUrl="/sign-in">
            <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              🔄 Atualizar Status (Logout + Login)
            </button>
          </SignOutButton>
          
          <a
            href="/debug-status"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            🔍 Verificar Status Detalhado
          </a>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">💡 Processo de Aprovação:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Sua conta foi enviada para análise</li>
              <li>Nossa equipe revisa em até 24h</li>
              <li>Você recebe email de aprovação/rejeição</li>
              <li>Faça logout/login para atualizar status</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}