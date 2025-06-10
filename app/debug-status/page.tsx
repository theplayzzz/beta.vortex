import DebugUserStatus from '@/components/debug/DebugUserStatus'

export default function DebugStatusPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔍 Debug do Status de Aprovação
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h2 className="text-lg font-semibold text-blue-800">
              📋 Instruções para Resolver o Problema
            </h2>
            <div className="mt-2 text-blue-700">
              <p className="mb-2">
                Se você está sendo redirecionado para /pending-approval mesmo estando aprovado:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Faça LOGOUT completo da aplicação</li>
                <li>Aguarde 2-3 minutos (cache do Clerk)</li>
                <li>Faça LOGIN novamente</li>
                <li>Teste novamente o acesso</li>
              </ol>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h2 className="text-lg font-semibold text-yellow-800">
              ⚠️ Problema Comum: Cache de Session
            </h2>
            <p className="mt-2 text-yellow-700">
              O Clerk pode manter um cache do sessionClaims por alguns minutos. 
              Mesmo que o metadata seja atualizado no webhook, o token JWT do usuário 
              ainda pode conter as informações antigas até o próximo login.
            </p>
          </div>
          
          <DebugUserStatus />
          
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h2 className="text-lg font-semibold text-green-800">
              ✅ Como Verificar se Está Funcionando
            </h2>
            <div className="mt-2 text-green-700 space-y-2">
              <p>1. O campo "approvalStatus" deve mostrar "APPROVED"</p>
              <p>2. Os sessionClaims (backend) devem ter os mesmos dados do frontend</p>
              <p>3. Você deve conseguir acessar /dashboard sem redirecionamento</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">🧪 Teste Rápido</h2>
            <div className="space-y-4">
              <a 
                href="/dashboard" 
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Testar Acesso ao Dashboard
              </a>
              
              <a 
                href="/api/debug/auth" 
                target="_blank"
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4"
              >
                Ver SessionClaims (JSON)
              </a>
              
              <a 
                href="/api/debug/force-refresh" 
                target="_blank"
                className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-4"
              >
                Verificar Status Detalhado
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 