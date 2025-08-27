-- ==========================================
-- PLAN-010: Sistema de Acesso para PENDING - Módulo de Vendas/Coaching
-- Políticas RLS para permitir acesso de usuários PENDING ao TranscriptionSession
-- ==========================================

-- Habilitar RLS na tabela TranscriptionSession se ainda não estiver habilitado
ALTER TABLE "TranscriptionSession" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- EXCEÇÃO PARA USUÁRIOS PENDING - TranscriptionSession
-- ==========================================

-- Remover políticas restritivas anteriores se existirem
DROP POLICY IF EXISTS "restrict_pending_users_transcription" ON "TranscriptionSession";

-- PLAN-010: Permitir que usuários PENDING criem sessões de transcrição
CREATE POLICY "pending_users_can_create_transcription_sessions" ON "TranscriptionSession"
  FOR INSERT WITH CHECK (
    -- Usuários podem criar suas próprias sessões, independente do status
    "userId" = get_user_id_from_clerk()
  );

-- PLAN-010: Permitir que usuários PENDING vejam suas próprias sessões
CREATE POLICY "pending_users_can_view_own_transcription_sessions" ON "TranscriptionSession"
  FOR SELECT USING (
    CASE
      -- Admins podem ver todas as sessões
      WHEN is_current_user_admin() THEN TRUE
      
      -- Usuários podem ver suas próprias sessões (incluindo PENDING)
      WHEN "userId" = get_user_id_from_clerk() THEN TRUE
      
      ELSE FALSE
    END
  );

-- PLAN-010: Permitir que usuários PENDING atualizem suas próprias sessões
CREATE POLICY "pending_users_can_update_own_transcription_sessions" ON "TranscriptionSession"
  FOR UPDATE USING (
    -- Usuários podem atualizar suas próprias sessões (incluindo PENDING)
    "userId" = get_user_id_from_clerk()
  )
  WITH CHECK (
    -- Garantir que não alterem o userId
    "userId" = get_user_id_from_clerk() AND
    OLD."userId" = NEW."userId"
  );

-- PLAN-010: Permitir soft delete para usuários PENDING em suas próprias sessões
CREATE POLICY "pending_users_can_soft_delete_own_transcription_sessions" ON "TranscriptionSession"
  FOR DELETE USING (
    -- Na verdade usamos UPDATE para soft delete, mas incluímos DELETE caso necessário
    "userId" = get_user_id_from_clerk()
  );

-- ==========================================
-- POLÍTICAS PARA TABELAS RELACIONADAS
-- ==========================================

-- Se houver tabelas relacionadas ao TranscriptionSession que precisem de acesso
-- adicione políticas aqui. Por exemplo:

-- AgentInteraction (se relacionado a sessões de coaching)
DROP POLICY IF EXISTS "restrict_pending_users_agent_interaction" ON "AgentInteraction";

CREATE POLICY "pending_users_can_manage_own_agent_interactions" ON "AgentInteraction"
  FOR ALL USING (
    CASE
      -- Admins têm acesso total
      WHEN is_current_user_admin() THEN TRUE
      
      -- Usuários podem gerenciar suas próprias interações (incluindo PENDING)
      WHEN "userId" = get_user_id_from_clerk() THEN TRUE
      
      ELSE FALSE
    END
  )
  WITH CHECK (
    -- Para INSERT e UPDATE, garantir que é o próprio usuário
    "userId" = get_user_id_from_clerk()
  );

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

-- RESUMO DAS POLÍTICAS IMPLEMENTADAS PARA PLAN-010:
-- 
-- 1. TranscriptionSession:
--    - Usuários PENDING podem CRIAR novas sessões
--    - Usuários PENDING podem VER suas próprias sessões
--    - Usuários PENDING podem ATUALIZAR suas próprias sessões
--    - Usuários PENDING podem fazer SOFT DELETE de suas próprias sessões
--
-- 2. AgentInteraction:
--    - Usuários PENDING podem gerenciar suas próprias interações
--    - Necessário para o funcionamento completo do módulo de coaching
--
-- 3. SEGURANÇA:
--    - Isolamento por usuário mantido (userId = get_user_id_from_clerk())
--    - Admins mantêm acesso total para moderação
--    - Usuários não podem alterar o userId de registros existentes
--
-- 4. IMPORTANTE:
--    - Essas políticas são EXCEÇÕES específicas para o módulo de vendas/coaching
--    - Outras tabelas (Client, StrategicPlanning, etc.) permanecem bloqueadas
--    - O isolamento de dados por usuário é mantido em todas as operações

-- ==========================================
-- SCRIPT DE TESTE
-- ==========================================

-- Para testar as políticas, execute como um usuário PENDING:
-- 1. Criar uma nova TranscriptionSession
-- 2. Listar suas próprias sessões
-- 3. Atualizar uma sessão existente
-- 4. Tentar acessar sessão de outro usuário (deve falhar)
-- 5. Tentar acessar outras tabelas como Client (deve falhar)