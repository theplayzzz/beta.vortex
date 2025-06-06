# 🔍 **GUIA COMPLETO: DIAGNÓSTICO DO SISTEMA DE AUTENTICAÇÃO**

## 📋 **INSTRUÇÕES PARA EXECUÇÃO**

### **1. 🧪 Executar Diagnóstico Automatizado**

```bash
# Executar o script de teste completo
node test-auth-flow.js
```

Este script vai:
- ✅ Verificar configuração das variáveis de ambiente
- 🔗 Testar o endpoint do webhook do Clerk
- 🛡️ Verificar as políticas RLS do Supabase
- 🔄 Simular um fluxo completo de usuário
- 📊 Gerar relatório detalhado

### **2. 🔧 Verificações Manuais Necessárias**

#### **A. Painel do Clerk (clerk.com)**
1. **Faça login no painel do Clerk**
2. **Vá em "Webhooks"**
3. **Verifique se existe um webhook configurado:**
   - URL: `https://SEU_DOMINIO.com/api/webhooks/clerk`
   - Eventos: ✅ `user.created`, `user.updated`, `user.deleted`
   - Secret: Deve corresponder ao `CLERK_WEBHOOK_SECRET` no seu `.env`

#### **B. Painel do Supabase**
1. **SQL Editor → Execute:**
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('User', 'Client', 'StrategicPlanning');

-- Verificar se as políticas existem
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('User', 'Client', 'StrategicPlanning');

-- Verificar função helper
SELECT proname 
FROM pg_proc 
WHERE proname = 'get_user_id_from_clerk';
```

### **3. 🧪 Teste Manual com Conta Real**

#### **Cenário 1: Criar Nova Conta**
1. **Abra uma aba anônima/privada**
2. **Acesse:** `http://localhost:3003/sign-up`
3. **Registre uma conta nova com email real**
4. **Monitore os logs do servidor:** `npm run dev`
5. **Verifique no banco se o usuário foi criado:**
```sql
SELECT id, clerkId, email, creditBalance, createdAt 
FROM "User" 
ORDER BY createdAt DESC 
LIMIT 5;
```

#### **Cenário 2: Testar Acesso Após Registro**
1. **Após registro bem-sucedido, tente acessar:** `http://localhost:3003/clientes`
2. **Observe se:**
   - ❌ **Erro 500/403** = Problema com RLS ou sincronização
   - ✅ **Página carrega** = Sistema funcionando
   - ⏳ **Loading infinito** = Problema de fallback

### **4. 📊 Logs Para Monitorar**

#### **Terminal do Servidor (npm run dev):**
```bash
# Logs esperados durante registro:
[webhook] User created: user_xxxxx
[prisma] INSERT INTO "User" ...
[auth] getCurrentUser: found user
```

#### **Browser Developer Tools:**
```javascript
// Console logs esperados:
// ✅ User authenticated
// ✅ User data loaded
// ❌ Network errors
// ❌ 403 Forbidden
```

### **5. 🚨 Problemas Comuns e Soluções**

#### **A. Webhook Não Funciona**
**Sintomas:** Usuário criado no Clerk, mas não aparece no banco
**Verificações:**
```bash
# 1. Verificar se o servidor está rodando
curl http://localhost:3003/api/webhooks/clerk

# 2. Verificar logs do webhook
tail -f logs/webhook.log  # se existir

# 3. Verificar se a URL é acessível publicamente
# Se localhost, usar ngrok ou similar para teste
npx ngrok http 3003
```

#### **B. RLS Bloqueando Acesso**
**Sintomas:** Usuário no banco, mas aplicação não consegue acessar
**Verificações:**
```sql
-- Testar função RLS manualmente
SELECT get_user_id_from_clerk();

-- Verificar se o JWT está sendo passado corretamente
SELECT auth.jwt();
```

#### **C. Fallback Não Ativa**
**Sintomas:** Usuário no Clerk, não no banco, sistema não cria automaticamente
**Verificações:**
- Verificar se `getCurrentUserOrCreate()` está sendo usado nas páginas
- Verificar se não há erros durante a criação automática

### **6. 🔄 Implementar Sistema de Aprovação (Futuro)**

Baseado no PRD, o sistema deveria ter aprovação de usuários. Para implementar:

#### **A. Adicionar Campo ao Schema**
```prisma
model User {
  // ... campos existentes
  isApproved    Boolean  @default(false)
  approvedAt    DateTime?
  approvedBy    String?  // Admin que aprovou
}
```

#### **B. Modificar Webhook**
```javascript
// Em app/api/webhooks/clerk/route.ts
await prisma.user.create({
  data: {
    // ... dados existentes
    isApproved: false,  // Novo usuário não aprovado
  },
});

// Enviar notificação para admin
await sendAdminNotification(user);
```

#### **C. Adicionar Middleware de Aprovação**
```javascript
// Em middleware.ts - adicionar verificação
if (userId) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { isApproved: true }
  });
  
  if (!user?.isApproved) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }
}
```

### **7. 📋 Checklist de Execução**

#### **Antes de Testar:**
- [ ] Servidor rodando (`npm run dev`)
- [ ] Banco de dados conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado no Clerk (para teste real)

#### **Durante o Teste:**
- [ ] Executar `node test-auth-flow.js`
- [ ] Registrar conta nova via browser
- [ ] Monitorar logs do servidor
- [ ] Verificar dados no banco
- [ ] Testar acesso às funcionalidades

#### **Após o Teste:**
- [ ] Analisar relatório de testes
- [ ] Documentar problemas encontrados
- [ ] Implementar correções necessárias
- [ ] Re-testar fluxo completo

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute o diagnóstico:** `node test-auth-flow.js`
2. **Faça o teste manual** com uma conta real
3. **Documente os resultados** dos testes
4. **Se necessário,** implemente as correções sugeridas
5. **Considere implementar** o sistema de aprovação descrito no PRD

---

## 📞 **Reportar Resultados**

Após executar os testes, compartilhe:
- 📊 **Saída completa** do `test-auth-flow.js`
- 🖥️ **Screenshots** de erros no browser
- 📝 **Logs do servidor** durante o registro
- 🗄️ **Query do banco** mostrando usuários criados

Isso nos ajudará a identificar exatamente onde está o problema! 