# 🗺️ GUIA DE NAVEGAÇÃO - Supabase & Clerk

## 🎯 Como Encontrar e Verificar as Implementações das Phases 1, 2 e 3

---

## 🟢 SUPABASE DASHBOARD

### 🚪 Acesso Inicial
1. **URL**: https://supabase.com/dashboard
2. **Login**: Use suas credenciais
3. **Projeto**: Selecione "Vortex" ou "precedent"

### 📊 PHASE 1: Verificando Database Schema

#### 🔍 **Localização**: `Database` → `Tables`

**✅ O que você deve ver:**

1. **Tabela User** - Clique para expandir
   ```
   📋 Campos NOVOS que devem aparecer:
   - approvalStatus (enum)
   - approvedAt (timestamp)
   - approvedBy (text)
   - rejectedAt (timestamp) 
   - rejectedBy (text)
   - rejectionReason (text)
   - version (integer)
   ```

2. **Tabela UserModerationLog** - Nova tabela
   ```
   📋 Estrutura da tabela:
   - id (string, PK)
   - userId (string, FK)
   - moderatorId (string)
   - action (enum)
   - previousStatus (string)
   - newStatus (string)
   - reason (text)
   - metadata (jsonb)
   - createdAt (timestamp)
   ```

#### 🔍 **Localização**: `Database` → `Types`

**✅ Enums que devem existir:**
- `ApprovalStatus`
- `ModerationAction`

### 🛡️ PHASE 2: Verificando RLS Security

#### 🔍 **Localização**: `Database` → `Functions`

**✅ Funções que devem aparecer:**
- `get_user_id_from_clerk`
- `get_current_user_approval_status`
- `is_current_user_admin`

#### 🔍 **Localização**: `Database` → `Policies`

**✅ Políticas RLS que devem existir:**

**Para tabela User:**
- `restrict_pending_users_policy` (RESTRICTIVE)
- `allow_users_own_data_policy`
- `allow_admins_full_access_policy`
- `allow_superadmin_override_policy`

**Para outras tabelas (Client, StrategicPlanning, etc.):**
- Pelo menos 1 política cada
- Verificar se RLS está "Enabled"

#### 🔍 **Localização**: `SQL Editor`

**🧪 Teste SQL para validar RLS:**
```sql
-- Verificar se funções funcionam
SELECT get_user_id_from_clerk();
SELECT get_current_user_approval_status();
SELECT is_current_user_admin();

-- Contar políticas
SELECT tablename, COUNT(*) as policies
FROM pg_policies 
WHERE tablename IN ('User', 'Client', 'StrategicPlanning')
GROUP BY tablename;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('User', 'Client', 'StrategicPlanning')
AND rowsecurity = true;
```

---

## 🔵 CLERK DASHBOARD

### 🚪 Acesso Inicial
1. **URL**: https://dashboard.clerk.com
2. **Login**: Use suas credenciais Clerk
3. **Projeto**: Selecione seu projeto Vortex

### 🔗 PHASE 3: Verificando Integração

#### 🔍 **Localização**: `Webhooks` (menu lateral esquerdo)

**✅ O que você deve ver:**

1. **Webhook Endpoint**:
   ```
   URL: http://localhost:3003/api/webhooks/clerk
   Status: Active ✅
   Events: user.created, user.updated, user.deleted
   ```

2. **Logs do Webhook**:
   - Clique no webhook → `Logs`
   - Deve mostrar eventos processados
   - Status 200 para sucessos

#### 🔍 **Localização**: `Users` (menu lateral esquerdo)

**✅ Para cada usuário existente:**

1. **Clique no usuário** → `Metadata`
2. **Public Metadata deve conter:**
   ```json
   {
     "approvalStatus": "PENDING" ou "APPROVED",
     "dbUserId": "user_id_do_supabase",
     "role": "USER"
   }
   ```

#### 🔍 **Localização**: `Configure` → `Environment Variables`

**✅ Variáveis que devem estar configuradas:**
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

---

## 🧪 TESTES PRÁTICOS QUE VOCÊ PODE FAZER

### 🔄 Teste 1: Criar Usuário Completo

#### Passo 1: Na Aplicação
1. Abra uma aba incognito
2. Vá para: `http://localhost:3003/sign-up`
3. Registre-se com email de teste

#### Passo 2: No Supabase
1. `Database` → `Tables` → `User`
2. **Procure pelo novo usuário**
3. **Verifique**:
   - `approvalStatus = 'PENDING'`
   - `creditBalance = 0`
   - `version = 0`

#### Passo 3: No Clerk
1. `Users` → Encontre o usuário
2. Clique → `Metadata`
3. **Verifique Public Metadata**:
   - `approvalStatus: 'PENDING'`
   - `dbUserId: 'xxx'`

### 🔄 Teste 2: Simular Aprovação Manual

#### No Supabase SQL Editor:
```sql
-- 1. Encontrar seu usuário de teste
SELECT id, email, approvalStatus, creditBalance 
FROM "User" 
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';

-- 2. Aprovar manualmente
UPDATE "User" 
SET 
  "approvalStatus" = 'APPROVED',
  "approvedAt" = NOW(),
  "approvedBy" = 'admin_manual',
  "creditBalance" = 100,
  "version" = "version" + 1
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';

-- 3. Verificar mudança
SELECT id, email, approvalStatus, creditBalance, approvedAt 
FROM "User" 
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
```

### 🔄 Teste 3: Verificar Segurança RLS

#### No Supabase SQL Editor:
```sql
-- Simular usuário PENDING (deve ser bloqueado)
SET LOCAL role = 'anon';
SET LOCAL request.jwt.claims = '{"sub": "user_pending", "public_metadata": {"approvalStatus": "PENDING"}}';

-- Tentar acessar dados (DEVE FALHAR)
SELECT * FROM "Client" LIMIT 1;

-- Resetar e simular usuário APPROVED (deve funcionar)
RESET ALL;
SET LOCAL role = 'anon';  
SET LOCAL request.jwt.claims = '{"sub": "user_approved", "public_metadata": {"approvalStatus": "APPROVED"}}';

-- Tentar acessar dados (DEVE FUNCIONAR)
SELECT * FROM "Client" LIMIT 1;
```

### 🔄 Teste 4: Webhook Manual

#### No terminal da aplicação:
```bash
curl -X POST http://localhost:3003/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test_manual" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test_sig" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "test_user_curl",
      "email_addresses": [{"email_address": "curl@test.com", "id": "email_1"}],
      "first_name": "Curl",
      "last_name": "Test"
    }
  }'
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO VISUAL

### ✅ Supabase - Database
- [ ] Tabela User tem 7 novos campos de aprovação
- [ ] Tabela UserModerationLog existe
- [ ] Enums ApprovalStatus e ModerationAction existem
- [ ] 6 tabelas têm RLS habilitado
- [ ] 3 funções de segurança existem
- [ ] 11+ políticas RLS ativas

### ✅ Clerk - Integration  
- [ ] Webhook configurado com URL local
- [ ] Eventos user.created, user.updated, user.deleted ativos
- [ ] Usuários têm metadata de approvalStatus
- [ ] Logs de webhook mostram processamento

### ✅ Aplicação - Code
- [ ] Webhook route.ts atualizado
- [ ] Arquivo clerk-integration.ts existe
- [ ] Arquivo approval-system.ts existe
- [ ] Environment variables configuradas

---

## 🚨 TROUBLESHOOTING

### ❌ Não vejo os campos novos na tabela User
**Solução**: Execute a migração Prisma
```bash
npx prisma db push
```

### ❌ RLS está bloqueando tudo
**Solução**: Verifique se as funções de segurança existem no Supabase

### ❌ Webhook não aparece no Clerk
**Solução**: Configure manualmente no dashboard Clerk:
- URL: `http://localhost:3003/api/webhooks/clerk`
- Eventos: `user.created`, `user.updated`, `user.deleted`

### ❌ Metadata não sincroniza
**Solução**: Verifique logs do webhook no console da aplicação

---

## 🎯 RESULTADO ESPERADO

Após seguir este guia, você deve ter **100% de confirmação visual** de que:

1. **✅ Phase 1**: Database schema implementado
2. **✅ Phase 2**: Segurança RLS funcionando  
3. **✅ Phase 3**: Integração Clerk operacional

**🏆 Score Total**: 50/50 (100%) - Sistema pronto para Phase 4! 