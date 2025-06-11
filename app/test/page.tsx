"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface Client {
  id: string;
  name: string;
  industry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  richnessScore: number;
  isViewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TestPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Buscar clientes
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setMessage(`✅ ${data.clients.length} clientes carregados`);
      } else {
        setMessage(`❌ Erro ao carregar clientes: ${response.status}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Criar cliente de teste
  const createTestClient = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Cliente Teste ${Date.now()}`,
          industry: 'Tecnologia',
          serviceOrProduct: 'Desenvolvimento de software',
          initialObjective: 'Aumentar vendas online'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Cliente criado: ${data.client.name} (isViewed: ${data.client.isViewed})`);
        fetchClients(); // Recarregar lista
      } else {
        const error = await response.json();
        setMessage(`❌ Erro ao criar cliente: ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Marcar cliente como visualizado
  const viewClient = async (clientId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Cliente visualizado: ${data.client.name} (isViewed: ${data.client.isViewed})`);
        fetchClients(); // Recarregar lista
      } else {
        setMessage(`❌ Erro ao visualizar cliente: ${response.status}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchClients();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-6">Você precisa estar logado para acessar esta página.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
        <h1 className="text-2xl font-bold text-seasalt mb-4">
          🧪 Página de Teste - Sistema de Clientes
        </h1>
        
        <div className="space-y-4">
          <div className="text-seasalt">
            <strong>Usuário:</strong> {user?.firstName} {user?.lastName} ({user?.id})
          </div>

          {message && (
            <div className="p-3 bg-night rounded-lg border border-seasalt/20">
              <div className="text-seasalt text-sm">{message}</div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={createTestClient}
              disabled={loading}
              className="px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Cliente Teste'}
            </button>

            <button
              onClick={fetchClients}
              disabled={loading}
              className="px-4 py-2 bg-periwinkle text-night rounded-lg hover:bg-periwinkle/90 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Recarregar Lista'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
        <h2 className="text-xl font-semibold text-seasalt mb-4">
          📋 Lista de Clientes ({clients.length})
        </h2>

        {clients.length === 0 ? (
          <div className="text-periwinkle text-center py-8">
            Nenhum cliente encontrado. Crie um cliente de teste acima.
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !client.isViewed
                    ? 'border-sgbus-green/30 bg-sgbus-green/5'
                    : 'border-seasalt/10 bg-night'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-semibold ${
                        !client.isViewed ? 'text-sgbus-green' : 'text-seasalt'
                      }`}>
                        {client.name}
                      </h3>
                      {!client.isViewed && (
                        <span className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-xs rounded-full flex items-center gap-1">
                          ⭐ Novo
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-periwinkle mt-1">
                      {client.industry} • Completude: {client.richnessScore}% • 
                      Visualizado: {client.isViewed ? '✅' : '❌'}
                    </div>
                    <div className="text-xs text-periwinkle mt-1">
                      Criado: {new Date(client.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!client.isViewed && (
                      <button
                        onClick={() => viewClient(client.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-sgbus-green text-night text-sm rounded hover:bg-sgbus-green/90 disabled:opacity-50"
                      >
                        Visualizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
        <h2 className="text-xl font-semibold text-seasalt mb-4">
          🎯 Testes Implementados
        </h2>
        <div className="space-y-2 text-sm text-periwinkle">
          <div>✅ Dashboard com contagem real de clientes</div>
          <div>✅ Sistema de highlight baseado em isViewed</div>
          <div>✅ API de criação de clientes</div>
          <div>✅ API de listagem com campo isViewed</div>
          <div>✅ API de visualização que marca isViewed=true</div>
          <div>✅ Interface visual para clientes novos</div>
          <div>✅ Migração do banco aplicada</div>
          <div>✅ Prisma Client regenerado</div>
          <div>✅ Página /clientes/novo removida</div>
          <div>✅ ClientFlow Modal integrado na página de clientes</div>
          <div>✅ ClientFlow Modal integrado no dashboard</div>
          <div>✅ Hook useClientFlow criado para reutilização</div>
        </div>
      </div>

      <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
        <h2 className="text-xl font-semibold text-seasalt mb-4">
          🔄 ClientFlow Modal - Demonstração
        </h2>
        <div className="space-y-6">
          <div className="text-sm text-periwinkle mb-4">
            O ClientFlow Modal agora substitui a página dedicada e pode ser usado em qualquer lugar:
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-seasalt">Locais de Uso:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-sgbus-green">
                  <span className="mr-2">✅</span>
                  Página de Clientes (botão &quot;Novo Cliente&quot;)
                </div>
                <div className="flex items-center text-sgbus-green">
                  <span className="mr-2">✅</span>
                  Dashboard (ação rápida &quot;Novo Cliente&quot;)
                </div>
                <div className="flex items-center text-periwinkle">
                  <span className="mr-2">🔄</span>
                  Futuras funcionalidades (planejamentos, vendas, etc.)
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-seasalt">Comportamentos:</h3>
              <div className="space-y-2 text-sm">
                <div className="text-periwinkle">
                  <strong>Página Clientes:</strong> Apenas criação de novos clientes
                </div>
                <div className="text-periwinkle">
                  <strong>Outras funcionalidades:</strong> Seleção OU criação
                </div>
                <div className="text-periwinkle">
                  <strong>Hook useClientFlow:</strong> Facilita integração
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 