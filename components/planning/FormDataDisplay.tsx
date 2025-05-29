'use client';

import { Calendar, User, Building, Target, TrendingUp, ShoppingBag } from 'lucide-react';

interface FormData {
  // Estrutura direta (planejamentos mais antigos)
  informacoes_basicas?: {
    titulo_planejamento?: string;
    descricao_objetivo?: string;
    setor?: string;
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
  
  // Estrutura aninhada (planejamentos mais novos)
  form_data?: {
    informacoes_basicas?: {
      titulo_planejamento?: string;
      descricao_objetivo?: string;
      setor?: string;
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
  };
  
  // Metadados extras
  client_context?: any;
  submission_metadata?: any;
}

interface FormDataDisplayProps {
  formData: FormData | null;
  className?: string;
}

// Função para normalizar os dados independente da estrutura
function normalizeFormData(formData: FormData | null): FormData | null {
  if (!formData) return null;

  // Se tem form_data aninhado, extrair de lá
  if (formData.form_data) {
    return {
      informacoes_basicas: formData.form_data.informacoes_basicas,
      detalhes_do_setor: formData.form_data.detalhes_do_setor,
      marketing: formData.form_data.marketing,
      comercial: formData.form_data.comercial,
    };
  }

  // Se é estrutura direta, retornar como está
  return formData;
}

function formatFieldLabel(key: string): string {
  const labelMappings: { [key: string]: string } = {
    titulo_planejamento: 'Título do Planejamento',
    descricao_objetivo: 'Descrição do Objetivo',
    setor: 'Setor',
    maturidade_marketing: 'Maturidade de Marketing',
    meta_marketing: 'Meta de Marketing',
    meta_marketing_personalizada: 'Meta Marketing Personalizada',
    principais_canais_marketing: 'Principais Canais de Marketing',
    investimento_marketing_mensal: 'Investimento Mensal em Marketing',
    maturidade_comercial: 'Maturidade Comercial',
    meta_comercial: 'Meta Comercial',
    meta_comercial_personalizada: 'Meta Comercial Personalizada',
    tempo_medio_fechamento: 'Tempo Médio de Fechamento',
    principal_objecao_vendas: 'Principal Objeção de Vendas',
    
    // Varejo
    varejo_numero_de_lojas_atuais: 'Número de Lojas Atuais',
    varejo_principais_categorias_de_produtos: 'Principais Categorias de Produtos',
    varejo_ticket_medio_atual: 'Ticket Médio Atual',
    varejo_canais_venda_atuais: 'Canais de Venda Atuais',
    varejo_sazonalidade_vendas: 'Sazonalidade das Vendas',
    
    // Alimentício
    alimenticio_tipo_estabelecimento: 'Tipo de Estabelecimento',
    alimenticio_principais_produtos: 'Principais Produtos',
    alimenticio_capacidade_producao_mensal: 'Capacidade de Produção Mensal',
    alimenticio_fornecedores_principais: 'Principais Fornecedores',
    alimenticio_certificacoes: 'Certificações',
    
    // Saúde
    saude_area: 'Área de Atuação',
    saude_profissionais: 'Número de Profissionais',
    saude_volume_pacientes: 'Volume de Pacientes/Mês',
    saude_valor_consulta: 'Valor da Consulta',
    saude_convenios: 'Convênios',
    saude_agendamento: 'Formas de Agendamento',
    saude_diferencial: 'Diferencial',
    saude_desafio: 'Principal Desafio',
    
    // Genéricos
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
    <div className="space-y-1">
      <dt className="text-sm font-medium text-seasalt/70">{label}</dt>
      <dd className="text-seasalt bg-night rounded-lg p-3 text-sm">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function SectionFields({ fields }: { fields: Array<{ key: string; value: any }> }) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ key, value }) => (
        <FieldDisplay 
          key={key}
          label={formatFieldLabel(key)}
          value={value}
        />
      ))}
    </dl>
  );
}

export function FormDataDisplay({ formData, className = '' }: FormDataDisplayProps) {
  // Normalizar os dados para lidar com diferentes estruturas
  const normalizedData = normalizeFormData(formData);

  if (!normalizedData) {
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
  } = normalizedData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Informações Básicas */}
      {informacoes_basicas && Object.keys(informacoes_basicas).length > 0 && (
        <SectionCard title="Informações Básicas" icon={Target}>
          <SectionFields 
            fields={Object.entries(informacoes_basicas)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => ({ key, value }))} 
          />
        </SectionCard>
      )}

      {/* Detalhes do Setor */}
      {detalhes_do_setor && Object.keys(detalhes_do_setor).length > 0 && (
        <SectionCard title="Detalhes do Setor" icon={Building}>
          <SectionFields 
            fields={Object.entries(detalhes_do_setor)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => ({ key, value }))} 
          />
        </SectionCard>
      )}

      {/* Marketing */}
      {marketing && Object.keys(marketing).length > 0 && (
        <SectionCard title="Marketing" icon={TrendingUp}>
          <SectionFields 
            fields={Object.entries(marketing)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => ({ key, value }))} 
          />
        </SectionCard>
      )}

      {/* Comercial */}
      {comercial && Object.keys(comercial).length > 0 && (
        <SectionCard title="Comercial" icon={ShoppingBag}>
          <SectionFields 
            fields={Object.entries(comercial)
              .filter(([key, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => ({ key, value }))} 
          />
        </SectionCard>
      )}

      {/* Caso não haja dados em nenhuma seção */}
      {(!informacoes_basicas || Object.keys(informacoes_basicas).length === 0) && 
       (!detalhes_do_setor || Object.keys(detalhes_do_setor).length === 0) && 
       (!marketing || Object.keys(marketing).length === 0) && 
       (!comercial || Object.keys(comercial).length === 0) && (
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