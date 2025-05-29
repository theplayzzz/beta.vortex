"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";

export default function PlanejamentosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Planejamentos</h1>
          <p className="text-seasalt/70 mt-1">
            Gerencie todos os seus planejamentos estratégicos
          </p>
        </div>
        <Link 
          href="/planejamentos/novo"
          className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Planejamento
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-eerie-black rounded-lg p-4 border border-accent/20">
        <div className="flex items-center gap-4">
          {/* Barra de Pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50" />
            <input
              type="text"
              placeholder="Pesquisar planejamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50">
              <option value="">Todos os status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="COMPLETED">Concluído</option>
            </select>
            
            <select className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50">
              <option value="">Todos os clientes</option>
              {/* Aqui virão os clientes dinâmicos */}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-accent/20">
          <div className="text-sm text-seasalt/70">
            0 planejamentos encontrados
          </div>
          <div className="flex items-center gap-2 text-sm text-seasalt/70">
            <Filter className="h-4 w-4" />
            Filtros ativos: Nenhum
          </div>
        </div>
      </div>

      {/* Lista de Planejamentos */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
        {/* Estado vazio */}
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sgbus-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Nenhum planejamento criado ainda
          </h3>
          <p className="text-seasalt/70 mb-6 max-w-md mx-auto">
            Crie seu primeiro planejamento estratégico selecionando um cliente e respondendo algumas perguntas essenciais
          </p>
          <Link 
            href="/planejamentos/novo"
            className="inline-flex items-center gap-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Criar Primeiro Planejamento
          </Link>
        </div>
      </div>
    </div>
  );
} 