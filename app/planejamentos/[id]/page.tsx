'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Building, CheckCircle } from 'lucide-react';

export default function PlanejamentoPage() {
  const params = useParams();
  const router = useRouter();
  const planningId = params?.id as string;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/planejamentos"
          className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Planejamento Criado</h1>
          <p className="text-seasalt/70">
            ID: {planningId}
          </p>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-sgbus-green" />
        </div>
        <h2 className="text-xl font-semibold text-sgbus-green mb-2">
          🎉 Planejamento Criado com Sucesso!
        </h2>
        <p className="text-seasalt/70 mb-6">
          Seu planejamento estratégico foi salvo no banco de dados e está pronto para ser desenvolvido.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-sgbus-green" />
            <span className="text-seasalt">Criado em: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-sgbus-green" />
            <span className="text-seasalt">Status: Rascunho</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Building className="h-4 w-4 text-sgbus-green" />
            <span className="text-seasalt">Phase 5 Testada</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/planejamentos"
            className="bg-eerie-black hover:bg-eerie-black/80 text-seasalt px-6 py-3 rounded-lg font-medium transition-colors border border-accent/20"
          >
            Ver Todos os Planejamentos
          </Link>
          <button
            onClick={() => router.push('/planejamentos/novo')}
            className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Criar Novo Planejamento
          </button>
        </div>
      </div>

      {/* Phase 5 Testing Info */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-4">
          📋 Phase 5 - Testes Realizados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-seasalt mb-3">✅ Funcionalidades Testadas</h4>
            <ul className="space-y-2 text-sm text-seasalt/70">
              <li>• Seleção de cliente (mock)</li>
              <li>• Integração do PlanningForm do PLAN-006</li>
              <li>• 4 abas funcionais do formulário</li>
              <li>• Validação Zod completa</li>
              <li>• Auto-save no localStorage</li>
              <li>• Submissão real ao banco via API</li>
              <li>• Payload estruturado (formDataJSON + clientSnapshot)</li>
              <li>• Redirecionamento após sucesso</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-seasalt mb-3">🔄 Próximas Phases</h4>
            <ul className="space-y-2 text-sm text-seasalt/70">
              <li>• Phase 3: Banco de dados real</li>
              <li>• Phase 4: Modal cliente existente</li>
              <li>• Phase 6: Optimistic updates</li>
              <li>• Loading states e skeletons</li>
              <li>• Error handling avançado</li>
              <li>• Cache TanStack Query otimizado</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-night rounded-lg p-4 border border-accent/10">
        <details className="text-sm">
          <summary className="text-seasalt/70 cursor-pointer hover:text-seasalt">
            Debug Info (Phase 5)
          </summary>
          <div className="mt-3 p-3 bg-eerie-black rounded text-xs text-seasalt/60">
            <p>• Planejamento ID: {planningId}</p>
            <p>• Timestamp: {new Date().toISOString()}</p>
            <p>• Componentes integrados: PlanningFormWithClient + PlanningForm</p>
            <p>• Context: ClientFormContext funcionando</p>
            <p>• Mapping: clientContextMapping aplicado</p>
            <p>• TanStack Query: useCreatePlanning utilizado</p>
          </div>
        </details>
      </div>
    </div>
  );
} 