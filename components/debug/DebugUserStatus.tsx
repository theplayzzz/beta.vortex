"use client"

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

export default function DebugUserStatus() {
  const { user, isLoaded } = useUser()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const testSessionClaims = async () => {
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Erro ao buscar debug info:', error)
    }
  }
  
  if (!isLoaded) {
    return <div>Carregando...</div>
  }
  
  if (!user) {
    return <div>Usuário não logado</div>
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔍 Debug do Status do Usuário</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Dados do Clerk (Frontend)</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              publicMetadata: user.publicMetadata,
              unsafeMetadata: user.unsafeMetadata
            }, null, 2)}
          </pre>
        </div>
        
        <button 
          onClick={testSessionClaims}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Testar SessionClaims (Backend)
        </button>
        
        {debugInfo && (
          <div>
            <h3 className="font-semibold">Dados do SessionClaims (Backend)</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Status esperado:</strong> APPROVED</p>
          <p><strong>Problema comum:</strong> Cache de session não atualizado</p>
          <p><strong>Solução:</strong> Logout + Login novamente</p>
        </div>
      </div>
    </div>
  )
}