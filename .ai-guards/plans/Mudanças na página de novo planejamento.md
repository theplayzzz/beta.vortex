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


