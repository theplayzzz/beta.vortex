-- ==========================================
-- 🆕 PLAN-018: Sistema de Aprovação de Usuários  
-- Políticas RLS para implementar controle de acesso baseado em aprovação
-- ==========================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE "UserModerationLog" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FUNÇÕES AUXILIARES PARA SISTEMA DE APROVAÇÃO
-- ==========================================

-- Função para obter o status de aprovação do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_approval_status()
RETURNS TEXT AS $$
DECLARE
  approval_status TEXT;
  user_id_val TEXT;
BEGIN
  -- Obter o userId baseado no clerkId do JWT
  user_id_val := get_user_id_from_clerk();
  
  IF user_id_val IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar o status de aprovação
  SELECT "approvalStatus" INTO approval_status 
  FROM "User" 
  WHERE id = user_id_val;
  
  RETURN approval_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  clerk_id TEXT;
  admin_ids TEXT[];
BEGIN
  -- Extrair clerkId do JWT
  clerk_id := (SELECT auth.jwt() ->> 'sub');
  
  IF clerk_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se está na lista de admins (configurado via env var no app)
  -- Para RLS, assumimos que admin status vem do JWT metadata
  -- Alternativa: manter lista no banco ou usar role específica
  
  -- Por enquanto, verificamos se tem role 'ADMIN' no JWT
  IF (auth.jwt() -> 'public_metadata' ->> 'role') = 'ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar metadata de aprovação status também
  IF (auth.jwt() -> 'public_metadata' ->> 'approvalStatus') = 'ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- POLÍTICAS RESTRITIVAS PRINCIPAIS
-- ==========================================

-- 🔒 POLÍTICA MESTRE: Usuários PENDING têm acesso restrito
-- Esta política é RESTRITIVA e se aplica a TODAS as operações
CREATE POLICY "restrict_pending_users_global" ON "Client" AS RESTRICTIVE
  FOR ALL USING (
    CASE 
      -- Admins têm acesso total
      WHEN is_current_user_admin() THEN TRUE
      
      -- Usuários APPROVED têm acesso normal
      WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
      
      -- Usuários PENDING têm acesso muito limitado
      WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
      
      -- Usuários REJECTED/SUSPENDED não têm acesso
      ELSE FALSE
    END
  );

-- Aplicar política restritiva similar a outras tabelas principais
CREATE POLICY "restrict_pending_users_strategic_planning" ON "StrategicPlanning" AS RESTRICTIVE
  FOR ALL USING (
    CASE 
      WHEN is_current_user_admin() THEN TRUE
      WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
      WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
      ELSE FALSE
    END
  );

CREATE POLICY "restrict_pending_users_commercial_proposal" ON "CommercialProposal" AS RESTRICTIVE
  FOR ALL USING (
    CASE 
      WHEN is_current_user_admin() THEN TRUE
      WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
      WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
      ELSE FALSE
    END
  );

CREATE POLICY "restrict_pending_users_credit_transaction" ON "CreditTransaction" AS RESTRICTIVE
  FOR ALL USING (
    CASE 
      WHEN is_current_user_admin() THEN TRUE
      WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
      -- Usuários PENDING não podem gastar créditos
      WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
      ELSE FALSE
    END
  );

-- ========================================== 
-- POLÍTICAS ESPECÍFICAS PARA USUÁRIOS PENDING
-- ==========================================

-- Usuários PENDING podem apenas visualizar seu próprio perfil
CREATE POLICY "pending_users_own_profile_only" ON "User"
  FOR SELECT USING (
    CASE
      WHEN is_current_user_admin() THEN TRUE
      WHEN id = get_user_id_from_clerk() THEN TRUE
      ELSE FALSE
    END
  );

-- Usuários PENDING podem atualizar apenas dados básicos do próprio perfil
CREATE POLICY "pending_users_limited_profile_update" ON "User"
  FOR UPDATE USING (
    id = get_user_id_from_clerk() AND 
    get_current_user_approval_status() IN ('PENDING', 'APPROVED')
  )
  WITH CHECK (
    id = get_user_id_from_clerk() AND
    -- Não podem alterar campos de aprovação
    OLD."approvalStatus" = NEW."approvalStatus" AND
    OLD."approvedAt" IS NOT DISTINCT FROM NEW."approvedAt" AND
    OLD."approvedBy" IS NOT DISTINCT FROM NEW."approvedBy" AND
    OLD."rejectedAt" IS NOT DISTINCT FROM NEW."rejectedAt" AND
    OLD."rejectedBy" IS NOT DISTINCT FROM NEW."rejectedBy" AND
    OLD."rejectionReason" IS NOT DISTINCT FROM NEW."rejectionReason" AND
    OLD."version" = NEW."version"
  );

-- ==========================================
-- POLÍTICAS PARA MODERAÇÃO (ADMINS)
-- ==========================================

-- Admins podem visualizar todos os usuários para moderação
CREATE POLICY "admins_view_all_users_for_moderation" ON "User"
  FOR SELECT USING (is_current_user_admin());

-- Admins podem atualizar status de aprovação
CREATE POLICY "admins_can_moderate_users" ON "User"
  FOR UPDATE USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ==========================================
-- POLÍTICAS PARA AUDIT TRAIL
-- ==========================================

-- Admins podem visualizar todos os logs de moderação
CREATE POLICY "admins_view_all_moderation_logs" ON "UserModerationLog"
  FOR SELECT USING (is_current_user_admin());

-- Apenas admins podem criar logs de moderação
CREATE POLICY "admins_create_moderation_logs" ON "UserModerationLog"
  FOR INSERT WITH CHECK (is_current_user_admin());

-- Usuários podem ver seus próprios logs de moderação
CREATE POLICY "users_view_own_moderation_logs" ON "UserModerationLog"
  FOR SELECT USING (
    "userId" = get_user_id_from_clerk() OR
    is_current_user_admin()
  );

-- Logs de moderação são imutáveis (não podem ser alterados/deletados)
-- CREATE POLICY "moderation_logs_immutable_update" ON "UserModerationLog"
--   FOR UPDATE USING (FALSE);

-- CREATE POLICY "moderation_logs_immutable_delete" ON "UserModerationLog"
--   FOR DELETE USING (FALSE);

-- ==========================================
-- POLÍTICAS DE EMERGÊNCIA E OVERRIDE
-- ==========================================

-- Política de emergência: Super admin pode fazer qualquer coisa
-- (usar apenas em emergências, configurado via env var específica)
CREATE POLICY "emergency_super_admin_override" ON "User"
  FOR ALL USING (
    (auth.jwt() -> 'public_metadata' ->> 'role') = 'SUPER_ADMIN'
  );

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

-- RESUMO DAS POLÍTICAS IMPLEMENTADAS:
-- 
-- 1. USUÁRIOS PENDING:
--    - Podem ver apenas próprio perfil
--    - Podem atualizar apenas dados básicos próprios
--    - NÃO podem acessar: clientes, planejamentos, propostas, créditos
--
-- 2. USUÁRIOS APPROVED: 
--    - Acesso total aos próprios recursos
--    - Funcionamento normal do sistema
--
-- 3. USUÁRIOS REJECTED/SUSPENDED:
--    - Acesso bloqueado a quase tudo
--    - Apenas visualização limitada do próprio perfil
--
-- 4. ADMINS:
--    - Acesso total para moderação
--    - Podem visualizar e moderar todos os usuários
--    - Podem criar logs de auditoria
--
-- 5. SEGURANÇA:
--    - Políticas RESTRITIVAS aplicadas
--    - Logs de moderação imutáveis
--    - Verificação dupla via JWT + banco
--    - Fallback para bloqueio em caso de dúvida

-- ==========================================
-- ÍNDICES PARA PERFORMANCE DAS POLÍTICAS RLS
-- ==========================================

-- Índices já criados via migração Prisma:
-- - User_approvalStatus_idx
-- - User_approvalStatus_createdAt_idx  
-- - UserModerationLog_userId_idx
-- - UserModerationLog_moderatorId_idx

-- Comentário: Índices adicionais podem ser necessários dependendo do volume
-- de usuários e frequência de consultas de moderação 