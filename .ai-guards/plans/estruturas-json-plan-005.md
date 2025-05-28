 # Estruturas JSON - Plan-005: Formulário Multi-Etapas

---
**Plan**: plan-005-criação-planejamento.md  
**Componente**: Estruturas de Dados JSON  
**Status**: ✅ PREPARADO  
**Data**: 2025-05-28  
---

## 📋 1. Estrutura `formDataJSON` - Dados do Formulário

### **Schema Completo do Formulário (4 Abas)**

```typescript
interface PlanningFormData {
  client_context: {
    client_id: string;
    client_name: string;
    industry: string;
    richness_score: number;
    custom_industry?: string;
  };
  informacoes_basicas: {
    titulo_planejamento: string;      // Obrigatório
    descricao_objetivo: string;       // Obrigatório
    setor: string;                    // Readonly (vem do client.industry)
  };
  detalhes_do_setor: {
    [key: string]: any;               // Campos dinâmicos por setor
  };
  marketing: {
    maturidade_marketing: string;     // Obrigatório
    meta_marketing?: string;          // Condicional
    meta_marketing_personalizada?: string; // Se meta = "Outro"
  };
  comercial: {
    maturidade_comercial: string;     // Obrigatório
    meta_comercial?: string;          // Condicional
    meta_comercial_personalizada?: string; // Se meta = "Outro"
  };
}
```

### **Exemplo Completo - E-commerce**

```json
{
  "client_context": {
    "client_id": "client_456",
    "client_name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richness_score": 85,
    "custom_industry": null
  },
  "informacoes_basicas": {
    "titulo_planejamento": "Expansão Digital 2024",
    "descricao_objetivo": "Aumentar vendas online em 50% através de estratégias de marketing digital e otimização de conversão",
    "setor": "E-commerce"
  },
  "detalhes_do_setor": {
    "ecom_categorias_destaque": "Eletrônicos e acessórios para smartphones",
    "ecom_ticket_medio": 150,
    "ecom_upsell": "Sim, mas sem estrutura",
    "ecom_plataformas": "Mercado Livre, Shopee, Site próprio",
    "ecom_conversao": "2.5%",
    "ecom_trafego": "Orgânico e pago (Google Ads)",
    "ecom_desafios": "Carrinho abandonado alto, falta de remarketing"
  },
  "marketing": {
    "maturidade_marketing": "Temos ações recorrentes, mas sem métricas",
    "meta_marketing": "Aumentar reconhecimento da marca",
    "meta_marketing_personalizada": null
  },
  "comercial": {
    "maturidade_comercial": "Possuímos um funil de vendas claro",
    "meta_comercial": "Otimizar taxa de conversão do funil",
    "meta_comercial_personalizada": null
  }
}
```

## 🏢 2. Configuração de Perguntas por Setor

### **Setores Permitidos (11 opções)**

```typescript
const SETORES_PERMITIDOS = [
  "Alimentação",
  "Saúde e Bem-estar", 
  "Educação",
  "Varejo físico",
  "E-commerce",
  "Serviços locais",
  "Serviços B2B",
  "Tecnologia / SaaS",
  "Imobiliário",
  "Indústria",
  "Outro"
];
```

### **Estrutura de Pergunta**

```typescript
interface Question {
  label: string;                    // Texto da pergunta
  field: string;                    // Nome do campo (snake_case com prefixo)
  type: "text" | "textarea" | "radio" | "checkbox" | "number";
  options?: string[];               // Para radio/checkbox
  required?: boolean;               // Campo obrigatório
  conditional?: {                   // Campos condicionais
    dependsOn: string;
    showWhen: string[];
  };
}
```

### **Exemplos por Setor**

#### **E-commerce** (`ecom_`)

```typescript
const PERGUNTAS_ECOMMERCE: Question[] = [
  {
    label: "Quais categorias de produtos mais vendem ou são mais lucrativas?",
    field: "ecom_categorias_destaque",
    type: "textarea",
    required: true
  },
  {
    label: "Qual é o ticket médio atual?",
    field: "ecom_ticket_medio",
    type: "number",
    required: true
  },
  {
    label: "Vocês aplicam estratégias de upsell/cross-sell no checkout?",
    field: "ecom_upsell",
    type: "radio",
    options: ["Não aplicamos", "Sim, mas sem estrutura", "Sim, com estratégia definida", "Outro"],
    required: true
  },
  {
    label: "Principais plataformas de venda utilizadas:",
    field: "ecom_plataformas",
    type: "textarea"
  },
  {
    label: "Taxa de conversão atual (se souber):",
    field: "ecom_conversao",
    type: "text"
  },
  {
    label: "Principais fontes de tráfego:",
    field: "ecom_trafego",
    type: "textarea"
  },
  {
    label: "Maiores desafios no e-commerce:",
    field: "ecom_desafios",
    type: "textarea"
  }
];
```

#### **Alimentação** (`alim_`)

```typescript
const PERGUNTAS_ALIMENTACAO: Question[] = [
  {
    label: "O negócio é:",
    field: "alim_tipo_negocio",
    type: "radio",
    options: ["Restaurante", "Lanchonete", "Food truck", "Delivery", "Indústria de alimentos", "Outro"],
    required: true
  },
  {
    label: "Qual é o ticket médio por pedido?",
    field: "alim_ticket_medio",
    type: "number",
    required: true
  },
  {
    label: "Utilizam plataformas como iFood, Rappi, etc.?",
    field: "alim_plataformas",
    type: "radio",
    options: ["Sim", "Não"],
    required: true
  },
  {
    label: "Horários de maior movimento:",
    field: "alim_horarios_pico",
    type: "textarea"
  },
  {
    label: "Principais pratos/produtos vendidos:",
    field: "alim_produtos_destaque",
    type: "textarea"
  },
  {
    label: "Fazem delivery próprio?",
    field: "alim_delivery_proprio",
    type: "radio",
    options: ["Sim", "Não", "Planejamos implementar"]
  }
];
```

## 📊 3. Estrutura `clientSnapshot` - Dados do Cliente

### **Schema do Snapshot**

```typescript
interface ClientSnapshot {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  customIndustry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  businessDetails?: string;
  targetAudience?: string;
  createdAt: string;
  snapshot_timestamp: string;
}
```

### **Exemplo de Snapshot**

```json
{
  "id": "client_456",
  "name": "Empresa XYZ Ltda",
  "industry": "E-commerce",
  "richnessScore": 85,
  "customIndustry": null,
  "serviceOrProduct": "Venda de eletrônicos e acessórios",
  "initialObjective": "Aumentar vendas online",
  "businessDetails": "E-commerce especializado em eletrônicos com 3 anos no mercado",
  "targetAudience": "Jovens de 18-35 anos interessados em tecnologia",
  "createdAt": "2024-01-01T00:00:00Z",
  "snapshot_timestamp": "2024-01-15T10:30:00Z"
}
```

## 🎯 4. Opções de Marketing por Maturidade

### **Níveis de Maturidade Marketing**

```typescript
const MATURIDADE_MARKETING = [
  "Não fazemos marketing",
  "Fazemos ações pontuais", 
  "Temos ações recorrentes, mas sem métricas",
  "Temos estratégia definida com métricas",
  "Marketing avançado com automação"
];
```

### **Metas por Nível de Maturidade**

```typescript
const METAS_MARKETING = {
  "Não fazemos marketing": [
    "Criar presença digital básica",
    "Definir público-alvo",
    "Estabelecer identidade visual",
    "Criar conteúdo inicial",
    "Outro"
  ],
  "Fazemos ações pontuais": [
    "Organizar calendário de conteúdo",
    "Definir métricas básicas",
    "Aumentar frequência de posts",
    "Melhorar qualidade do conteúdo",
    "Outro"
  ],
  "Temos ações recorrentes, mas sem métricas": [
    "Implementar ferramentas de análise",
    "Definir KPIs claros",
    "Aumentar reconhecimento da marca",
    "Melhorar engajamento",
    "Outro"
  ],
  "Temos estratégia definida com métricas": [
    "Otimizar campanhas existentes",
    "Expandir para novos canais",
    "Aumentar ROI das campanhas",
    "Implementar automação",
    "Outro"
  ],
  "Marketing avançado com automação": [
    "Otimizar funis de conversão",
    "Implementar IA/ML",
    "Expandir para novos mercados",
    "Aumentar LTV dos clientes",
    "Outro"
  ]
};
```

## 💼 5. Opções de Comercial por Maturidade

### **Níveis de Maturidade Comercial**

```typescript
const MATURIDADE_COMERCIAL = [
  "Não temos processo comercial estruturado",
  "Vendas informais sem processo",
  "Possuímos um funil de vendas claro",
  "Processo comercial com métricas",
  "Vendas automatizadas e otimizadas"
];
```

### **Metas por Nível de Maturidade**

```typescript
const METAS_COMERCIAL = {
  "Não temos processo comercial estruturado": [
    "Criar processo básico de vendas",
    "Definir perfil de cliente ideal",
    "Estabelecer argumentos de venda",
    "Organizar leads e contatos",
    "Outro"
  ],
  "Vendas informais sem processo": [
    "Estruturar funil de vendas",
    "Definir etapas do processo",
    "Criar scripts de abordagem",
    "Implementar CRM básico",
    "Outro"
  ],
  "Possuímos um funil de vendas claro": [
    "Implementar métricas de conversão",
    "Otimizar taxa de conversão do funil",
    "Automatizar follow-ups",
    "Melhorar qualificação de leads",
    "Outro"
  ],
  "Processo comercial com métricas": [
    "Otimizar tempo de ciclo de venda",
    "Aumentar ticket médio",
    "Implementar vendas consultivas",
    "Expandir equipe comercial",
    "Outro"
  ],
  "Vendas automatizadas e otimizadas": [
    "Implementar IA para scoring",
    "Otimizar previsão de vendas",
    "Expandir para novos mercados",
    "Implementar vendas complexas",
    "Outro"
  ]
};
```

## 🔄 6. Payload para Webhooks (Plan-006)

### **Estrutura para Envio à IA**

```typescript
interface WebhookPayload {
  planning_id: string;
  client_info: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
    customIndustry?: string;
    data_quality: "baixo" | "médio" | "alto";
  };
  form_submission_data: PlanningFormData;
  context_enrichment: {
    client_richness_level: "baixo" | "médio" | "alto";
    industry_specific_insights: boolean;
    personalization_level: "básico" | "intermediário" | "avançado";
  };
}
```

### **Exemplo de Payload**

```json
{
  "planning_id": "planning_123",
  "client_info": {
    "id": "client_456",
    "name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richnessScore": 85,
    "customIndustry": null,
    "data_quality": "alto"
  },
  "form_submission_data": {
    "client_context": { /* ... */ },
    "informacoes_basicas": { /* ... */ },
    "detalhes_do_setor": { /* ... */ },
    "marketing": { /* ... */ },
    "comercial": { /* ... */ }
  },
  "context_enrichment": {
    "client_richness_level": "alto",
    "industry_specific_insights": true,
    "personalization_level": "avançado"
  }
}
```

## ✅ 7. Validação com Zod

### **Schema de Validação**

```typescript
import { z } from 'zod';

const PlanningFormSchema = z.object({
  client_context: z.object({
    client_id: z.string().min(1),
    client_name: z.string().min(1),
    industry: z.string().min(1),
    richness_score: z.number().min(0).max(100),
    custom_industry: z.string().optional()
  }),
  informacoes_basicas: z.object({
    titulo_planejamento: z.string().min(1, "Título é obrigatório"),
    descricao_objetivo: z.string().min(1, "Descrição é obrigatória"),
    setor: z.string().min(1)
  }),
  detalhes_do_setor: z.record(z.any()),
  marketing: z.object({
    maturidade_marketing: z.enum([
      "Não fazemos marketing",
      "Fazemos ações pontuais",
      "Temos ações recorrentes, mas sem métricas", 
      "Temos estratégia definida com métricas",
      "Marketing avançado com automação"
    ]),
    meta_marketing: z.string().optional(),
    meta_marketing_personalizada: z.string().optional()
  }),
  comercial: z.object({
    maturidade_comercial: z.enum([
      "Não temos processo comercial estruturado",
      "Vendas informais sem processo",
      "Possuímos um funil de vendas claro",
      "Processo comercial com métricas", 
      "Vendas automatizadas e otimizadas"
    ]),
    meta_comercial: z.string().optional(),
    meta_comercial_personalizada: z.string().optional()
  })
});
```

---

**🎯 ESTRUTURAS JSON PREPARADAS PARA PLAN-005**

**Próximo Passo**: Implementação do formulário multi-etapas  
**Dependências**: Schema Prisma atualizado ✅  
**Validação**: Schemas Zod preparados ✅  