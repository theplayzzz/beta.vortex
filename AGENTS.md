
# Agent Guidelines for Vortex Precedent

## 1. Visão Geral da Aplicação

A Vortex Precedent é uma aplicação web full-stack para gestão de clientes (CRM), planejamentos estratégicos e propostas comerciais, com foco em automação e assistência por IA.

- **Frontend**: Next.js com App Router, TypeScript, Tailwind CSS.
- **Backend**: Next.js API Routes, Clerk para autenticação, Prisma como ORM.
- **Banco de Dados**: PostgreSQL (Supabase) com políticas de RLS.
- **IA e Automação**: CLI `ai-guards` customizada e integrações com modelos de linguagem.

## 2. Estrutura do Projeto

```
/
├── app/                # Rotas do Next.js (App Router)
│   ├── api/            # API Routes (backend)
│   └── (pages)/        # Páginas da aplicação
├── components/         # Componentes React reutilizáveis
├── lib/                # Lógica de negócio principal
│   ├── auth/           # Funções de autenticação
│   ├── planning/       # Lógica de planejamentos
│   ├── proposals/      # Lógica de propostas
│   └── validations/    # Schemas de validação (Zod)
├── hooks/              # Hooks React customizados
├── prisma/             # Schema e migrações do banco de dados
├── scripts/            # Scripts de automação e manutenção
├── ai-guards/          # CLI customizada para automação de dev
└── ...
```

## 3. Comandos Essenciais

- **Desenvolvimento**: `npm run dev` (porta 3003)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Formatação**: `npm run format:write`
- **Testes**: `npm test`
- **Teste Específico**: `npm test -- --testNamePattern="nome do teste"`

## 4. Convenções de Código

### 4.1. Frontend
- **Componentes**: Funcionais, com props tipadas via interfaces TypeScript.
- **Estilização**: Tailwind CSS com `clsx` para classes condicionais.
- **Gerenciamento de Estado**: React Query para data fetching/caching e Context API para estado global.
- **Formulários**: React Hook Form com Zod para validação.
- **Imports**: Absolutos com alias `@/`.

### 4.2. Backend
- **API Routes**: Localizadas em `app/api/`, seguindo a estrutura de rotas do Next.js.
- **Autenticação**: Gerenciada pelo `middleware.ts` com Clerk. Rotas protegidas por padrão.
- **Validação**: Zod para validar payloads de requisições.
- **Acesso ao BD**: Exclusivamente através do cliente Prisma (`lib/prisma/client.ts`).

### 4.3. Banco de Dados
- **Schema**: Definido em `prisma/schema.prisma`.
- **Segurança**: Políticas de Row Level Security (RLS) em `prisma/rls-policies.sql` garantem que usuários só acessem seus próprios dados.
- **Migrações**: Gerenciadas pelo Prisma.

### 4.4. Nomenclatura
- **Variáveis/Funções**: `camelCase`.
- **Componentes/Tipos**: `PascalCase`.
- **Arquivos**: `kebab-case`.

## 5. Fluxos de Trabalho Principais

### 5.1. Autenticação e Autorização
1. O `middleware.ts` intercepta todas as requisições.
2. Clerk valida o JWT do usuário.
3. O status de aprovação (`PENDING`, `APPROVED`, `REJECTED`) do usuário, armazenado nos metadados públicos do Clerk, determina o acesso.
4. Políticas de RLS no Supabase garantem que as queries ao banco de dados sejam seguras.

### 5.2. Criação de Planejamento
1. O usuário preenche um formulário multi-etapas (`components/planning/PlanningForm.tsx`).
2. Os dados são validados com Zod (`lib/planning/formSchema.ts`).
3. A API Route (`app/api/plannings/route.ts`) recebe os dados e os salva no banco de dados via Prisma.
4. Webhooks podem ser disparados para integrações com sistemas de IA (`lib/planning/webhookService.ts`).

## 6. Sistema de Design (Obrigatório)

- **Cores**: Usar exclusivamente variáveis CSS definidas em `.cursor/rules/regras-de-design-e-cores.mdc`.
- **Tema**: Dark por padrão. Não usar cores hardcoded.
- **Botões**: Primário com `--sgbus-green`, secundário com borda `--periwinkle`.
- **Acessibilidade**: Contraste de 7:1 e estados de foco visíveis.
