---
id: plan-002
title: Fase 1: Fundação e Banco de Dados
createdAt: 2025-05-26
author: theplayzzz
status: draft
---

## 🧩 Escopo

Implementação da fundação do sistema, com foco em banco de dados, tipos TypeScript e autenticação, garantindo segurança, performance e base sólida para as próximas fases.

## ✅ Requisitos Funcionais

- Configuração do Prisma e Supabase conforme schema fornecido
- Implementação de Row Level Security (RLS) para isolamento por usuário
- Geração de tipos TypeScript e validação com Zod
- Integração de autenticação Clerk com Prisma
- Middleware para sincronização e proteção de rotas

## ⚙️ Requisitos Não Funcionais

- Performance: Índices otimizados e ConnectionPool configurado
- Segurança: RLS obrigatório, proteção de rotas e sincronização de usuários
- Escalabilidade: Estrutura preparada para múltiplos usuários e operações concorrentes

## 📚 Diretrizes & Pacotes

- Seguir documentação oficial do Prisma, Supabase e Clerk
- Sempre consultar a documentação mais atualizada das ferramentas utilizando o mcp context7, evitando informações desatualizadas ou incorretas
- Pacotes: prisma, @prisma/client, zod, @clerk/clerk-sdk, tanstack/react-query
- Não modificar o schema sem consultar a documentação

## 🔐 Modelo de Ameaças (Stub)

- Falha na configuração do RLS pode expor dados de outros usuários
- Erros em foreign keys podem causar inconsistências e vazamentos

## 🔢 Plano de Execução

### FASE 1: Fundação e Banco de Dados
Duração estimada: 2-3 dias

#### 📋 Configuração Base do Sistema

**TAREFA 1.1: Setup Prisma + Supabase**
- Instalar Prisma e dependências:
  - `npm install prisma @prisma/client`
- Configurar schema EXATAMENTE conforme `/docs/Schema prisma.txt`
- Executar migrations iniciais
- Configurar Row Level Security (RLS) no Supabase para isolamento por usuário
- Criar índices otimizados conforme definido no schema
- Configurar ConnectionPool para performance
- Testar conectividade com todas as tabelas

**ERROS A EVITAR:**
- ❌ Não modificar o schema sem consultar a documentação
- ❌ Não esquecer de configurar as foreign keys e cascade deletes
- ❌ Não implementar sem RLS (segurança crítica)

**TAREFA 1.2: Infraestrutura de Tipos TypeScript**
- Gerar tipos TypeScript a partir do schema Prisma
- Configurar validação com Zod baseada nos modelos
- Implementar tipos para operações CRUD
- Configurar hooks básicos do TanStack Query (sem implementar ainda)

**TAREFA 1.3: Middleware de Autenticação**
- Integrar Clerk com Prisma para sincronização automática de usuários
- Configurar middleware para capturar clerkId → userId do banco
- Implementar proteção de rotas baseada em autenticação
- Configurar saldo inicial de créditos para novos usuários

**ENTREGÁVEIS:**
- ✅ Banco conectado e funcional
- ✅ Tipos TypeScript gerados
- ✅ Middleware de auth configurado
- ✅ Usuários sendo salvos automaticamente
