---
id: plan-018
title: Sistema de Aprovação de Usuários - Estratégia Híbrida Clerk + Supabase RLS + Prisma
createdAt: 2025-06-06
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar um sistema robusto de aprovação manual de usuários utilizando abordagem híbrida com Clerk para autenticação, Supabase RLS para segurança granular, e Prisma para gerenciamento de dados. O sistema deve funcionar perfeitamente tanto em ambiente local (com IP aberto) quanto em produção na Vercel, com foco em aprovação manual via interface administrativa.

## ✅ Functional Requirements

### Sistema de Aprovação Manual
- ✅ Usuários criados com status PENDING por padrão
- ✅ Sistema de aprovação/rejeição manual por administradores
- ✅ Estados: PENDING, APPROVED, REJECTED, SUSPENDED
- ✅ Audit trail completo (quem aprovou/rejeitou, quando, motivo)
- ✅ Sincronização automática entre Clerk metadata e banco Prisma
- ✅ Interface administrativa via Clerk dashboard ou Supabase interface

### Controle de Acesso
- ✅ Usuários PENDING têm acesso limitado (só próprio perfil)
- ✅ Usuários APPROVED têm acesso completo aos recursos
- ✅ Usuários REJECTED são banidos automaticamente no Clerk
- ✅ Créditos só liberados após aprovação manual

### Interface Administrativa
- ✅ Dashboard para visualizar usuários pendentes
- ✅ Ações manuais de aprovação/rejeição com motivo obrigatório
- ✅ Histórico de moderação com auditoria completa
- ✅ Notificações para novos usuários pendentes

## ⚙️ Non-Functional Requirements

### Performance
- ✅ RLS policies otimizadas com verificação por JWT claims
- ✅ Batch operations para aprovação em massa
- ✅ Optimistic concurrency control com campo version
- ✅ Caching de metadata do Clerk no cliente

### Security
- ✅ Row Level Security (RLS) restritivo no Supabase
- ✅ Dupla verificação: Clerk metadata + Supabase policies
- ✅ JWT claims sincronizados para verificação sem DB query
- ✅ Audit trail imutável para compliance

### Scalability
- ✅ Sistema baseado em eventos (webhooks)
- ✅ Middleware otimizado para redirecionamentos
- ✅ Políticas RLS específicas por role para performance
- ✅ Suporte a múltiplos ambientes (dev, staging, prod)

### Environment Management
- ✅ Configuração consistente entre ambiente local e Vercel
- ✅ Variáveis de ambiente específicas por ambiente
- ✅ URLs dinâmicas baseadas em VERCEL_URL vs localhost
- ✅ Webhooks configurados para ambos os ambientes

## 📚 Guidelines & Packages

### Packages Obrigatórios
- ✅ `@clerk/nextjs` (latest) - Autenticação e gerenciamento de usuários
- ✅ `@prisma/client` (latest) - ORM para banco de dados
- ✅ `@supabase/supabase-js` (latest) - Cliente Supabase para RLS
- ✅ `svix` (latest) - Verificação de webhooks Clerk

### Convenções de Código
- ✅ TypeScript strict mode habilitado
- ✅ Schemas Prisma com enums para status
- ✅ Nomenclatura consistente para policies RLS
- ✅ Error handling padronizado com códigos específicos
- ✅ Logging estruturado para auditoria

### Environment Configuration
- ✅ Uso de `VERCEL_ENV` para detectar ambiente
- ✅ `VERCEL_URL` para URLs dinâmicas em produção
- ✅ `NEXT_PUBLIC_APP_URL` para desenvolvimento local
- ✅ Webhook URLs configuradas dinamicamente por ambiente

### Documentação e Validação
- ✅ Cada phase deve ter documentação de conclusão em `/concluido/`
- ✅ Testes automáticos e manuais obrigatórios por phase
- ✅ Critérios de aceitação claros para prosseguir
- ✅ Evidências de funcionamento documentadas

## 🔐 Threat Model

### Ameaças de Segurança Identificadas

#### 1. Bypass de Aprovação
- **Risco**: Usuário contornar sistema de aprovação
- **Mitigação**: RLS restritivo + verificação dupla (Clerk + Supabase)
- **Impacto**: Alto

#### 2. Privilege Escalation
- **Risco**: Usuário PENDING acessar recursos de APPROVED
- **Mitigação**: Políticas RLS baseadas em JWT claims + middleware
- **Impacto**: Alto

#### 3. Race Conditions
- **Risco**: Aprovação simultânea causando inconsistência
- **Mitigação**: Optimistic concurrency control com campo version
- **Impacto**: Médio

#### 4. Webhook Spoofing
- **Risco**: Atacante enviar webhooks falsos
- **Mitigação**: Verificação de assinatura SVIX + whitelist IPs
- **Impacto**: Alto

#### 5. Environment Variable Exposure
- **Risco**: Vazamento de chaves em diferentes ambientes
- **Mitigação**: Uso correto de NEXT_PUBLIC_ prefix + Vercel env management
- **Impacto**: Crítico

#### 6. URL/Domain Confusion
- **Risco**: Webhooks direcionados para ambiente errado
- **Mitigação**: Configuração dinâmica baseada em VERCEL_ENV
- **Impacto**: Médio

## 🔢 Execution Plan

### Phase 1: Database Schema & Environment Setup
**Objetivo**: Configurar base de dados e ambientes

#### Tarefas:
1. **Atualizar schema Prisma com campos de aprovação**
   ```prisma
   model User {
     approvalStatus  ApprovalStatus @default(PENDING)
     approvedAt      DateTime?
     approvedBy      String?
     rejectedAt      DateTime?
     rejectedBy      String?
     rejectionReason String?
     version         Int @default(0)
   }
   
   enum ApprovalStatus {
     PENDING, APPROVED, REJECTED, SUSPENDED
   }
   ```

2. **Configurar variáveis de ambiente dinâmicas**
   ```bash
   # .env.local para desenvolvimento
   NEXT_PUBLIC_APP_URL=http://localhost:3003
   WEBHOOK_URL=http://localhost:3003/api/webhooks/clerk
   
   # Vercel environment variables
   NEXT_PUBLIC_APP_URL=${VERCEL_URL ? `https://${VERCEL_URL}` : 'http://localhost:3003'}
   WEBHOOK_URL=${VERCEL_URL ? `https://${VERCEL_URL}/api/webhooks/clerk` : 'http://localhost:3003/api/webhooks/clerk'}
   ```

3. **Executar migração e atualizar RLS policies**

#### Testes Automáticos:
- [ ] Migration executa sem erros
- [ ] Schema reflete os novos campos
- [ ] Environment variables carregam corretamente

#### Testes Manuais:
- [ ] Verificar conexão com banco local e produção
- [ ] Confirmar que URLs são resolvidas corretamente por ambiente
- [ ] Validar que migrações funcionam em ambos os ambientes

#### Critérios de Conclusão:
- [ ] Schema atualizado em dev e prod
- [ ] Environment variables configuradas
- [ ] Documentação criada em `/concluido/phase-1-database-setup.md`

---

### Phase 2: Supabase RLS Security Layer
**Objetivo**: Implementar segurança granular com RLS

#### Tarefas:
1. **Criar políticas RLS restritivas**
   ```sql
   -- Política principal de aprovação
   CREATE POLICY "restrict_pending_users" ON users AS RESTRICTIVE
   TO authenticated USING (
     CASE 
       WHEN (auth.jwt() -> 'public_metadata' ->> 'approvalStatus') = 'APPROVED' THEN true
       WHEN (auth.jwt() -> 'public_metadata' ->> 'role') = 'ADMIN' THEN true
       ELSE false
     END
   );
   ```

2. **Implementar políticas granulares por recurso**
   - Usuários PENDING: acesso limitado ao próprio perfil
   - Usuários APPROVED: acesso completo
   - Admins: acesso total para moderação

3. **Otimizar performance com índices específicos**

#### Testes Automáticos:
- [ ] RLS policies aplicadas sem erro
- [ ] Queries de teste validam restrições
- [ ] Performance benchmarks dentro do esperado

#### Testes Manuais:
- [ ] Usuário PENDING não acessa recursos proibidos
- [ ] Usuário APPROVED acessa recursos permitidos
- [ ] Admin consegue moderar usuários
- [ ] Tentativas de bypass falham adequadamente

#### Critérios de Conclusão:
- [ ] Todas as policies RLS implementadas e testadas
- [ ] Testes de segurança passando
- [ ] Documentação criada em `/concluido/phase-2-rls-security.md`

---

### Phase 3: Clerk Integration & Webhook Enhancement
**Objetivo**: Sincronizar Clerk com sistema de aprovação

#### Tarefas:
1. **Atualizar webhook do Clerk para sincronização**
   ```typescript
   // Criar usuário PENDING + sync metadata
   await clerkClient.users.updateUserMetadata(clerkId, {
     publicMetadata: { approvalStatus: 'PENDING', dbUserId: user.id }
   });
   ```

2. **Implementar detecção dinâmica de ambiente**
   ```typescript
   const getBaseUrl = () => {
     if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
     if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
     return 'http://localhost:3003';
   };
   ```

3. **Configurar webhooks para múltiplos ambientes no painel Clerk**

#### Testes Automáticos:
- [ ] Webhook recebe e processa eventos corretamente
- [ ] Metadata sincronizada entre Clerk e banco
- [ ] Verificação de assinatura SVIX funcionando

#### Testes Manuais:
- [ ] Registrar novo usuário e verificar status PENDING
- [ ] Verificar sincronização de metadata
- [ ] Testar webhook em ambiente local e produção
- [ ] Validar detecção de ambiente

#### Critérios de Conclusão:
- [ ] Webhook funcionando em todos os ambientes
- [ ] Sincronização Clerk-DB operacional
- [ ] Documentação criada em `/concluido/phase-3-clerk-integration.md`

---

### Phase 4: Admin Dashboard & Manual Approval System
**Objetivo**: Interface para aprovação manual de usuários

#### Tarefas:
1. **Criar interface de moderação**
   - Lista de usuários pendentes
   - Ações de aprovação/rejeição com motivo obrigatório
   - Histórico de moderação

2. **Implementar API de aprovação com transações**
   ```typescript
   await prisma.$transaction([
     // Update user status
     // Update Clerk metadata  
     // Audit log entry
   ]);
   ```

3. **Sistema de notificações para admins**

#### Testes Automáticos:
- [ ] APIs de aprovação/rejeição funcionam
- [ ] Transações mantêm consistência
- [ ] Logs de auditoria são criados

#### Testes Manuais:
- [ ] Dashboard carrega usuários pendentes
- [ ] Aprovação manual funciona end-to-end
- [ ] Rejeição manual funciona end-to-end
- [ ] Histórico de moderação é registrado
- [ ] Motivos obrigatórios são validados

#### Critérios de Conclusão:
- [ ] Interface administrativa funcional
- [ ] Fluxo de aprovação manual completo
- [ ] Documentação criada em `/concluido/phase-4-admin-dashboard.md`

---

### Phase 5: Middleware & Route Protection
**Objetivo**: Proteger rotas baseado no status de aprovação

#### Tarefas:
1. **Implementar middleware de redirecionamento**
   ```typescript
   if (sessionClaims?.public_metadata?.approvalStatus === 'PENDING') {
     return NextResponse.redirect('/pending-approval');
   }
   ```

2. **Criar páginas de estado**
   - `/pending-approval` - Aguardando aprovação
   - `/account-rejected` - Conta rejeitada
   - `/admin/moderate` - Dashboard administrativo

3. **Implementar fallback graceful para getCurrentUserOrCreate**

#### Testes Automáticos:
- [ ] Middleware redireciona corretamente
- [ ] Rotas protegidas bloqueiam acesso não autorizado
- [ ] Fallbacks funcionam adequadamente

#### Testes Manuais:
- [ ] Usuário PENDING é redirecionado para página correta
- [ ] Usuário REJECTED não consegue acessar sistema
- [ ] Usuário APPROVED navega livremente
- [ ] Páginas de estado são informativas e funcionais

#### Critérios de Conclusão:
- [ ] Proteção de rotas implementada
- [ ] UX para diferentes estados funcionando
- [ ] Documentação criada em `/concluido/phase-5-route-protection.md`

---

### Phase 6: Environment-Specific Configuration
**Objetivo**: Garantir funcionamento em todos os ambientes

#### Tarefas:
1. **Configurar Vercel environments**
   ```bash
   vercel env add CLERK_WEBHOOK_SECRET production
   vercel env add CLERK_WEBHOOK_SECRET preview  
   vercel env add CLERK_WEBHOOK_SECRET development
   ```

2. **Testar webhook em todos os ambientes**
   - Desenvolvimento local com ngrok/tunneling
   - Preview deployments
   - Produção

3. **Implementar health checks para webhooks**

#### Testes Automáticos:
- [ ] Health checks respondem em todos os ambientes
- [ ] Environment variables carregam corretamente
- [ ] Detecção de ambiente funciona

#### Testes Manuais:
- [ ] Webhook funciona em desenvolvimento local
- [ ] Webhook funciona em preview deployment
- [ ] Webhook funciona em produção
- [ ] URLs são resolvidas corretamente em cada ambiente

#### Critérios de Conclusão:
- [ ] Sistema funcional em todos os ambientes
- [ ] Configurações específicas por ambiente testadas
- [ ] Documentação criada em `/concluido/phase-6-environment-config.md`

---

### Phase 7: Testing & Validation
**Objetivo**: Validação completa do sistema

#### Tarefas:
1. **Testes de integração para fluxo completo**
2. **Testes de segurança para bypass attempts**
3. **Load testing para RLS policies**
4. **Validação de consistência entre ambientes**

#### Testes Automáticos:
- [ ] Suite completa de testes end-to-end
- [ ] Testes de segurança automatizados
- [ ] Performance tests dentro dos benchmarks

#### Testes Manuais:
- [ ] Fluxo completo: registro → pending → aprovação → acesso
- [ ] Fluxo completo: registro → pending → rejeição → bloqueio
- [ ] Tentativas de bypass de segurança
- [ ] Consistência entre ambientes validada

#### Critérios de Conclusão:
- [ ] Todos os testes passando
- [ ] Sistema validado para produção
- [ ] Documentação criada em `/concluido/phase-7-testing-validation.md`

---

### Phase 8: Monitoring & Documentation
**Objetivo**: Sistema em produção com monitoramento

#### Tarefas:
1. **Logging estruturado para auditoria**
2. **Métricas de aprovação/rejeição**
3. **Alertas para falhas de webhook**
4. **Documentação completa do sistema**

#### Testes Automáticos:
- [ ] Logs são gerados corretamente
- [ ] Métricas são coletadas
- [ ] Alertas funcionam

#### Testes Manuais:
- [ ] Dashboard de monitoramento acessível
- [ ] Documentação é clara e completa
- [ ] Runbook funciona para operações

#### Critérios de Conclusão:
- [ ] Sistema monitorado e documentado
- [ ] Operações funcionais
- [ ] Documentação criada em `/concluido/phase-8-monitoring-docs.md`

---

## 📋 Environment Configuration Checklist

### Local Development
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3003`
- [ ] Clerk webhook URL: `http://localhost:3003/api/webhooks/clerk`
- [ ] ngrok/tunneling para testes de webhook external
- [ ] `.env.local` configurado corretamente

### Vercel Production
- [ ] `VERCEL_URL` usado automaticamente para webhooks
- [ ] Clerk webhook URL: `https://${VERCEL_URL}/api/webhooks/clerk`
- [ ] Todas as environment variables configuradas
- [ ] Domain custom configurado se aplicável

### Webhook Security
- [ ] `CLERK_WEBHOOK_SECRET` diferente por ambiente
- [ ] Verificação de assinatura SVIX implementada
- [ ] Rate limiting no endpoint de webhook
- [ ] Logging de tentativas de webhook

## 📁 Estrutura de Documentação

### Pasta `/concluido/`
Cada phase concluída deve ter documentação em:
- `/concluido/phase-X-nome-da-fase.md`

### Template de Documentação por Phase:
```markdown
# Phase X: Nome da Fase

## ✅ Tarefas Concluídas
- [x] Tarefa 1
- [x] Tarefa 2

## 🧪 Testes Realizados
### Automáticos
- [x] Teste A - Status: PASSOU
- [x] Teste B - Status: PASSOU

### Manuais  
- [x] Teste Manual A - Status: PASSOU
- [x] Teste Manual B - Status: PASSOU

## 📸 Evidências
- Screenshots da interface
- Logs de teste
- Métricas de performance

## 🔍 Problemas Encontrados
- Problema X - Resolução Y

## ✅ Critérios de Aceitação
- [x] Critério 1 - Atendido
- [x] Critério 2 - Atendido

## ➡️ Próximos Passos
- Recomendações para próxima phase