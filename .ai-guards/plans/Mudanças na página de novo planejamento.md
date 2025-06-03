### **2. 📄 `/components/planning/PlanningFormWithClient.tsx`**

#### **🧩 Componentes e Elementos:**

**ClientInfoSidebar:**
```23:72:components/planning/PlanningFormWithClient.tsx
function ClientInfoSidebar({ client }: { client: Client }) {
  return (
    <div className="space-y-6">
      {/* Header da Sidebar */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        {/* Nome do Cliente */}
        <div>
          <h3 className="font-medium text-seasalt text-sm mb-1">Nome</h3>
          <p className="text-seasalt/90 font-medium">{client.name}</p>
        </div>
        {/* Score de Dados */}
        <div className="flex-1 bg-night rounded-full h-2">
          <div 
            className="bg-sgbus-green rounded-full h-2"
            style={{ width: `${client.richnessScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```
instrução: precisamos que esse setor não seja com uma barra verde e sim que a cor da barra siga o padrão de cores das outras barras como a sessão de lista de clientes segue.

**Validação de Cliente:**
```117:140:components/planning/PlanningFormWithClient.tsx
const clientValidation = validateClientForForm(client);

if (!clientValidation.isValid) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <h3 className="text-lg font-semibold text-red-400">Problemas Encontrados</h3>
      </div>
      <ul className="space-y-2">
        {clientValidation.errors.map((error, index) => (
          <li key={index} className="text-red-300 text-sm">• {error}</li>
        ))}
      </ul>
    </div>
  );
}
```
instrução: não precisa de ser rigoroso com a validação d clientes nessa etapa, somente garantir que tenha um id e nome, essa validação ja é feita no momento que criamos o cliente

**Submissão do Formulário:**
```142:195:components/planning/PlanningFormWithClient.tsx
const handleFormSubmit = async (formData: PlanningFormData) => {
  try {
    setIsSubmitting(true);
    
    const submissionPayload = prepareFinalSubmissionPayload(
      client,
      formData,
      sessionId
    );

    const createdPlanning = await createPlanningMutation.mutateAsync({
      title: submissionPayload.title,
      description: submissionPayload.description,
      clientId: submissionPayload.clientId,
      formDataJSON: submissionPayload.formDataJSON,
      clientSnapshot: submissionPayload.clientSnapshot,
    });

    // Limpar localStorage e redirecionar
    localStorage.removeItem(`planning-form-draft-${client.id}`);
    router.push(`/planejamentos?highlight=${createdPlanning.id}`);
  } catch (error) {
    // Tratamento de erro com toast
  }
};
```
- **Processo**: Prepara payload, chama API, limpa dados temporários, redireciona
- **Estado**: Controla loading durante submissão
- **Feedback**: Toasts de sucesso/erro

---

instrução: precisamos fazer uma analise desse setor para que o load não fique rodando ate a resposta do webhook, mas para isso precisamos adicionar um gatilho de criação de planejamento, e um direcionamento rápido para a página de lista de clientes


#### **🧩 Componentes e Elementos:**

**Definição de Abas:**
```36:49:components/planning/PlanningForm.tsx
const TABS: Tab[] = [
  { 
    id: "informacoes_basicas", 
    label: "Informações Básicas", 
    component: BasicInfoTab 
  },
  { 
    id: "detalhes_setor", 
    label: "Detalhes do Setor", 
    component: SectorDetailsTab 
  },
  { 
    id: "marketing", 
    label: "Marketing", 
    component: MarketingTab 
  },
  { 
    id: "comercial", 
    label: "Comercial", 
    component: CommercialTab 
  }
];
```
- **Estrutura**: Array de objetos definindo cada aba
- **Propriedades**: ID, label e componente React associado

**Gerenciamento de Estado:**
```75:78:components/planning/PlanningForm.tsx
const [currentTabState, setCurrentTabState] = useState<number>(0);
const [tabsWithErrors, setTabsWithErrors] = useState<Set<number>>(new Set());
const [pendingTabNavigation, setPendingTabNavigation] = useState<number | null>(null);
```
- **`currentTabState`**: Índice da aba atual
- **`tabsWithErrors`**: Set com índices das abas que possuem erros
- **`pendingTabNavigation`**: Controla navegação pendente entre abas

**Formulário React Hook Form:**
```95:100:components/planning/PlanningForm.tsx
const form = useForm<PlanningFormData>({
  resolver: zodResolver(planningFormSchema),
  defaultValues: getDefaultValues(client.industry),
  mode: 'onBlur'
});
```
- **Validação**: Usa Zod schema para validação automática
- **Valores padrão**: Baseados no setor do cliente
- **Modo**: Valida quando o campo perde o foco

#### **🧩 Componentes e Elementos:**

**Renderização Dinâmica:**
```28:37:components/planning/tabs/SectorDetailsTab.tsx
{questions.map((question) => (
  <QuestionField
    key={question.field}
    question={question}
    value={formData[question.field]}
    onChange={(value) => onFieldChange(question.field, value)}
    error={errors[question.field]}
  />
))}
```
- **Função**: Itera sobre perguntas específicas do setor
- **Componente**: Usa `QuestionField` para renderizar cada pergunta
- **Dados**: Perguntas vêm de `getQuestionsForSector(sector)`

instrução:Precisamos que o formulá da 
    id: "detalhes_setor", 
    label: "Detalhes do Setor", 
    component: SectorDetailsTab 
seja fiel ao flowchatar criado para cada um dos setores existentes com base no arquivo de flowtaet existente 

---------

### **6. 📄 `/components/planning/tabs/MarketingTab.tsx`**

#### **🧩 Componentes e Elementos:**

**Estado Local:**
```19:21:components/planning/tabs/MarketingTab.tsx
const [selectedMaturidade, setSelectedMaturidade] = useState<string>(
  formData.maturidade_marketing || ""
);
```
- **Propósito**: Controla a maturidade selecionada para mostrar metas condicionais

**Dropdown de Maturidade:**
```34:45:components/planning/tabs/MarketingTab.tsx
<select
  value={selectedMaturidade}
  onChange={(e) => handleMaturidadeChange(e.target.value)}
  className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
>
  <option value="">Selecione o nível de maturidade...</option>
  {MATURIDADE_MARKETING.map((maturidade) => (
    <option key={maturidade} value={maturidade}>
      {maturidade}
    </option>
  ))}
</select>
```
- **Dados**: Opções vêm de `MATURIDADE_MARKETING` (configuração)
- **Interação**: Mudança reseta campos dependentes

**Descrição Dinâmica:**
```47:52:components/planning/tabs/MarketingTab.tsx
{selectedMaturidade && descricao && (
  <div className="bg-eerie-black rounded-lg p-4">
    <h4 className="text-seasalt font-medium mb-2">📊 Sua situação atual</h4>
    <p className="text-periwinkle text-sm">{descricao}</p>
  </div>
)}
```
- **Condicional**: Só aparece quando maturidade é selecionada
- **Conteúdo**: Descrição específica da maturidade escolhida

**Meta Personalizada:**
```75:85:components/planning/tabs/MarketingTab.tsx
{formData.meta_marketing === "Outro" && (
  <div className="space-y-3">
    <textarea
      value={formData.meta_marketing_personalizada || ""}
      onChange={(e) => onFieldChange("meta_marketing_personalizada", e.target.value)}
      placeholder="Descreva qual é sua meta específica de marketing..."
      rows={3}
    />
  </div>
)}
```
- **Condicional**: Aparece quando "Outro" é selecionado
- **Validação**: Campo obrigatório quando visível

---

### **7. 📄 `/components/planning/tabs/CommercialTab.tsx`**

Estrutura **idêntica** ao `MarketingTab`, mas com:
- Configurações de `MATURIDADE_COMERCIAL`
- Metas específicas comerciais
- Textos adaptados para contexto comercial

---

### **8. 📄 `/components/planning/QuestionField.tsx`**

#### **🧩 Componentes e Elementos:**

**Switch de Tipos:**
```14:95:components/planning/QuestionField.tsx
const renderField = () => {
  switch (type) {
    case 'text':
      return <input type="text" ... />;
    case 'number':
      return <input type="number" ... />;
    case 'textarea':
      return <textarea ... />;
    case 'radio':
      return <div className="space-y-3">...</div>;
    case 'checkbox':
      return <div className="space-y-3">...</div>;
    case 'select':
      return <select>...</select>;
    default:
      return null;
  }
};
```
- **Função**: Renderiza diferentes tipos de campo baseado na configuração
- **Tipos**: text, number, textarea, radio, checkbox, select
- **Estilo**: Consistente em todos os tipos

**Checkbox Múltiplo:**
```68:84:components/planning/QuestionField.tsx
checked={Array.isArray(value) && value.includes(option)}
onChange={(e) => {
  const currentValue = Array.isArray(value) ? value : [];
  if (e.target.checked) {
    onChange([...currentValue, option]);
  } else {
    onChange(currentValue.filter((v: string) => v !== option));
  }
}}
```
- **Lógica**: Gerencia array de valores selecionados
- **Estado**: Adiciona/remove itens do array

instrução: precisamos mudar a seleção de maturidade em ambos os cards para
- marketing 


Não temos nada estruturado ainda


Fazemos algumas ações pontuais sem estratégia clara


Temos ações recorrentes, mas sem métricas e indicadores definidos


Temos ações consistentes com indicadores claros e acompanhamento

ETAPA 8A: Para empresas com baixa maturidade ("Não temos nada estruturado ainda")
Qual a principal meta da sua empresa nos próximos meses?


Aumentar a presença nas redes sociais


Ser mais conhecido no mercado


Atrair mais clientes


Começar a estruturar ações de marketing


Entender melhor o comportamento do cliente


Lançar um novo produto ou serviço


Melhorar a identidade da marca


Outro: _________


➤ ETAPA 8B: Para empresas com maturidade média-baixa ("Fazemos ações pontuais sem estratégia clara")
Qual a principal meta da sua empresa nos próximos meses?


Melhorar o ranqueamento no Google (SEO)


Atrair mais clientes de forma previsível


Melhorar o posicionamento em marketplaces (Ex: iFood, Booking, etc.)


Ter presença digital mais consistente


Automatizar o processo de captação de leads


Reativar clientes antigos


Melhorar a reputação/marca da empresa


Outro: _________


➤ ETAPA 8C: Para empresas com maturidade média-alta ("Temos ações recorrentes, mas sem métricas")
Qual a principal meta da sua empresa nos próximos meses?


Aumentar as taxas de conversão


Reduzir o custo de aquisição de clientes (CAC)


Ampliar o número de canais de aquisição com retorno positivo


Estruturar indicadores de desempenho


Lançar campanhas integradas multicanais


Otimizar funis de venda existentes


Outro: _________


➤ ETAPA 8D: Para empresas com alta maturidade ("Temos ações consistentes com indicadores")
Qual a principal meta da sua empresa nos próximos meses?


Escalar estratégias validadas


Aumentar o lifetime value dos clientes (LTV)


Aumentar faturamento mantendo o CAC


Iniciar expansão geográfica ou de portfólio


Otimizar a eficiência entre marketing e vendas (Smarketing)


Outro: _________

Condições para exibir cada versão da Etapa 8:
Etapa 8A → Respondeu "Não temos nada estruturado ainda"


Etapa 8B → Respondeu "Fazemos algumas ações pontuais sem estratégia clara"


Etapa 8C → Respondeu "Temos ações recorrentes, mas sem métricas e indicadores definidos"


Etapa 8D → Respondeu "Temos ações consistentes com indicadores claros e acompanhamento"

-MATURIDADE COMERCIAL

Como você descreveria o nível de maturidade do time comercial?


Não temos processo comercial definido


Trabalhamos com vendas, mas sem método estruturado


Temos processo comercial com algumas rotinas, mas sem previsibilidade


Possuímos um funil de vendas claro com previsibilidade e metas

➤ ETAPA 10A: Para empresas com baixa maturidade comercial ("Não temos processo comercial definido")
Qual a principal meta do time comercial nos próximos meses?


Estruturar um processo básico de vendas


Começar a organizar uma rotina comercial


Ter um responsável por vendas


Gerar mais oportunidades de conversa com clientes


Aprender a lidar com objeções


Outro: _________


➤ ETAPA 10B: Para empresas com maturidade média-baixa ("Trabalhamos com vendas, mas sem método estruturado")
Qual a principal meta do time comercial nos próximos meses?


Criar um script de atendimento e vendas


Melhorar as taxas de fechamento


Aumentar a produtividade dos vendedores


Implementar um CRM ou outro sistema de gestão


Ter indicadores mínimos de desempenho (taxa de conversão, tempo de resposta, etc.)


Outro: _________


➤ ETAPA 10C: Para empresas com maturidade média-alta ("Temos processo com rotinas, mas sem previsibilidade")
Qual a principal meta do time comercial nos próximos meses?


Reduzir o ciclo de vendas


Prever resultados de vendas com base no funil


Estabelecer metas e acompanhamentos semanais


Melhorar integração com marketing


Criar campanhas comerciais ativas


Outro: _________


➤ ETAPA 10D: Para empresas com alta maturidade comercial ("Possuímos funil com previsibilidade e metas")
Qual a principal meta do time comercial nos próximos meses?


Escalar o modelo de vendas atual


Automatizar partes do processo comercial


Criar times de pré-vendedores e closers


Aumentar o lifetime value dos clientes via pós-venda comercial


Refinar processos avançados (follow-up, playbooks, scripts)


Outro: _________


Condições para exibir cada versão da Etapa 7:
Etapa 10A → Respondeu "Não temos processo comercial definido"


Etapa 10B → Respondeu "Trabalhamos com vendas, mas sem método estruturado"


Etapa 10C → Respondeu "Temos processo comercial com algumas rotinas, mas sem previsibilidade"


Etapa 10D → Respondeu "Possuímos um funil de vendas claro com previsibilidade e metas"

