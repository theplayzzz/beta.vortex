"use client"

import { SignOutButton } from '@clerk/nextjs'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
         style={{ backgroundColor: 'var(--night)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold" style={{ color: 'var(--seasalt)' }}>
            ⏳ Aguardando Aprovação
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--periwinkle)' }}>
            Sua conta está sendo analisada por nossa equipe
          </p>
        </div>
        
        <div className="p-4 rounded-lg border border-l-4 transition-all duration-200" 
             style={{ 
               backgroundColor: 'var(--eerie-black)',
               borderColor: 'rgba(249, 251, 252, 0.1)',
               borderLeftColor: 'var(--sgbus-green)'
             }}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                <strong>📧 Você foi aprovado via email?</strong>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--periwinkle)' }}>
                Faça logout e login novamente para atualizar seu status
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <SignOutButton redirectUrl="/sign-in">
            <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
                    style={{ 
                      backgroundColor: 'var(--sgbus-green)',
                      color: 'var(--night)'
                    }}>
              🔄 Atualizar Status (Logout + Login)
            </button>
          </SignOutButton>
        </div>
        
        <div className="rounded-lg p-4 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'var(--eerie-black)',
               borderColor: 'rgba(249, 251, 252, 0.1)'
             }}>
          <div className="text-sm">
            <p className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>💡 Processo de Aprovação:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1" style={{ color: 'var(--periwinkle)' }}>
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