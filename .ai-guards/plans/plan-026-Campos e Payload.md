---
id: plan-026
title: Refatoração do Formulário de Proposta - Campos e Payload
createdAt: 2025-06-12
author: theplayzzz
status: draft
---

## 🧩 Scope

Refatorar o formulário de criação de propostas com as seguintes mudanças:

### **Alterações nos Campos do Formulário:**

#### **Aba "Informações Básicas":**
- ✅ Manter: "Título da Proposta" 
- ✅ Manter: "Tipo de Proposta" (dropdown)
- ❌ Remover: "Descrição e Objetivo"
- ❌ Remover: "Prazo Estimado"  
- ✅ **NOVO**: "Nome da Contratada" (obrigatório)
  - Placeholder: "Digite seu nome ou o nome da sua empresa"
- ✅ **NOVO**: "Membros da Equipe" (opcional)
  - Placeholder: "Ex: João Silva (Designer), Maria Santos (Desenvolvedora)"

#### **Aba "Contexto Comercial":**
- ❌ Remover: "Orçamento Estimado" (dropdown)
- ✅ **NOVO**: "Orçamento Estimado" (campo de texto obrigatório)
  - Placeholder: "Ex: R$ 15.000,00 ou Entre R$ 10.000 - R$ 20.000"
- ❌ Remover: "Validade da Proposta"
- ✅ **NOVO**: "Forma e Prazo de Pagamento" (obrigatório)
  - Placeholder: "Ex: Pagamento único em 30 dias, ou 50% inicial + 50% na entrega, ou 3x mensais com 10% desconto à vista"
- ✅ Manter: "Urgência do Projeto"
- ✅ Manter: "Tomador de Decisão"
- ❌ Remover: "Concorrentes Considerados"
- ✅ **NOVO**: "Resumo da Dor/Problema do Cliente" (obrigatório)
  - Placeholder: "Descreva o problema principal identificado na operação do cliente que esta proposta irá resolver..."
- ✅ Manter: "Contexto Adicional"

### **Reestruturação do Payload do Webhook:**

Manter objetos principais mas renomear campos internos para serem auto-explicativos:

```json
{
  "submission_metadata": {
    "titulo_da_proposta": "string",
    "tipo_de_proposta": "string", 
    "nome_da_contratada": "string",
    "membros_da_equipe": "string" // opcional
  },
  "context_enrichment": {
    "urgencia_do_projeto": "string",
    "tomador_de_decisao": "string",
    "resumo_dor_problema_cliente": "string",
    "contexto_adicional": "string" // opcional
  },
  "proposal_requirements": {
    "orcamento_estimado": "string", // campo livre
    "forma_prazo_pagamento": "string",
    "escopo_detalhado": "string", // da aba Escopo de Serviços
    "deliverables": "array" // da aba Escopo de Serviços
  }
}
```

## ✅ Functional Requirements

### **Frontend Changes:**
- Alterar campos na aba "Informações Básicas"
  - Remover campo "Descrição e Objetivo" 
  - Remover campo "Prazo Estimado"
  - Adicionar campo "Nome da Contratada" (obrigatório)
  - Adicionar campo "Membros da Equipe" (opcional)

- Alterar campos na aba "Contexto Comercial"
  - Converter "Orçamento Estimado" de dropdown para campo de texto
  - Substituir "Validade da Proposta" por "Forma e Prazo de Pagamento"
  - Substituir "Concorrentes Considerados" por "Resumo da Dor/Problema do Cliente"

### **Backend Changes:**
- Atualizar validação dos formulários (schema validation)
- Renomear campos no payload do webhook para nomes auto-explicativos
- Manter compatibilidade com objetos principais do webhook
- Atualizar tipos TypeScript para novos campos

### **Validation Updates:**
- "Nome da Contratada": obrigatório, mínimo 2 caracteres
- "Membros da Equipe": opcional
- "Orçamento Estimado": obrigatório (texto livre)
- "Forma e Prazo de Pagamento": obrigatório, mínimo 10 caracteres
- "Resumo da Dor/Problema do Cliente": obrigatório, mínimo 20 caracteres

## ⚙️ Non-Functional Requirements

- **Compatibilidade**: Manter compatibilidade com webhooks existentes (apenas renomear campos internos)
- **Performance**: Não impactar performance do formulário
- **UX**: Melhorar clareza dos campos com placeholders explicativos
- **Validation**: Validação em tempo real nos campos obrigatórios

## 📚 Guidelines & Packages

- Seguir padrões de validação Zod existentes no projeto
- Usar componentes de UI existentes (Input, Textarea, Select)
- Manter consistência com design system atual
- Atualizar tipos TypeScript em `/lib/types/`

## 🔐 Threat Model (Stub)

- Validar entrada de dados nos novos campos de texto livre
- Sanitizar dados antes de envio ao webhook
- Validar tamanho máximo dos campos de texto

## 🔢 Execution Plan

### **Fase 1: Backend & Types**
1. Atualizar schemas de validação Zod para novos campos
2. Renomear campos no payload do webhook (manter objetos principais)
3. Atualizar tipos TypeScript para novos campos
4. Criar/atualizar interfaces para formulário

### **Fase 2: Frontend Components**
1. Localizar componente do formulário de proposta
2. Remover campos antigos ("Descrição e Objetivo", "Prazo Estimado", etc.)
3. Adicionar novos campos com validação adequada
4. Atualizar placeholders e labels dos campos
5. Converter "Orçamento Estimado" de dropdown para input text

### **Fase 3: Integration & Testing**
1. Testar envio do webhook com novo payload
2. Validar campos obrigatórios e opcionais
3. Testar placeholders e UX dos campos
4. Verificar compatibilidade com sistema receptor do webhook

### **Fase 4: Database & Migration**
1. Verificar se há necessidade de migração de dados existentes
2. Atualizar queries que dependem dos campos antigos
3. Teste de compatibilidade com propostas existentes

### **Arquivos a Modificar:**
- `/components/propostas/FormularioProposta.tsx` (ou similar)
- `/lib/validations/proposta.ts` (schemas Zod)
- `/lib/types/proposta.ts` (interfaces TypeScript)
- `/lib/webhooks/proposta-webhook.ts` (payload structure)
- Testes relacionados aos formulários de proposta
