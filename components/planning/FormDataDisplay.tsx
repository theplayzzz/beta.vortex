'use client';

import { Calendar, User, Building, Target, TrendingUp, ShoppingBag } from 'lucide-react';

interface FormData {
  informacoes_basicas?: {
    titulo_planejamento?: string;
    descricao_objetivo?: string;
  };
  detalhes_do_setor?: {
    [key: string]: any;
  };
  marketing?: {
    maturidade_marketing?: string;
    meta_marketing?: string;
    [key: string]: any;
  };
  comercial?: {
    maturidade_comercial?: string;
    meta_comercial?: string;
    [key: string]: any;
  };
}

interface FormDataDisplayProps {
  formData: FormData | null;
  className?: string;
}

function formatFieldLabel(key: string): string {
  const labelMappings: { [key: string]: string } = {
    titulo_planejamento: 'Título do Planejamento',
    descricao_objetivo: 'Descrição do Objetivo',
    maturidade_marketing: 'Maturidade de Marketing',
    meta_marketing: 'Meta de Marketing',
    maturidade_comercial: 'Maturidade Comercial',
    meta_comercial: 'Meta Comercial',
    numero_de_lojas_atuais: 'Número de Lojas Atuais',
    principais_categorias_de_produtos: 'Principais Categorias de Produtos',
    tamanho_da_empresa: 'Tamanho da Empresa',
    numero_de_funcionarios: 'Número de Funcionários',
    receita_anual: 'Receita Anual',
    mercados_atendidos: 'Mercados Atendidos',
    canais_de_venda: 'Canais de Venda',
  };

  return labelMappings[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) return value.join(', ');
  return value.toString();
}

function SectionCard({ 
  title, 
  icon: Icon, 
  children, 
  className = '' 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`bg-eerie-black rounded-lg border border-accent/20 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-sgbus-green" />
        </div>
        <h3 className="text-lg font-semibold text-seasalt">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: any }) {
  return (
    <div className="mb-4 last:mb-0">
      <dt className="text-sm font-medium text-seasalt/70 mb-1">{label}</dt>
      <dd className="text-seasalt bg-night rounded-lg p-3 text-sm">
        {formatValue(value)}
      </dd>
    </div>
  );
}

export function FormDataDisplay({ formData, className = '' }: FormDataDisplayProps) {
  if (!formData) {
    return (
      <div className={`bg-eerie-black rounded-lg border border-accent/20 p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="h-8 w-8 text-sgbus-green" />
        </div>
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          Dados do Formulário Não Disponíveis
        </h3>
        <p className="text-seasalt/70">
          Este planejamento foi criado antes da implementação do sistema de formulários estruturados.
        </p>
      </div>
    );
  }

  const {
    informacoes_basicas,
    detalhes_do_setor,
    marketing,
    comercial
  } = formData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Informações Básicas */}
      {informacoes_basicas && (
        <SectionCard title="Informações Básicas" icon={Target}>
          <dl className="space-y-4">
            {Object.entries(informacoes_basicas).map(([key, value]) => (
              <FieldDisplay 
                key={key}
                label={formatFieldLabel(key)}
                value={value}
              />
            ))}
          </dl>
        </SectionCard>
      )}

      {/* Detalhes do Setor */}
      {detalhes_do_setor && Object.keys(detalhes_do_setor).length > 0 && (
        <SectionCard title="Detalhes do Setor" icon={Building}>
          <dl className="space-y-4">
            {Object.entries(detalhes_do_setor)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <FieldDisplay 
                  key={key}
                  label={formatFieldLabel(key)}
                  value={value}
                />
              ))}
          </dl>
        </SectionCard>
      )}

      {/* Marketing */}
      {marketing && (
        <SectionCard title="Marketing" icon={TrendingUp}>
          <dl className="space-y-4">
            {Object.entries(marketing)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <FieldDisplay 
                  key={key}
                  label={formatFieldLabel(key)}
                  value={value}
                />
              ))}
          </dl>
        </SectionCard>
      )}

      {/* Comercial */}
      {comercial && (
        <SectionCard title="Comercial" icon={ShoppingBag}>
          <dl className="space-y-4">
            {Object.entries(comercial)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <FieldDisplay 
                  key={key}
                  label={formatFieldLabel(key)}
                  value={value}
                />
              ))}
          </dl>
        </SectionCard>
      )}

      {/* Caso não haja dados em nenhuma seção */}
      {!informacoes_basicas && !detalhes_do_setor && !marketing && !comercial && (
        <div className="bg-eerie-black rounded-lg border border-accent/20 p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Formulário Não Preenchido
          </h3>
          <p className="text-seasalt/70">
            Este planejamento não possui dados detalhados do formulário.
          </p>
        </div>
      )}
    </div>
  );
} 