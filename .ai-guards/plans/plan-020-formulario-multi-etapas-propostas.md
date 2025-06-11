---
id: plan-020
title: Implementação de Formulário Multi-Etapas para Criação de Propostas
createdAt: 2025-06-11
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar melhorias no formulário da página `/propostas/nova` com navegação por etapas, validação inteligente, integração com webhook para processamento de propostas e fluxo completo de criação e armazenamento de propostas.

## ✅ Functional Requirements

- Implementar navegação por etapas no formulário com botões "Próximo" funcionais
- Aplicar validação apenas no botão final "Gerar Proposta" (similar ao formulário de planejamento)
- Salvar dados do formulário no banco de dados existente
- Enviar webhook para `PROPOSTA_WEBHOOK_URL` com informações do formulário e cliente
- Processar resposta do webhook contendo proposta em formato markdown
- Salvar proposta processada no campo adequado do banco de dados
- Redirecionar usuário para página da proposta criada após processamento
- Atualizar sessão do planejamento com a proposta em markdown

## ⚙️ Non-Functional Requirements

- Performance: Webhook deve executar em segundo plano sem impactar fluidez do fluxo
- Responsividade: Processamento assíncrono para não bloquear interface
- Confiabilidade: Tratamento de erros na comunicação com webhook
- Usabilidade: Feedback visual durante processamento da proposta

## 📚 Guidelines & Packages

- Seguir padrões de validação existentes no formulário de planejamento
- Utilizar sistema de validação client-side e server-side existente
- Implementar processamento assíncrono para webhooks
- Manter consistência visual com demais formulários do sistema
- Usar bibliotecas de HTTP client existentes no projeto para webhook

## 🔐 Threat Model (Stub)

- Validação de dados do webhook para prevenir injection attacks
- Sanitização do conteúdo markdown recebido do webhook
- Validação de URL do webhook para prevenir SSRF
- Proteção contra timeouts prolongados do webhook

## 🔢 Execution Plan

1. **Implementar navegação por etapas**
   - Remover validações intermediárias dos botões "Próximo"
   - Manter apenas validação no botão final "Gerar Proposta"
   - Implementar indicador visual de progresso das etapas

2. **Implementar validação inteligente**
   - Adaptar sistema de validação do formulário de planejamento
   - Retornar usuário à etapa com erro
   - Destacar campos obrigatórios não preenchidos

3. **Integração com banco de dados**
   - Identificar tabela existente para propostas
   - Mapear campos do formulário para colunas da tabela
   - Implementar salvamento inicial dos dados

4. **Implementação do webhook**
   - Criar endpoint para envio do webhook
   - Implementar processamento assíncrono
   - Configurar timeout apropriado para resposta

5. **Processamento da resposta**
   - Implementar parser para extrair markdown do JSON de resposta
   - Salvar proposta processada no campo adequado do banco
   - Atualizar sessão do planejamento com markdown

6. **Finalização do fluxo**
   - Implementar redirecionamento para página da proposta
   - Adicionar feedback visual durante processamento
   - Implementar tratamento de erros e retry logic

7. **Testes e validação**
   - Testar resposta do webhook para entender estrutura
   - Validar fluxo completo end-to-end
   - Testar cenários de erro e recuperação
