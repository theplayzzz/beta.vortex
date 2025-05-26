---
id: plan-001
title: Upgrade Next.js para versão 15
createdAt: 2025-05-26
author: theplayzzz
status: completed
---

## 🧩 Scope

Upgrade do framework Next.js da versão 14.3.0-canary.57 para a versão 15, incluindo todas as adaptações necessárias no código, dependências e configurações para garantir compatibilidade, estabilidade e aproveitamento das novas funcionalidades. O escopo cobre o projeto principal, dependências diretas relacionadas ao Next.js e validação de testes automatizados.

## ✅ Functional Requirements

- Atualizar Next.js, React, React DOM e eslint-config-next para as versões mais recentes compatíveis com Next.js 15.
- Refatorar o código para adaptar o uso das APIs que se tornaram assíncronas (params, searchParams, headers, cookies, draftMode).
- Atualizar configurações do next.config.js conforme renomeações e novas opções.
- Garantir que todos os testes automatizados estejam passando após o upgrade.
- Validar o funcionamento das principais rotas, middlewares e integrações.

## ⚙️ Non-Functional Requirements

- Performance: O upgrade não deve degradar o tempo de resposta das rotas principais.
- Security: Garantir que não haja exposição de dados sensíveis durante o processo de upgrade e que dependências estejam atualizadas.
- Scalability: O sistema deve continuar suportando o volume atual de acessos e estar preparado para futuras atualizações do Next.js.

## 📚 Guidelines & Packages

- Seguir as guidelines do projeto para versionamento, testes e revisão de código.
- Utilizar os pacotes: next@latest, react@latest, react-dom@latest, eslint-config-next@latest, @clerk/nextjs, @vercel/analytics, @vercel/og, entre outros já presentes no projeto.
- Licenças: Garantir que todos os pacotes utilizados estejam sob licenças compatíveis com o projeto.

## 🔐 Threat Model (Stub)

- Possível quebra de funcionalidades devido a mudanças breaking nas APIs do Next.js.
- Incompatibilidade de dependências de terceiros com a nova versão do Next.js.

## 🔢 Execution Plan

1. Criar uma branch exclusiva para o upgrade e garantir backup do projeto e do .env.
2. Rodar o codemod oficial do Next.js ou atualizar manualmente as dependências principais.
3. Refatorar o código para adaptar APIs assíncronas e configurações renomeadas.
4. Validar e atualizar dependências relacionadas ao Next.js.
5. Rodar e corrigir todos os testes automatizados.
6. Testar manualmente as principais rotas e funcionalidades.
7. Subir a branch em ambiente de staging e validar o funcionamento completo.
8. Documentar as principais mudanças e realizar o deploy em produção após validação.
