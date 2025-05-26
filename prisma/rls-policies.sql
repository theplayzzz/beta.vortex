-- Row Level Security (RLS) Policies for Vortex Vault
-- Este arquivo deve ser executado no Supabase SQL Editor

-- Habilitar RLS em todas as tabelas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StrategicPlanning" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanningTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentInteraction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommercialProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalesArgument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- Função helper para obter o userId baseado no clerkId do JWT
CREATE OR REPLACE FUNCTION get_user_id_from_clerk()
RETURNS TEXT AS $$
DECLARE
  clerk_id TEXT;
  user_id TEXT;
BEGIN
  -- Extrair clerkId do JWT
  clerk_id := (SELECT auth.jwt() ->> 'sub');
  
  IF clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar userId correspondente ao clerkId
  SELECT id INTO user_id FROM "User" WHERE "clerkId" = clerk_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para tabela User
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT USING (id = get_user_id_from_clerk());

CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE USING (id = get_user_id_from_clerk());

CREATE POLICY "Users can insert their own profile" ON "User"
  FOR INSERT WITH CHECK (id = get_user_id_from_clerk());

-- Políticas para tabela Client
CREATE POLICY "Users can view their own clients" ON "Client"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own clients" ON "Client"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own clients" ON "Client"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own clients" ON "Client"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela ClientNote
CREATE POLICY "Users can view notes of their clients" ON "ClientNote"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create notes for their clients" ON "ClientNote"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own notes" ON "ClientNote"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own notes" ON "ClientNote"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela ClientAttachment
CREATE POLICY "Users can view attachments of their clients" ON "ClientAttachment"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can upload attachments for their clients" ON "ClientAttachment"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own attachments" ON "ClientAttachment"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela StrategicPlanning
CREATE POLICY "Users can view their own strategic plannings" ON "StrategicPlanning"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own strategic plannings" ON "StrategicPlanning"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own strategic plannings" ON "StrategicPlanning"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own strategic plannings" ON "StrategicPlanning"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela PlanningTask
CREATE POLICY "Users can view tasks they own or are assigned to" ON "PlanningTask"
  FOR SELECT USING ("ownerId" = get_user_id_from_clerk() OR "assigneeId" = get_user_id_from_clerk());

CREATE POLICY "Users can create tasks they own" ON "PlanningTask"
  FOR INSERT WITH CHECK ("ownerId" = get_user_id_from_clerk());

CREATE POLICY "Users can update tasks they own" ON "PlanningTask"
  FOR UPDATE USING ("ownerId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete tasks they own" ON "PlanningTask"
  FOR DELETE USING ("ownerId" = get_user_id_from_clerk());

-- Políticas para tabela TaskComment
CREATE POLICY "Users can view comments on accessible tasks" ON "TaskComment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "PlanningTask" 
      WHERE id = "TaskComment"."taskId" 
      AND ("ownerId" = get_user_id_from_clerk() OR "assigneeId" = get_user_id_from_clerk())
    )
  );

CREATE POLICY "Users can create comments on accessible tasks" ON "TaskComment"
  FOR INSERT WITH CHECK (
    "userId" = get_user_id_from_clerk() AND
    EXISTS (
      SELECT 1 FROM "PlanningTask" 
      WHERE id = "TaskComment"."taskId" 
      AND ("ownerId" = get_user_id_from_clerk() OR "assigneeId" = get_user_id_from_clerk())
    )
  );

CREATE POLICY "Users can update their own comments" ON "TaskComment"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own comments" ON "TaskComment"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela TaskAttachment
CREATE POLICY "Users can view attachments on accessible tasks" ON "TaskAttachment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "PlanningTask" 
      WHERE id = "TaskAttachment"."taskId" 
      AND ("ownerId" = get_user_id_from_clerk() OR "assigneeId" = get_user_id_from_clerk())
    )
  );

CREATE POLICY "Users can upload attachments on accessible tasks" ON "TaskAttachment"
  FOR INSERT WITH CHECK (
    "userId" = get_user_id_from_clerk() AND
    EXISTS (
      SELECT 1 FROM "PlanningTask" 
      WHERE id = "TaskAttachment"."taskId" 
      AND ("ownerId" = get_user_id_from_clerk() OR "assigneeId" = get_user_id_from_clerk())
    )
  );

CREATE POLICY "Users can delete their own task attachments" ON "TaskAttachment"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela AgentInteraction
CREATE POLICY "Users can view their own agent interactions" ON "AgentInteraction"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own agent interactions" ON "AgentInteraction"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own agent interactions" ON "AgentInteraction"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own agent interactions" ON "AgentInteraction"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela AgentMessage
CREATE POLICY "Users can view messages from their interactions" ON "AgentMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "AgentInteraction" 
      WHERE id = "AgentMessage"."agentInteractionId" 
      AND "userId" = get_user_id_from_clerk()
    )
  );

CREATE POLICY "Users can create messages in their interactions" ON "AgentMessage"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "AgentInteraction" 
      WHERE id = "AgentMessage"."agentInteractionId" 
      AND "userId" = get_user_id_from_clerk()
    )
  );

-- Políticas para tabela CommercialProposal
CREATE POLICY "Users can view their own commercial proposals" ON "CommercialProposal"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own commercial proposals" ON "CommercialProposal"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own commercial proposals" ON "CommercialProposal"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own commercial proposals" ON "CommercialProposal"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela SalesArgument
CREATE POLICY "Users can view their own sales arguments" ON "SalesArgument"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own sales arguments" ON "SalesArgument"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can update their own sales arguments" ON "SalesArgument"
  FOR UPDATE USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can delete their own sales arguments" ON "SalesArgument"
  FOR DELETE USING ("userId" = get_user_id_from_clerk());

-- Políticas para tabela CreditTransaction
CREATE POLICY "Users can view their own credit transactions" ON "CreditTransaction"
  FOR SELECT USING ("userId" = get_user_id_from_clerk());

CREATE POLICY "Users can create their own credit transactions" ON "CreditTransaction"
  FOR INSERT WITH CHECK ("userId" = get_user_id_from_clerk());

-- Não permitir UPDATE ou DELETE em transações de crédito para auditoria
-- CREATE POLICY "Users cannot update credit transactions" ON "CreditTransaction"
--   FOR UPDATE USING (false);

-- CREATE POLICY "Users cannot delete credit transactions" ON "CreditTransaction"
--   FOR DELETE USING (false); 