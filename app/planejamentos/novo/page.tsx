"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Plus } from "lucide-react";
import Link from "next/link";

// Placeholder para o componente de seleção de cliente (será implementado nas próximas fases)
interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
}

export default function NovoPlnejamentoPage() {
  const router = useRouter();
  const [step, setStep] = useState<'client' | 'form'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setStep('form');
  };

  const handleBackToClient = () => {
    setStep('client');
    setSelectedClient(null);
  };

  if (step === 'form') {
    return (
      <div className="p-6 space-y-6">
        {/* Header com breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToClient}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Novo Planejamento</h1>
            <p className="text-seasalt/70">
              Cliente: {selectedClient?.name} • {selectedClient?.industry}
            </p>
          </div>
        </div>

        {/* Aqui será integrado o PlanningForm do PLAN-006 */}
        <div className="bg-eerie-black rounded-lg p-8 border border-accent/20">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sgbus-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-seasalt mb-2">
              Formulário de Planejamento
            </h3>
            <p className="text-seasalt/70 mb-4">
              Aqui será integrado o formulário completo do PLAN-006
            </p>
            <p className="text-sm text-seasalt/50">
              📋 4 Abas: Básico → Setor → Marketing → Comercial<br />
              🎯 Cliente: {selectedClient?.name}<br />
              🏢 Setor: {selectedClient?.industry}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center gap-4">
        <Link
          href="/planejamentos"
          className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Novo Planejamento</h1>
          <p className="text-seasalt/70">
            Selecione um cliente para começar
          </p>
        </div>
      </div>

      {/* Seleção de Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cliente Existente */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-sgbus-green" />
            </div>
            <h3 className="text-lg font-semibold text-seasalt">Cliente Existente</h3>
          </div>
          <p className="text-seasalt/70 mb-6">
            Selecione um cliente já cadastrado no sistema
          </p>
          
          {/* Lista de clientes mockada */}
          <div className="space-y-3 mb-6">
            <div className="text-sm text-seasalt/50 mb-3">
              Clientes recentes:
            </div>
            {/* Estados vazios para demonstração */}
            <div className="text-center py-8 text-seasalt/50">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente cadastrado ainda</p>
              <p className="text-sm">Crie um cliente primeiro</p>
            </div>
          </div>
          
          <button className="w-full bg-[#2A1B45] hover:bg-[#3A2B55] text-seasalt py-2 px-4 rounded-lg transition-colors border border-accent/20">
            Ver Todos os Clientes
          </button>
        </div>

        {/* Novo Cliente */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-sgbus-green" />
            </div>
            <h3 className="text-lg font-semibold text-seasalt">Novo Cliente</h3>
          </div>
          <p className="text-seasalt/70 mb-6">
            Crie um novo cliente rapidamente para este planejamento
          </p>
          
          {/* Formulário rápido */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-seasalt/70 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                placeholder="Digite o nome da empresa..."
                className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-seasalt/70 mb-2">
                Setor/Indústria
              </label>
              <select className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50">
                <option value="">Selecione o setor...</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
                <option value="Educação">Educação</option>
                <option value="Varejo físico">Varejo físico</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Serviços locais">Serviços locais</option>
                <option value="Serviços B2B">Serviços B2B</option>
                <option value="Tecnologia / SaaS">Tecnologia / SaaS</option>
                <option value="Imobiliário">Imobiliário</option>
                <option value="Indústria">Indústria</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
          
          <button className="w-full bg-sgbus-green hover:bg-sgbus-green/90 text-night py-2 px-4 rounded-lg font-medium transition-colors">
            Criar Cliente e Continuar
          </button>
        </div>
      </div>

      {/* Informações do Fluxo */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-3">
          📋 Próximos Passos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sgbus-green rounded-full flex items-center justify-center text-night font-bold text-xs">1</div>
            <span className="text-seasalt font-medium">Selecionar Cliente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs">2</div>
            <span className="text-seasalt/70">Informações Básicas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs">3</div>
            <span className="text-seasalt/70">Detalhes do Setor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs">4</div>
            <span className="text-seasalt/70">Marketing & Comercial</span>
          </div>
        </div>
      </div>
    </div>
  );
} 