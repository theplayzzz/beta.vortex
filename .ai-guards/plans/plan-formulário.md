---
id: plan-006
title: Formulário Multi-Etapas de Criação de Planejamento
createdAt: 2025-05-29
author: theplayzzz
status: draft
---

## 🧩 Scope

Desenvolvimento específico da **Fase 2** do plan-criação-planejamento.md: **Formulário Multi-Etapas** para criação de planejamentos estratégicos personalizados. Esta fase foca exclusivamente nos componentes frontend do formulário dinâmico com 4 abas, baseado na infraestrutura já preparada na Fase 0.

**Contexto**: Schema Prisma já atualizado com campos `formDataJSON` e `clientSnapshot` no modelo `StrategicPlanning`. Sistema de clientes e infraestrutura base já existentes.

**Objetivo**: Implementar interface completa para coleta de dados estruturados que alimentarão o processamento IA nas fases posteriores.

## ✅ Infraestrutura Atual Analisada

### ✅ Schema Prisma (Já Atualizado)
```prisma
model StrategicPlanning {
  id                 String         @id @default(cuid())
  title              String
  description        String?
  specificObjectives String?
  scope              String?
  successMetrics     String?
  budget             String?
  toneOfVoice        String?
  status             PlanningStatus @default(DRAFT)
  clientId           String
  userId             String
  createdAt          DateTime       @default(now())
  updatedAt          DateTime
  
  // ✅ CAMPOS JÁ EXISTENTES PARA PLAN-005
  formDataJSON       Json?          // Dados completos do formulário (4 abas)
  clientSnapshot     Json?          // Snapshot dos dados do cliente
  
  PlanningTask       PlanningTask[]
  Client             Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  User               User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@index([userId])
  @@index([userId, clientId])    // Índice otimizado
  @@index([userId, status])      // Índice para filtros
}
```

### ✅ Modelo Client (Completo)
```prisma
model Client {
  id                      String  @id @default(cuid())
  name                    String
  industry                String?  // ✅ Campo flexível para 11 setores
  serviceOrProduct        String?
  initialObjective        String?
  contactEmail            String?
  contactPhone            String?
  website                 String?
  address                 String?
  businessDetails         String?  // ✅ Usado para setor "Outro"
  targetAudience          String?
  marketingObjectives     String?
  historyAndStrategies    String?
  challengesOpportunities String?
  competitors             String?
  resourcesBudget         String?
  toneOfVoice             String?
  preferencesRestrictions String?
  richnessScore           Int      @default(0)  // ✅ Score 0-100
  userId                  String
  // ... relacionamentos e índices
}
```

### ✅ Status Preparados para IA
```prisma
enum PlanningStatus {
  DRAFT                        // ✅ Estado inicial
  ACTIVE
  COMPLETED
  ARCHIVED
  
  // ✅ Status para Plan-006 (IA) - JÁ PREPARADOS
  PENDING_AI_BACKLOG_GENERATION   
  AI_BACKLOG_VISIBLE              
  PENDING_AI_REFINED_LIST         
  AI_REFINED_LIST_VISIBLE         
}
```

## ✅ Functional Requirements (Fase 2 Específica)

### Core Features da Fase 2
- **Formulário de 4 abas** com navegação fluida e validação
- **Header do cliente** sempre visível com badge de richness score
- **Campos dinâmicos** baseados no setor do cliente (11 setores suportados)
- **Sistema de progresso** com cálculo em tempo real (0-100%)
- **Persistência local** de dados durante preenchimento (localStorage)
- **Campos condicionais** que aparecem baseados em respostas anteriores
- **Validação robusta** com React Hook Form + Zod
- **Preparação para submissão** com estrutura JSON específica

### Fluxo de Usuário (Fase 2)
1. **Cliente já selecionado** (via sistema existente)
2. **Aba 1**: Informações básicas (título, descrição, setor readonly)
3. **Aba 2**: Perguntas específicas do setor (8-9 perguntas dinâmicas)
4. **Aba 3**: Maturidade de marketing + metas condicionais
5. **Aba 4**: Maturidade comercial + metas condicionais
6. **Salvamento local** contínuo + preparação para submissão

### Integração com Infraestrutura Existente
- **Aproveitamento do modelo Client** existente com todos os campos
- **Uso do campo `Client.industry`** para carregar perguntas dinâmicas
- **Exibição do `Client.richnessScore`** como motivador visual
- **Preparação do JSON** para os campos `formDataJSON` e `clientSnapshot`

## ⚙️ Non-Functional Requirements

### Performance
- **Carregamento inicial < 2s** para renderização completa
- **Mudança de aba < 200ms** com validação assíncrona
- **Auto-save local** a cada mudança de campo
- **Progresso atualizado** em tempo real sem lag

### Security
- **Validação Zod** em todos os campos de entrada
- **Sanitização de inputs** especialmente campos de texto livre
- **Dados sensíveis** mantidos apenas em localStorage (não persistence server-side até submissão)

### Usability
- **Navegação intuitiva** entre abas com indicação visual
- **Campos condicionais** aparecendo de forma suave
- **Feedback imediato** sobre preenchimento obrigatório
- **Recovery automático** de dados perdidos

## 📚 Guidelines & Packages

### Tech Stack (Já Disponível no Projeto)
- **React Hook Form** (^7.48.0) - Gerenciamento de formulário
- **Zod** (^3.22.0) - Validação de schema
- **@hookform/resolvers** (^3.3.0) - Integração RHF + Zod
- **Tailwind CSS** - Estilização responsiva
- **TypeScript** - Type safety

### UI Components (Shadcn/ui Existente)
- **Badge** - RichnessScoreBadge
- **Button** - Navegação entre abas
- **Input, Textarea** - Campos de texto
- **RadioGroup, Checkbox** - Seleções
- **Select** - Dropdowns de maturidade
- **Progress** - Barra de progresso

### Estrutura de Arquivos (Nova)
```
components/planning/
├── PlanningForm.tsx           # Componente principal
├── ClientHeader.tsx           # Header com cliente
├── RichnessScoreBadge.tsx     # Badge de score
├── FormProgress.tsx           # Barra de progresso
└── tabs/
    ├── BasicInfoTab.tsx       # Aba 1: Informações Básicas
    ├── SectorDetailsTab.tsx   # Aba 2: Detalhes do Setor
    ├── MarketingTab.tsx       # Aba 3: Marketing
    └── CommercialTab.tsx      # Aba 4: Comercial

lib/planning/
├── formSchema.ts             # Schemas Zod
├── sectorQuestions.ts        # Perguntas por setor
├── marketingConfig.ts        # Configurações de marketing
├── commercialConfig.ts       # Configurações comerciais
└── formUtils.ts              # Utilities do formulário

hooks/
├── usePlanningForm.ts        # Hook principal do formulário
├── useFormProgress.ts        # Cálculo de progresso
└── useLocalStorage.ts        # Persistência local
```

## 🔐 Threat Model

### Data Integrity Threats
- **Campos obrigatórios não preenchidos** → Validação Zod blocking
- **Dados corrompidos no localStorage** → Fallback para estado inicial + recovery
- **Perda de progresso** → Auto-save contínuo + warning antes de sair

### User Experience Threats  
- **Navegação acidental entre abas** → Validação não-blocking com avisos
- **Campos condicionais não funcionando** → Testes unitários para lógica condicional
- **Performance degradada** → Debounce em validações + memoização

### Technical Integration Threats
- **Incompatibilidade com schema existente** → Validação contra modelo Prisma atual
- **Quebra de tipos TypeScript** → Geração automática de tipos do Prisma
- **Conflitos com sistema de clientes** → Uso das interfaces existentes

## 🔢 Execution Plan

### Phase 1: Configuração Base (Day 1)
1. **Criar estrutura de arquivos**
   ```bash
   mkdir -p components/planning/tabs
   mkdir -p lib/planning
   mkdir -p hooks
   ```

2. **Configurar constantes dos setores**
   ```typescript
   // lib/planning/sectorConfig.ts
   export const SETORES_PERMITIDOS = [
     "Alimentação", "Saúde e Bem-estar", "Educação", "Varejo físico",
     "E-commerce", "Serviços locais", "Serviços B2B", "Tecnologia / SaaS",
     "Imobiliário", "Indústria", "Outro"
   ] as const;
   ```

3. **Setup de schemas Zod**
   ```typescript
   // lib/planning/formSchema.ts
   const planningFormSchema = z.object({
     informacoes_basicas: z.object({
       titulo_planejamento: z.string().min(1, "Título é obrigatório"),
       descricao_objetivo: z.string().min(1, "Descrição é obrigatória"),
       setor: z.string() // readonly, vem do client.industry
     }),
     detalhes_do_setor: z.record(z.any()), // dinâmico por setor
     marketing: z.object({
       maturidade_marketing: z.string().min(1, "Selecione uma maturidade"),
       meta_marketing: z.string().optional(),
       meta_marketing_personalizada: z.string().optional()
     }),
     comercial: z.object({
       maturidade_comercial: z.string().min(1, "Selecione uma maturidade"),
       meta_comercial: z.string().optional(),
       meta_comercial_personalizada: z.string().optional()
     })
   });
   ```

### Phase 2: Componentes Core (Day 2-3)

4. **Implementar ClientHeader.tsx**
   ```typescript
   interface ClientHeaderProps {
     client: {
       id: string;
       name: string;
       industry: string;
       richnessScore: number;
       businessDetails?: string;
     };
   }
   
   export function ClientHeader({ client }: ClientHeaderProps) {
     return (
       <div className="bg-night border border-seasalt/20 rounded-lg p-4 mb-6">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-semibold text-seasalt">{client.name}</h2>
             <p className="text-periwinkle">{client.industry}</p>
           </div>
           <RichnessScoreBadge score={client.richnessScore} />
         </div>
       </div>
     );
   }
   ```

5. **Implementar RichnessScoreBadge.tsx**
   ```typescript
   interface RichnessScoreBadgeProps {
     score: number; // 0-100
   }
   
   export function RichnessScoreBadge({ score }: RichnessScoreBadgeProps) {
     const getScoreConfig = (score: number) => {
       if (score >= 80) return { label: "Rico", color: "bg-green-500", icon: "🏆" };
       if (score >= 60) return { label: "Bom", color: "bg-yellow-500", icon: "⭐" };
       if (score >= 40) return { label: "Médio", color: "bg-orange-500", icon: "📊" };
       return { label: "Básico", color: "bg-red-500", icon: "📝" };
     };
     
     const config = getScoreConfig(score);
     
     return (
       <Badge className={`${config.color} text-white`}>
         {config.icon} {config.label} ({score}%)
       </Badge>
     );
   }
   ```

6. **Implementar FormProgress.tsx**
   ```typescript
   interface FormProgressProps {
     currentProgress: number; // 0-100
     currentTab: number;      // 0-3
   }
   
   export function FormProgress({ currentProgress, currentTab }: FormProgressProps) {
     const sectionWeights = {
       informacoesBasicas: 25,
       detalhesSetor: 25,
       marketing: 25,
       comercial: 25
     };
     
     return (
       <div className="mb-6">
         <div className="flex justify-between mb-2">
           <span className="text-sm text-periwinkle">Progresso do Formulário</span>
           <span className="text-sm text-seasalt">{currentProgress}%</span>
         </div>
         <Progress value={currentProgress} className="h-2" />
       </div>
     );
   }
   ```

### Phase 3: Sistema de Perguntas Dinâmicas (Day 4-5)

7. **Configurar perguntas por setor** (sectorQuestions.ts)
   ```typescript
   interface Question {
     label: string;
     field: string;
     type: "text" | "textarea" | "radio" | "checkbox" | "number";
     options?: string[];
     required?: boolean;
     conditional?: {
       dependsOn: string;
       showWhen: string[];
     };
   }
   
   export const PERGUNTAS_POR_SETOR: Record<string, Question[]> = {
     "Alimentação": [
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
       // ... mais 6 perguntas
     ],
     "E-commerce": [
       {
         label: "Quais categorias de produtos mais vendem ou são mais lucrativas?",
         field: "ecom_categorias_destaque",
         type: "textarea",
         required: true
       },
       // ... mais 6 perguntas
     ],
     // ... outros 9 setores
   };
   ```

8. **Implementar SectorDetailsTab.tsx**
   ```typescript
   interface SectorDetailsTabProps {
     sector: string;
     formData: any;
     onFieldChange: (field: string, value: any) => void;
     errors: any;
   }
   
   export function SectorDetailsTab({ sector, formData, onFieldChange, errors }: SectorDetailsTabProps) {
     const questions = PERGUNTAS_POR_SETOR[sector] || [];
     
     return (
       <div className="space-y-6">
         {questions.map((question) => (
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
   }
   ```

### Phase 4: Abas de Marketing e Comercial (Day 5-6)

9. **Configurar opções de maturidade** (marketingConfig.ts)
   ```typescript
   export const MATURIDADE_MARKETING = [
     "Não fazemos marketing",
     "Fazemos ações pontuais", 
     "Temos ações recorrentes, mas sem métricas",
     "Temos estratégia definida com métricas",
     "Marketing avançado com automação"
   ] as const;
   
   export const METAS_MARKETING = {
     "Não fazemos marketing": [
       "Criar presença digital básica",
       "Definir público-alvo",
       "Estabelecer identidade visual",
       "Criar conteúdo inicial",
       "Outro"
     ],
     // ... outras maturidades
   };
   ```

10. **Implementar MarketingTab.tsx e CommercialTab.tsx**
    ```typescript
    export function MarketingTab({ formData, onFieldChange, errors }: TabProps) {
      const [selectedMaturidade, setSelectedMaturidade] = useState(formData.maturidade_marketing || "");
      const metas = METAS_MARKETING[selectedMaturidade] || [];
      
      return (
        <div className="space-y-6">
          <Select
            value={selectedMaturidade}
            onValueChange={(value) => {
              setSelectedMaturidade(value);
              onFieldChange("maturidade_marketing", value);
            }}
          >
            {MATURIDADE_MARKETING.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
          
          {metas.length > 0 && (
            <Select
              value={formData.meta_marketing || ""}
              onValueChange={(value) => onFieldChange("meta_marketing", value)}
            >
              {metas.map((meta) => (
                <SelectItem key={meta} value={meta}>
                  {meta}
                </SelectItem>
              ))}
            </Select>
          )}
          
          {formData.meta_marketing === "Outro" && (
            <Input
              placeholder="Especifique sua meta personalizada..."
              value={formData.meta_marketing_personalizada || ""}
              onChange={(e) => onFieldChange("meta_marketing_personalizada", e.target.value)}
            />
          )}
        </div>
      );
    }
    ```

### Phase 5: Componente Principal e Integração (Day 7)

11. **Implementar PlanningForm.tsx** (componente principal)
    ```typescript
    interface PlanningFormProps {
      client: Client;
      onSubmit: (data: PlanningFormData) => void;
      onSaveDraft: (data: PlanningFormData) => void;
    }
    
    export function PlanningForm({ client, onSubmit, onSaveDraft }: PlanningFormProps) {
      const form = useForm<PlanningFormData>({
        resolver: zodResolver(planningFormSchema),
        defaultValues: getDefaultValues()
      });
      
      const [currentTab, setCurrentTab] = useState(0);
      const [progress, setProgress] = useState(0);
      
      // Auto-save para localStorage
      useEffect(() => {
        const subscription = form.watch((data) => {
          localStorage.setItem('planning-form-draft', JSON.stringify(data));
          updateProgress(data);
        });
        return () => subscription.unsubscribe();
      }, [form.watch]);
      
      const tabs = [
        { id: "informacoes_basicas", label: "Informações Básicas", component: BasicInfoTab },
        { id: "detalhes_setor", label: "Detalhes do Setor", component: SectorDetailsTab },
        { id: "marketing", label: "Marketing", component: MarketingTab },
        { id: "comercial", label: "Comercial", component: CommercialTab }
      ];
      
      return (
        <div className="max-w-4xl mx-auto p-6">
          <ClientHeader client={client} />
          <FormProgress currentProgress={progress} currentTab={currentTab} />
          
          <div className="mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(index)}
                  className={`pb-2 border-b-2 font-medium text-sm ${
                    currentTab === index
                      ? 'border-sgbus-green text-sgbus-green'
                      : 'border-transparent text-periwinkle hover:text-seasalt'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabContent tab={tabs[currentTab]} formData={form.getValues()} form={form} client={client} />
              
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
                  disabled={currentTab === 0}
                >
                  Anterior
                </Button>
                
                <div className="space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onSaveDraft(form.getValues())}
                  >
                    Salvar Rascunho
                  </Button>
                  
                  {currentTab < tabs.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentTab(Math.min(tabs.length - 1, currentTab + 1))}
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button type="submit">
                      Finalizar Planejamento
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      );
    }
    ```

12. **Implementar hooks customizados**
    ```typescript
    // hooks/usePlanningForm.ts
    export function usePlanningForm(client: Client) {
      const [progress, setProgress] = useState(0);
      const [formData, setFormData] = useState<PlanningFormData | null>(null);
      
      // Recovery de dados do localStorage
      useEffect(() => {
        const savedData = localStorage.getItem('planning-form-draft');
        if (savedData) {
          try {
            setFormData(JSON.parse(savedData));
          } catch (error) {
            console.error('Erro ao recuperar dados do formulário:', error);
          }
        }
      }, []);
      
      const updateProgress = useCallback((data: PlanningFormData) => {
        // Lógica de cálculo de progresso baseada nos pesos das seções
        const sectionWeights = { informacoesBasicas: 25, detalhesSetor: 25, marketing: 25, comercial: 25 };
        let totalProgress = 0;
        
        // Calcular progresso por seção
        // ... implementação detalhada
        
        setProgress(totalProgress);
      }, []);
      
      const prepareFinalPayload = useCallback((data: PlanningFormData) => {
        return {
          // Dados para StrategicPlanning.formDataJSON
          formDataJSON: {
            client_context: {
              client_id: client.id,
              client_name: client.name,
              industry: client.industry,
              richness_score: client.richnessScore,
              business_details: client.businessDetails
            },
            ...data
          },
          // Dados para StrategicPlanning.clientSnapshot
          clientSnapshot: {
            id: client.id,
            name: client.name,
            industry: client.industry,
            richnessScore: client.richnessScore,
            businessDetails: client.businessDetails,
            createdAt: client.createdAt,
            snapshot_timestamp: new Date().toISOString()
          }
        };
      }, [client]);
      
      return {
        progress,
        formData,
        updateProgress,
        prepareFinalPayload
      };
    }
    ```

### Phase 6: Testing & Validation (Day 8)

13. **Testes unitários para componentes**
    ```typescript
    // __tests__/components/planning/RichnessScoreBadge.test.tsx
    describe('RichnessScoreBadge', () => {
      it('should display correct label and color for high score', () => {
        render(<RichnessScoreBadge score={90} />);
        expect(screen.getByText(/Rico/)).toBeInTheDocument();
        expect(screen.getByText(/90%/)).toBeInTheDocument();
      });
    });
    ```

14. **Validação de integração com schema Prisma**
    ```typescript
    // Verificar se os tipos gerados do Prisma são compatíveis
    import { Client, StrategicPlanning } from '@prisma/client';
    
    // Teste de compatibilidade de tipos
    const validateClientInterface = (client: Client) => {
      const formProps: ClientHeaderProps['client'] = {
        id: client.id,
        name: client.name,
        industry: client.industry || '',
        richnessScore: client.richnessScore,
        businessDetails: client.businessDetails
      };
      return formProps;
    };
    ```

15. **Documentação técnica final**
    ```markdown
    # Formulário Multi-Etapas - Documentação Técnica
    
    ## Componentes Implementados
    - [x] ClientHeader.tsx - Exibição do cliente
    - [x] RichnessScoreBadge.tsx - Badge de score
    - [x] FormProgress.tsx - Progresso visual
    - [x] PlanningForm.tsx - Componente principal
    - [x] BasicInfoTab.tsx - Aba 1
    - [x] SectorDetailsTab.tsx - Aba 2
    - [x] MarketingTab.tsx - Aba 3
    - [x] CommercialTab.tsx - Aba 4
    
    ## Hooks Implementados
    - [x] usePlanningForm.ts - Lógica principal
    - [x] useFormProgress.ts - Cálculo de progresso
    - [x] useLocalStorage.ts - Persistência local
    
    ## Configurações
    - [x] 11 setores com perguntas específicas
    - [x] 5 níveis de maturidade Marketing/Comercial
    - [x] Validação Zod completa
    - [x] Auto-save localStorage
    ```

## 📊 Estrutura de Dados Final

### Interface do Formulário
```typescript
interface PlanningFormData {
  informacoes_basicas: {
    titulo_planejamento: string;
    descricao_objetivo: string;
    setor: string; // readonly, vem do client.industry
  };
  detalhes_do_setor: {
    [key: string]: any; // Campos dinâmicos por setor
  };
  marketing: {
    maturidade_marketing: string;
    meta_marketing?: string;
    meta_marketing_personalizada?: string;
  };
  comercial: {
    maturidade_comercial: string;
    meta_comercial?: string;
    meta_comercial_personalizada?: string;
  };
}
```

### Payload para StrategicPlanning
```typescript
// Para StrategicPlanning.formDataJSON
{
  "client_context": {
    "client_id": "client_456",
    "client_name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richness_score": 85,
    "business_details": "E-commerce especializado em eletrônicos"
  },
  "informacoes_basicas": {
    "titulo_planejamento": "Expansão Digital 2024",
    "descricao_objetivo": "Aumentar vendas online em 50%",
    "setor": "E-commerce"
  },
  "detalhes_do_setor": {
    "ecom_categorias_destaque": "Eletrônicos e acessórios",
    "ecom_ticket_medio": 150,
    "ecom_upsell": "Sim, mas sem estrutura"
  },
  "marketing": {
    "maturidade_marketing": "Temos ações recorrentes, mas sem métricas",
    "meta_marketing": "Aumentar reconhecimento da marca"
  },
  "comercial": {
    "maturidade_comercial": "Possuímos um funil de vendas claro",
    "meta_comercial": "Otimizar taxa de conversão do funil"
  }
}
```

## 🎯 Critérios de Sucesso (Fase 2)

### Funcionalidade
- ✅ **Formulário renderiza** com 4 abas funcionais
- ✅ **Campos dinâmicos** carregam baseados no setor do cliente
- ✅ **Validação Zod** funciona em tempo real
- ✅ **Auto-save** persiste dados no localStorage
- ✅ **Progresso visual** atualiza conforme preenchimento
- ✅ **Navegação entre abas** fluida e intuitiva

### Integração
- ✅ **Compatibilidade total** com schema Prisma existente
- ✅ **Uso correto** dos campos Client já disponíveis
- ✅ **Preparação adequada** do JSON para fases posteriores
- ✅ **Sem quebras** na infraestrutura existente

### Performance
- ✅ **Carregamento < 2s** para formulário completo
- ✅ **Mudança de aba < 200ms** sem travamentos
- ✅ **Auto-save não bloqueia** a interface
- ✅ **Responsivo** em diferentes tamanhos de tela

### Dados
- ✅ **11 setores** implementados com perguntas específicas
- ✅ **5 níveis** de maturidade Marketing/Comercial
- ✅ **JSON estruturado** corretamente para IA
- ✅ **Dados de cliente** capturados no snapshot

**📋 PRÓXIMOS PASSOS**: Após conclusão da Fase 2, o formulário estará pronto para integração com as APIs na Fase 3 e posterior processamento IA no plan-006 específico.
