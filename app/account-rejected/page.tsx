'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { XCircle, Mail, Phone, MessageCircle, AlertTriangle } from 'lucide-react'

export default function AccountRejectedPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
      <div className="max-w-md w-full rounded-xl shadow-2xl p-8 text-center border border-opacity-10 transition-all duration-300 hover:shadow-3xl hover:transform hover:-translate-y-1" 
           style={{ 
             backgroundColor: 'var(--eerie-black, #171818)',
             borderColor: 'var(--seasalt, #f9fbfc)'
           }}>
        
        {/* Ícone de X */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300" 
               style={{ 
                 backgroundColor: 'rgba(255, 107, 107, 0.1)',
                 borderColor: '#ff6b6b'
               }}>
            <XCircle className="w-8 h-8" style={{ color: '#ff6b6b' }} />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold mb-4" 
            style={{ color: 'var(--seasalt, #f9fbfc)' }}>
          Conta Não Aprovada
        </h1>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="mb-4" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Lamentamos informar que sua solicitação de conta não foi aprovada neste momento.
          </p>
          <div className="rounded-lg p-4 border transition-all duration-200" 
               style={{ 
                 backgroundColor: 'rgba(255, 107, 107, 0.05)',
                 borderColor: '#ff6b6b'
               }}>
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#ff6b6b' }} />
              <div className="text-sm text-left">
                <p className="font-medium mb-1" style={{ color: '#ff6b6b' }}>Motivos possíveis:</p>
                <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
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
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(255, 107, 107, 0.05)',
               borderColor: '#ff6b6b'
             }}>
          <div className="flex items-center justify-center">
            <XCircle className="w-5 h-5 mr-2" style={{ color: '#ff6b6b' }} />
            <span className="font-medium" style={{ color: '#ff6b6b' }}>
              Status: Conta Rejeitada
            </span>
          </div>
        </div>

        {/* Próximos passos */}
        <div className="rounded-lg p-4 mb-6 border transition-all duration-200" 
             style={{ 
               backgroundColor: 'rgba(207, 198, 254, 0.05)',
               borderColor: 'var(--periwinkle, #cfc6fe)'
             }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            O que fazer agora?
          </h3>
          <div className="text-sm text-left space-y-2" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            <p>• Entre em contato conosco para entender os motivos específicos</p>
            <p>• Corrija as informações necessárias</p>
            <p>• Solicite uma nova análise da sua conta</p>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="border-t pt-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            Entre em contato para esclarecimentos
          </h3>
          <div className="space-y-3">
            <a 
              href="mailto:suporte@empresa.com?subject=Conta Rejeitada - Solicitar Revisão" 
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
              href="https://wa.me/5511999999999?text=Olá, minha conta foi rejeitada e gostaria de entender os motivos" 
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
          <a
            href="mailto:suporte@empresa.com?subject=Conta Rejeitada - Solicitar Revisão"
            className="w-full px-4 py-2 rounded-md font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--sgbus-green, #6be94c)',
              color: 'var(--night, #0e0f0f)',
              boxShadow: 'inset 0 0 0 2px var(--sgbus-green, #6be94c)'
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            Solicitar Revisão
          </a>
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
          <p>Você pode criar uma nova conta após resolver as questões identificadas.</p>
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