# 📋 CHECKLIST DE TESTES MANUAL - Sistema de Aprovação

## 🎯 Objetivo
Verificar manualmente todas as implementações das Phases 1, 2 e 3 no Supabase, Clerk e aplicação.

---

## 🔍 PHASE 1: Database Schema & Environment Setup

### ✅ Verificação no Supabase

#### 1. Acesse o Supabase Dashboard
- 🌐 URL: https://supabase.com/dashboard
- 📧 Faça login com sua conta
- 🎯 Selecione o projeto Vortex/Precedent

#### 2. Verificar Schema do Database
**Navegação**: `Database` → `Tables` → `User`

**✅ Campos que DEVEM existir na tabela User:**
- [ ] `approvalStatus` (enum: PENDING, APPROVED, REJECTED, SUSPENDED)
- [ ] `approvedAt` (timestamp, nullable)
- [ ] `approvedBy` (string, nullable) 
- [ ] `rejectedAt` (timestamp, nullable)
- [ ] `rejectedBy` (string, nullable)
- [ ] `rejectionReason` (text, nullable)
- [ ] `version` (integer, default 0)

**✅ Verificar Tabela UserModerationLog:**
**Navegação**: `Database` → `Tables` → `UserModerationLog`

**Campos que DEVEM existir:**
- [ ] `id` (string, primary key)
- [ ] `userId` (string, foreign key)
- [ ] `moderatorId` (string)
- [ ] `action` (enum: APPROVE, REJECT, SUSPEND, etc.)
- [ ] `previousStatus` (string)
- [ ] `newStatus` (string)
- [ ] `reason` (text, nullable)
- [ ] `metadata` (jsonb)
- [ ] `createdAt` (timestamp)

#### 3. Verificar Enums
**Navegação**: `Database` → `Types`

**✅ Enums que DEVEM existir:**
- [ ] `ApprovalStatus` (PENDING, APPROVED, REJECTED, SUSPENDED)
- [ ] `ModerationAction` (APPROVE, REJECT, SUSPEND, RESET_TO_PENDING)

#### 4. Testar Inserção de Dados
**Navegação**: `Database` → `Tables` → `User` → `Insert row`

**✅ Teste:**
- [ ] Consegue criar usuário com `approvalStatus = 'PENDING'`
- [ ] Campo `version` automaticamente definido como 0
- [ ] Outros campos nullable aceitam NULL

---

## 🛡️ PHASE 2: Supabase RLS Security Layer

### ✅ Verificação de RLS no Supabase

#### 1. Verificar RLS Habilitado
**Navegação**: `Database` → `Tables` → Selecionar cada tabela

**✅ Tabelas que DEVEM ter RLS habilitado:**
- [ ] `User` - RLS: `Enabled`
- [ ] `Client` - RLS: `Enabled`
- [ ] `StrategicPlanning` - RLS: `Enabled`
- [ ] `CommercialProposal` - RLS: `Enabled`
- [ ] `CreditTransaction` - RLS: `Enabled`
- [ ] `UserModerationLog` - RLS: `Enabled`

#### 2. Verificar Funções de Segurança
**Navegação**: `Database` → `Functions`

**✅ Funções que DEVEM existir:**
- [ ] `get_user_id_from_clerk()` - Retorna ID do usuário baseado no JWT
- [ ] `get_current_user_approval_status()` - Retorna status de aprovação
- [ ] `is_current_user_admin()` - Verifica se usuário é admin

#### 3. Verificar Políticas RLS
**Navegação**: `Database` → `Policies`

**✅ Políticas para tabela User:**
- [ ] `restrict_pending_users_policy` (RESTRICTIVE)
- [ ] `allow_users_own_data_policy`
- [ ] `allow_admins_full_access_policy`
- [ ] `allow_superadmin_override_policy`

**✅ Políticas para outras tabelas:**
- [ ] Cada tabela crítica tem pelo menos 1 política
- [ ] Políticas bloqueiam usuários PENDING
- [ ] Admins têm acesso de moderação

#### 4. Testar Políticas RLS

**Teste A: SQL Editor**
**Navegação**: `SQL Editor` → `New query`

```sql
-- Teste 1: Verificar funções funcionando
SELECT get_user_id_from_clerk();
SELECT get_current_user_approval_status();
SELECT is_current_user_admin();

-- Teste 2: Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('User', 'Client', 'StrategicPlanning', 'CommercialProposal', 'UserModerationLog', 'CreditTransaction')
GROUP BY tablename;
```

**✅ Resultados esperados:**
- [ ] Funções executam sem erro
- [ ] Pelo menos 10+ políticas criadas
- [ ] Tabela User tem 4 políticas

---

## 🔗 PHASE 3: Clerk Integration & Webhook Enhancement

### ✅ Verificação no Clerk Dashboard

#### 1. Acesse o Clerk Dashboard
- 🌐 URL: https://dashboard.clerk.com
- 📧 Faça login com sua conta
- 🎯 Selecione o projeto Vortex/Precedent

#### 2. Verificar Configuração de Webhooks
**Navegação**: `Webhooks` (menu lateral)

**✅ Webhook configurado:**
- [ ] URL: `http://localhost:3003/api/webhooks/clerk` (desenvolvimento)
- [ ] Eventos ativos: `user.created`, `user.updated`, `user.deleted`
- [ ] Status: `Active` 
- [ ] Headers customizados (se configurados)

#### 3. Verificar Usuários e Metadata
**Navegação**: `Users` (menu lateral)

**✅ Para cada usuário existente:**
- [ ] `Public metadata` contém `approvalStatus`
- [ ] `Public metadata` contém `dbUserId`
- [ ] Metadata sincronizada com banco

#### 4. Testar Webhook Manualmente
**Navegação**: `Webhooks` → Selecionar webhook → `Testing`

**✅ Teste de webhook:**
- [ ] Consegue enviar evento de teste
- [ ] Webhook responde com status 200
- [ ] Logs mostram processamento correto

### ✅ Verificação no Código da Aplicação

#### 1. Verificar Webhook Atualizado
**Arquivo**: `app/api/webhooks/clerk/route.ts`

**✅ Funcionalidades implementadas:**
- [ ] Import do `approval-system` e `clerk-integration`
- [ ] Debug de ambiente em desenvolvimento
- [ ] Sincronização de metadata no `user.created`
- [ ] Controle de créditos baseado em status
- [ ] Logs de auditoria detalhados
- [ ] Optimistic concurrency control

#### 2. Verificar Utilitários de Integração
**Arquivo**: `utils/clerk-integration.ts`

**✅ Funções implementadas:**
- [ ] `getClerkWebhookUrl()`
- [ ] `getWebhookConfig()`
- [ ] `syncClerkMetadata()`
- [ ] `updateUserApprovalStatus()`
- [ ] `verifyClerkUser()`

---

## 🧪 TESTES PRÁTICOS END-TO-END

### Teste 1: Criação de Usuário Completa

#### Passos:
1. **Registre um novo usuário no Clerk** (use incognito)
   - Acesse: `http://localhost:3003/sign-up`
   - Complete o registro

2. **Verifique no Supabase** (`Database` → `Tables` → `User`)
   - [ ] Novo usuário aparece na tabela
   - [ ] `approvalStatus = 'PENDING'`
   - [ ] `creditBalance = 0`
   - [ ] `version = 0`

3. **Verifique no Clerk** (`Users`)
   - [ ] Usuário aparece na lista
   - [ ] `Public metadata` tem `approvalStatus: 'PENDING'`
   - [ ] `Public metadata` tem `dbUserId`

4. **Verifique Logs** (console da aplicação)
   - [ ] Logs de `[USER_CREATED]`
   - [ ] Logs de `[METADATA_SYNC]`
   - [ ] Logs de auditoria

### Teste 2: Simulação de Aprovação

#### Usando SQL no Supabase:
```sql
-- 1. Encontrar o usuário
SELECT id, email, approvalStatus, creditBalance FROM "User" 
WHERE email = 'SEU_EMAIL_DE_TESTE';

-- 2. Simular aprovação manual
UPDATE "User" 
SET 
  "approvalStatus" = 'APPROVED',
  "approvedAt" = NOW(),
  "approvedBy" = 'admin_test',
  "creditBalance" = 100,
  "version" = "version" + 1
WHERE email = 'SEU_EMAIL_DE_TESTE';

-- 3. Verificar mudança
SELECT id, email, approvalStatus, creditBalance, approvedAt 
FROM "User" 
WHERE email = 'SEU_EMAIL_DE_TESTE';
```

### Teste 3: Verificação de Segurança RLS

#### No SQL Editor do Supabase:
```sql
-- Simular usuário PENDING tentando acessar dados
SET LOCAL role = 'anon';
SET LOCAL request.jwt.claims = '{"sub": "user_pending_123", "public_metadata": {"approvalStatus": "PENDING"}}';

-- Tentar acessar dados (deve ser bloqueado)
SELECT * FROM "Client" LIMIT 5;
SELECT * FROM "StrategicPlanning" LIMIT 5;

-- Simular usuário APPROVED
SET LOCAL request.jwt.claims = '{"sub": "user_approved_123", "public_metadata": {"approvalStatus": "APPROVED"}}';

-- Tentar acessar dados (deve ser permitido)
SELECT * FROM "Client" LIMIT 5;
```

### Teste 4: Webhook Manual

#### Enviar Payload de Teste:
```bash
# Execute no terminal da aplicação
curl -X POST http://localhost:3003/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test_123" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test_signature" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "test_user_manual",
      "email_addresses": [{"email_address": "teste@manual.com", "id": "email_1"}],
      "first_name": "Teste",
      "last_name": "Manual"
    }
  }'
```

---

## 📊 VALIDAÇÃO FINAL

### ✅ Checklist de Validação Completa

#### Database (Supabase)
- [ ] Schema atualizado com campos de aprovação
- [ ] Enums criados corretamente
- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Funções de segurança funcionando
- [ ] Políticas RLS ativas e funcionais

#### Integration (Clerk)
- [ ] Webhook configurado e ativo
- [ ] Metadata sincronizada
- [ ] Eventos processados corretamente
- [ ] Logs de webhook funcionando

#### Application (Código)
- [ ] Webhook atualizado com sistema de aprovação
- [ ] Utilitários de integração implementados
- [ ] Detecção de ambiente funcionando
- [ ] Logs de auditoria operacionais

#### End-to-End
- [ ] Usuário criado via Clerk aparece no Supabase
- [ ] Status de aprovação funciona
- [ ] Segurança RLS protege recursos
- [ ] Créditos controlados por status

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: RLS bloqueia tudo
**Solução**: Verificar se as funções de segurança existem e funcionam

### Problema 2: Webhook não recebe eventos
**Solução**: Verificar URL do webhook no Clerk dashboard

### Problema 3: Metadata não sincroniza
**Solução**: Verificar logs do webhook e chaves de API

### Problema 4: Usuários não aparecem no banco
**Solução**: Verificar se webhook está ativo e processando

---

## 📝 Documentação das Evidências

Após completar os testes, documente:

1. **Screenshots do Supabase**:
   - Schema da tabela User
   - Políticas RLS ativas
   - Funções de segurança

2. **Screenshots do Clerk**:
   - Configuração do webhook
   - Metadata dos usuários
   - Logs de eventos

3. **Logs da Aplicação**:
   - Criação de usuários
   - Sincronização de metadata
   - Processamento de webhooks

Este checklist garante que você verificou todas as implementações das 3 phases do sistema de aprovação! 