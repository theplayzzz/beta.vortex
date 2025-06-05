---
id: plan-016
title: Formulário de Detalhes do Setor - SectorDetailsTab
createdAt: 2025-06-04
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar o componente `SectorDetailsTab` que renderiza formulários dinâmicos específicos por setor, seguindo fielmente o flowchart definido no arquivo "sessão 2 formulário.txt". O formulário deve adaptar-se automaticamente ao setor do cliente e apresentar as perguntas relevantes com os tipos de campo apropriados.

## 🔍 Análise do Fluxo Atual

### **Fluxo de Cadastro e Seleção de Setor**
1. **Cadastro do Cliente**: Realizado via `ClientFlowModal` onde o setor é selecionado
2. **Seleção do Cliente**: No planejamento, o setor vem automaticamente de `client.industry`
3. **Inicialização do Formulário**: `initializeFormWithClient()` carrega dados padrão baseados no setor
4. **Formulário Dinâmico**: `SectorDetailsTab` renderiza perguntas específicas usando `getQuestionsForSector()`

### **Sistema Atual de Validação de Campos**
```typescript
// Validação atual em lib/planning/formSchema.ts
function createDetalhesSetorSchema(setor?: string): z.ZodSchema<any> {
  const questions = getQuestionsForSector(setor as SetorPermitido);
  const schemaObject: Record<string, z.ZodSchema<any>> = {};

  questions.forEach(question => {
    if (question.required) {
      schemaObject[question.field] = z.string().min(1, `${question.label} é obrigatório`);
    } else {
      schemaObject[question.field] = z.string().optional();
    }
  });

  return z.object(schemaObject);
}
```

### **Padrão de Nomenclatura de Variáveis (Nome Extenso)**
```typescript
// Estrutura atual já implementada:
// Padrão: {setor_abreviado}_{identificador_da_pergunta}

interface ExemplosNomenclatura {
  // Alimentação
  "alim_tipo_negocio": string;          // "O negócio é:"
  "alim_ticket_medio": number;          // "Qual é o ticket médio por pedido?"
  "alim_volume_clientes": string;       // "Quantos clientes vocês atendem por dia/semana?"
  
  // Saúde
  "saude_area": string;                 // "Qual é a área de atuação?"
  "saude_valor_consulta": number;       // "Qual é o valor médio de uma consulta/sessão?"
  "saude_convenios": string;            // "Trabalham com convênios médicos?"
  
  // Educação
  "edu_tipo": string;                   // "Qual é o tipo de instituição?"
  "edu_numero_alunos": number;          // "Quantos alunos vocês atendem?"
  "edu_mensalidade": number;            // "Qual é a mensalidade média?"
}
```

### **Sistema Atual de Salvamento de Dados**
```typescript
// Estrutura JSON em localStorage e banco de dados
interface DraftStructure {
  client: Client;
  formData: {
    informacoes_basicas: { titulo_planejamento: string; descricao_objetivo: string; setor: string; };
    detalhes_do_setor: { 
      [variavel_extensa]: any;  // Ex: "alim_tipo_negocio": "Restaurante"
    };
    marketing: { maturidade_marketing: string; meta_marketing: string; };
    comercial: { maturidade_comercial: string; meta_comercial: string; };
  };
  savedAt: string;
  sessionId: string;
}

// Payload final para banco (StrategicPlanning.formDataJSON)
interface FinalPayload {
  formDataJSON: {
    client_context: ClientContext;
    form_data: FormData;                    // Estrutura aninhada
    submission_metadata: SubmissionMetadata;
  };
  clientSnapshot: ClientSnapshot;
}
```

### **Auto-save e Validação Existente**
- **LocalStorage**: `planning-form-draft-${client.id}` com estrutura completa
- **Validação**: Zod schema dinâmico baseado no setor selecionado
- **Auto-save**: Executado no `onBlur` e mudanças de aba via `handleSaveOnBlur()`
- **Recuperação**: Dados carregados automaticamente na inicialização

## ✅ Functional Requirements

- **Renderização Dinâmica por Setor**: Exibir perguntas específicas baseadas no setor (Tecnologia, Saúde, Educação, Varejo, Alimentação, Consultoria, Finanças, Marketing, Manufatura, Imobiliário, Transporte, Energia, Turismo, Outro)
- **Tipos de Campo Suportados**: 
  - Radio Buttons com campos condicionais
  - Text Area (multilinha) 
  - Multi-select com pesquisa e tags
  - Dropdown selecionável
  - Input numérico com formatação de moeda
  - Toggle Switch (Sim/Não)
  - Checkboxes (múltipla seleção)
- **Campos Condicionais**: Mostrar/ocultar campos baseado nas respostas anteriores (ex: campo "Outro" quando selecionado)
- **Validação Replicada**: Usar o mesmo padrão de validação Zod existente
- **Persistência de Dados**: Manter o padrão atual de salvamento com variáveis extensas
- **Navegação Fluida**: Permitir navegação entre abas sem perder dados

## ⚙️ Non-Functional Requirements

- **Responsividade**: Interface adaptável para desktop e mobile
- **Acessibilidade**: Componentes compatíveis com leitores de tela
- **Experiência do Usuário**: Transições suaves e feedback visual claro

## 📚 Guidelines & Packages

- **Nomenclatura de Variáveis**: Seguir padrão existente `{setor}_{identificador}`
- **Mapeamento Setores**: Usar arquivo "sessão 2 formulário.txt" como especificação
- **Componentes Reutilizáveis**: 
  - `QuestionField` - componente principal para renderizar diferentes tipos de campo
  - `ConditionalField` - para campos que aparecem condicionalmente
  - `MultiSelectWithTags` - componente para seleção múltipla com tags
- **Validação**: Usar Zod schema específico para cada tipo de pergunta (padrão existente)
- **Estado**: Integração com React Hook Form existente
- **Estilização**: Manter consistência com design system atual

## 🔐 Threat Model (Stub)

- **Validação de Entrada**: Sanitizar todos os inputs do usuário
- **Dados Sensíveis**: Não armazenar informações sensíveis no local storage
- **XSS Prevention**: Escapar conteúdo renderizado dinamicamente

## 🔢 Execution Plan

### 1. Extensão dos Tipos de Campo Suportados (FRONT-END)

**Adicionar novos tipos em `components/planning/QuestionField.tsx`:**
```typescript
// Tipo "multiselect" com tags personalizadas
case 'multiselect':
  return <MultiSelectWithTagsField {...fieldProps} />;

// Tipo "toggle" para Sim/Não
case 'toggle':
  return <ToggleSwitchField {...fieldProps} />;

// Melhorar tipo "number" com formatação de moeda
case 'number':
  return <NumericInputField 
    {...fieldProps} 
    formatCurrency={question.formatCurrency} 
  />;
```

### 2. Implementação de Campos Condicionais (FRONT-END)

**Sistema de dependências:**
```typescript
// Adicionar propriedade conditional na interface Question
interface Question {
  // ... propriedades existentes
  conditional?: {
    dependsOn: string;      // Campo do qual depende
    showWhen: string[];     // Valores que fazem aparecer
  };
}

// Exemplo de uso:
{
  label: "Especifique o outro tipo:",
  field: "tecnologia_outro_tipo_especifico",
  type: "text",
  conditional: {
    dependsOn: "tecnologia_planos_complementares",
    showWhen: ["Outro"]
  },
  required: true
}
```

### 3. Implementação da Renderização Dinâmica (FRONT-END)

**SectorDetailsTab aprimorado:**
```typescript
const SectorDetailsTab = ({ sector, formData, onFieldChange, errors }) => {
  const questions = getQuestionsForSector(sector);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  
  // Lógica para mostrar/ocultar campos condicionais
  useEffect(() => {
    const newVisibleFields = new Set<string>();
    
    questions.forEach(question => {
      // Campo sempre visível se não tem condição
      if (!question.conditional) {
        newVisibleFields.add(question.field);
        return;
      }
      
      // Verificar se condição é atendida
      const dependentValue = formData[question.conditional.dependsOn];
      if (question.conditional.showWhen.includes(dependentValue)) {
        newVisibleFields.add(question.field);
      }
    });
    
    setVisibleFields(newVisibleFields);
  }, [questions, formData]);
  
  return (
    <div className="space-y-6">
      {questions
        .filter(q => visibleFields.has(q.field))
        .map((question) => (
          <QuestionField
            key={question.field}
            question={question}
            value={formData[question.field]}
            onChange={(value) => onFieldChange(question.field, value)}
            error={errors[question.field]}
          />
        ))}
    </div>
  );
};
```

### 4. Mapeamento Completo das Perguntas por Setor (DADOS)

**Atualizar arquivo `lib/planning/sectorQuestions.ts`:**
```typescript
// Adicionar perguntas seguindo especificação do arquivo "sessão 2 formulário.txt"
// Exemplo para Tecnologia (SaaS):
"Tecnologia": [
  {
    label: "Qual funcionalidade, produto ou plano é mais procurado ou mais rentável?",
    field: "tecnologia_funcionalidade_principal",
    type: "textarea",
    required: true,
    placeholder: "Descreva detalhadamente..."
  },
  {
    label: "Sua empresa oferece planos complementares, módulos adicionais ou upgrades?",
    field: "tecnologia_planos_complementares",
    type: "radio",
    options: ["Não oferecemos", "Sim, pontualmente ou sob demanda", "Sim, temos uma esteira estruturada de upsell/add-ons", "Outro"],
    required: true
  },
  // ... mais 4 perguntas conforme especificação
]
```

### 5. Replicação do Sistema de Validação (INTEGRAÇÃO)

**Usar padrão existente em `createDetalhesSetorSchema()`:**
```typescript
// Já implementado - apenas garantir que funciona com novos tipos
questions.forEach(question => {
  let validator: z.ZodSchema<any>;
  
  switch (question.type) {
    case 'number':
      validator = z.number().min(0, `${question.label} deve ser maior que zero`);
      break;
    case 'multiselect':
      validator = z.array(z.string()).min(1, `Selecione pelo menos uma opção`);
      break;
    case 'toggle':
      validator = z.boolean();
      break;
    default:
      validator = z.string().min(1, `${question.label} é obrigatório`);
  }
  
  schemaObject[question.field] = question.required ? validator : validator.optional();
});
```

### 6. Preservação do Sistema de Salvamento (INTEGRAÇÃO)

**Manter estrutura atual de dados:**
```typescript
// LocalStorage: planning-form-draft-${client.id}
{
  client: Client,
  formData: {
    detalhes_do_setor: {
      "tecnologia_funcionalidade_principal": "API de pagamentos",
      "tecnologia_planos_complementares": "Sim, temos uma esteira estruturada",
      "tecnologia_modelo_b2b_b2c": "Empresas (B2B)",
      // ... todas as variáveis com nomes extensos
    }
  },
  savedAt: string,
  sessionId: string
}

// Banco: StrategicPlanning.formDataJSON
{
  client_context: { ... },
  form_data: {
    detalhes_do_setor: { ... }  // Mesma estrutura
  },
  submission_metadata: { ... }
}
```

### 7. Integração com Sistema Existente (INTEGRAÇÃO)

**Garantir compatibilidade:**
- Auto-save no `onBlur` mantido
- Navegação entre abas preservada
- Validação em tempo real
- Cálculo de progresso atualizado
- Recovery de dados do localStorage

### 8. Testes de Compatibilidade (TESTES)

**Validar funcionamento com:**
- Todos os 14 setores especificados
- Campos condicionais
- Validação de campos obrigatórios
- Salvamento automático
- Navegação entre abas
- Recuperação de dados salvos
