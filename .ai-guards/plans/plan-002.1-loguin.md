
## 🧩 Scope

Criar página de login/registro personalizada com layout split screen seguindo a imagem de referência, integrando os componentes Clerk (`<SignIn />` e `<SignUp />`) no lado esquerdo e seção promocional no lado direito. Manter toda funcionalidade do Clerk (OAuth Discord/Google + email) enquanto aplica design system customizado.

**OBRIGATÓRIO**: Consultar MCP "context7" para documentação oficial do Clerk sobre customização de aparência e integração.

## ✅ Functional Requirements

### Layout Split Screen (Referência da Imagem)
- **Desktop**: Divisão 40% formulário + 60% seção promocional
- **Mobile**: Stack vertical (formulário no topo, seção promocional embaixo)
- **Container formulário**: Card com `border-radius: 1.5rem` (24px) e borda sutil
- **Background geral**: `night` (#0e0f0f)

### Lado Esquerdo - Formulário com Clerk
- **Tabs superiores**: "Login" e "Registro" (navegação entre SignIn/SignUp)
- **Componente Clerk**: `<SignIn />` ou `<SignUp />` customizado via appearance API
- **Funcionalidades mantidas**: 
  - OAuth Discord e Google
  - Email/username login
  - Password reset
  - Validações automáticas

### Lado Direito - Seção Promocional
- **Título**: "Gerencie suas tarefas e projetos"
- **Subtítulo**: "Controle seus backlogs, tarefas e vendas em uma única plataforma..."
- **Grid 2x2**: Cards das funcionalidades (Backlogs, Tarefas, Vendas, Dashboard)
- **Design**: Cards com `border-radius: 1rem` (16px) e ícones

### Responsividade
- **Breakpoint**: `lg:` (1024px) para split screen
- **Mobile/Tablet**: Layout stack vertical com proporções ajustadas
- **Touch-friendly**: Botões com altura mínima 44px

## ⚙️ Non-Functional Requirements

### Design System Compliance
- **Cores**: Usar exatamente as cores do `guia-de-cores-e-estilos.md`
- **Border radius**: Consistente com imagem (cards arredondados)
- **Typography**: Hierarquia clara conforme design system
- **Spacing**: Grid system consistente (rem units)

### Performance e UX
- **Loading states**: Mantidos pelo Clerk
- **Smooth transitions**: 200ms para mudanças de tab
- **Responsive images**: Otimizadas para diferentes densidades
- **Accessibility**: WCAG AA compliance

## 📚 Guidelines & Implementação

### Consulta MCP Obrigatória
```bash
# Consultar MCP context7 ANTES da implementação:
# - Clerk Appearance API documentation
# - Custom CSS variables for theming
# - SignIn/SignUp component customization
# - File-based routing setup
# - OAuth providers styling
```

### Estrutura de Layout
```tsx
// Layout base sugerido
<div className="min-h-screen bg-night">
  <div className="container mx-auto lg:flex lg:min-h-screen">
    {/* Lado Esquerdo - Formulário */}
    <div className="lg:w-2/5 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <AuthTabs /> {/* Login/Registro */}
        <div className="bg-eerie-black rounded-3xl border border-seasalt/10 p-8">
          {activeTab === 'login' ? (
            <SignIn appearance={clerkCustomTheme} />
          ) : (
            <SignUp appearance={clerkCustomTheme} />
          )}
        </div>
      </div>
    </div>
    
    {/* Lado Direito - Seção Promocional */}
    <div className="lg:w-3/5 flex items-center justify-center p-8">
      <PromoSection />
    </div>
  </div>
</div>
```

### Clerk Appearance Customization
```tsx
// Configuração baseada no MCP context7
const clerkCustomTheme = {
  variables: {
    colorPrimary: '#6be94c',          // sgbus-green
    colorBackground: '#171818',       // eerie-black
    colorInputBackground: '#0e0f0f',  // night
    colorText: '#f9fbfc',            // seasalt
    colorTextSecondary: '#cfc6fe',   // periwinkle
    borderRadius: '0.75rem',         // 12px
    // Consultar MCP para variáveis completas
  },
  elements: {
    // Customizações específicas conforme documentação
    formButtonPrimary: 'rounded-xl bg-sgbus-green hover:bg-sgbus-green/90',
    // Mais elementos conforme necessário
  }
};
```

## 🔢 Execution Plan

### 1. Setup Base e Consulta MCP
- **Consultar MCP context7**: Documentação completa do Clerk
- **Estrutura de arquivos**: Criar páginas sign-in e sign-up
- **Roteamento**: Configurar [[...sign-in]] e [[...sign-up]]
- **Layout base**: Container split screen responsivo

### 2. Implementação do Lado Esquerdo (Formulário)
- **Tabs component**: Navegação entre Login/Registro
- **Container card**: `bg-eerie-black rounded-3xl border border-seasalt/10`
- **Clerk integration**: SignIn/SignUp com appearance customizada
- **Estados visuais**: Active tab, hover states, focus states

### 3. Customização Clerk Appearance
- **Variáveis CSS**: Mapear cores do design system
- **Border radius**: Aplicar arredondamento consistente (0.75rem)
- **Typography**: Ajustar fonts e tamanhos
- **Botões OAuth**: Estilizar Discord e Google buttons
- **Form elements**: Input fields, labels, error messages

### 4. Implementação do Lado Direito (Promocional)
```tsx
// Seção promocional
<div className="space-y-8">
  <div className="text-center lg:text-left">
    <h1 className="text-4xl font-bold text-seasalt mb-4">
      Gerencie suas tarefas e projetos
    </h1>
    <p className="text-lg text-periwinkle">
      Controle seus backlogs, tarefas e vendas em uma única 
      plataforma. Aumente sua produtividade e organize 
      melhor seu trabalho.
    </p>
  </div>
  
  {/* Grid 2x2 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FeatureCard 
      title="Backlogs"
      description="Organize suas ideias e planejamentos futuros."
      icon={<FileText />}
    />
    <FeatureCard 
      title="Tarefas"
      description="Acompanhe sua lista de afazeres com prioridades."
      icon={<CheckSquare />}
    />
    <FeatureCard 
      title="Vendas"
      description="Monitore suas vendas e resultados financeiros."
      icon={<TrendingUp />}
    />
    <FeatureCard 
      title="Dashboard"
      description="Visualize métricas e estatísticas importantes."
      icon={<BarChart />}
    />
  </div>
</div>
```

### 5. FeatureCard Component
```tsx
// Cards das funcionalidades
<div className="bg-eerie-black/50 border border-seasalt/10 rounded-2xl p-6 hover:bg-eerie-black/70 transition-colors">
  <div className="text-sgbus-green mb-4">
    {icon}
  </div>
  <h3 className="text-xl font-semibold text-seasalt mb-2">
    {title}
  </h3>
  <p className="text-periwinkle">
    {description}
  </p>
</div>
```

### 6. Responsividade e Refinamentos
- **Mobile layout**: Stack vertical com padding adequado
- **Tablet**: Ajustar proporções e espaçamentos
- **Desktop**: Split screen conforme design
- **Touch targets**: Minimum 44px para elementos interativos
- **Keyboard navigation**: Tab order lógico

### 7. Testing e Validação
- **OAuth flows**: Testar Discord e Google login
- **Responsive design**: Validar em múltiplos breakpoints
- **Accessibility**: Contraste, screen readers, keyboard nav
- **Performance**: Bundle size, loading times
- **Cross-browser**: Chrome, Firefox, Safari

## 🚨 Erros Críticos a Evitar

### ❌ Clerk Integration
- **NÃO ignorar**: Documentação do MCP context7
- **NÃO quebrar**: Funcionalidades OAuth existentes
- **NÃO customizar**: Além do que a Appearance API permite
- **NÃO remover**: Validações e segurança do Clerk

### ❌ Design System
- **NÃO usar**: Border radius inconsistente com a imagem
- **NÃO aplicar**: Cores diferentes do guia estabelecido
- **NÃO ignorar**: Hierarquia tipográfica
- **NÃO quebrar**: Layout responsivo



## 📋 Definition of Done

- ✅ **MCP consultado**: Documentação Clerk verificada via context7
- ✅ **Layout split screen**: Funcionando em desktop conforme imagem
- ✅ **Responsividade**: Stack vertical em mobile funcionando
- ✅ **Clerk integration**: SignIn/SignUp com appearance customizada
- ✅ **OAuth mantido**: Discord e Google login funcionais
- ✅ **Design system**: Cores e border radius corretos
- ✅ **Seção promocional**: Grid 2x2 com cards funcionais
- ✅ **Tabs funcionais**: Navegação Login/Registro
- ✅ **Accessibility**: WCAG AA compliance validado
- ✅ **Cross-browser**: Testado em principais browsers

## 🎯 Resultado Esperado

Uma página de login profissional que combina:
1. **Funcionalidade robusta** do Clerk (OAuth + email/senha)
2. **Design atrativo** seguindo o sistema visual do Vortex Vault
3. **Layout split screen** que promove as funcionalidades da plataforma
4. **Experiência responsiva** otimizada para todos os dispositivos
5. **Acessibilidade** e performance de classe enterprise

---

**Foco na Execução**: Layout visual atrativo + integração técnica sólida com Clerk, sempre consultando MCP context7 para implementação correta.