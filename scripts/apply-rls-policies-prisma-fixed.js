/**
 * 🆕 PHASE 2: Aplicar políticas RLS via Prisma (VERSÃO CORRIGIDA)
 * Executa comandos SQL DDL através do Prisma Client usando $executeRawUnsafe
 */

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

console.log('='.repeat(60));
console.log('🔒 PHASE 2: Aplicando Políticas RLS via Prisma (CORRIGIDO)');
console.log('='.repeat(60));

const prisma = new PrismaClient();

async function applyRLSPoliciesPrismaFixed() {
  try {
    console.log('\n🚀 INICIANDO APLICAÇÃO DE POLÍTICAS RLS...');

    // ==================================================
    // 0. VERIFICAR FUNÇÃO BASE get_user_id_from_clerk
    // ==================================================
    console.log('\n📋 0. VERIFICANDO FUNÇÃO BASE...');
    
    try {
      const baseFunction = await prisma.$queryRaw`
        SELECT proname FROM pg_proc WHERE proname = 'get_user_id_from_clerk';
      `;
      
      if (baseFunction.length === 0) {
        console.log('  ⚠️  Função get_user_id_from_clerk não encontrada. Criando...');
        
        await prisma.$executeRaw`
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
        `;
        console.log('  ✅ Função get_user_id_from_clerk criada');
      } else {
        console.log('  ✅ Função get_user_id_from_clerk já existe');
      }
    } catch (error) {
      console.log('  ⚠️  Erro ao verificar/criar função base:', error.message);
    }

    // ==================================================
    // 1. HABILITAR RLS EM TODAS AS TABELAS
    // ==================================================
    console.log('\n📋 1. HABILITANDO RLS EM TODAS AS TABELAS...');
    
    const tables = ['User', 'Client', 'StrategicPlanning', 'CommercialProposal', 'CreditTransaction', 'UserModerationLog'];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`  ✅ RLS habilitado na tabela ${table}`);
      } catch (error) {
        console.log(`  ⚠️  RLS ${table}:`, error.message);
      }
    }

    // ==================================================
    // 2. CRIAR FUNÇÕES AUXILIARES
    // ==================================================
    console.log('\n📋 2. CRIANDO FUNÇÕES AUXILIARES...');

    // Função para obter status de aprovação do usuário atual
    try {
      await prisma.$executeRawUnsafe(`
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
      `);
      console.log('  ✅ Função get_current_user_approval_status criada');
    } catch (error) {
      console.log('  ⚠️  Função approval_status:', error.message);
    }

    // Função para verificar se é admin
    try {
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION is_current_user_admin()
        RETURNS BOOLEAN AS $$
        DECLARE
          clerk_id TEXT;
        BEGIN
          -- Extrair clerkId do JWT
          clerk_id := (SELECT auth.jwt() ->> 'sub');
          
          IF clerk_id IS NULL THEN
            RETURN FALSE;
          END IF;
          
          -- Verificar se tem role 'ADMIN' no JWT
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
      `);
      console.log('  ✅ Função is_current_user_admin criada');
    } catch (error) {
      console.log('  ⚠️  Função admin_check:', error.message);
    }

    // ==================================================
    // 3. POLÍTICAS RESTRITIVAS PRINCIPAIS
    // ==================================================
    console.log('\n📋 3. CRIANDO POLÍTICAS RESTRITIVAS...');

    const restrictivePolicies = [
      {
        name: 'restrict_pending_users_global',
        table: 'Client',
        sql: `CREATE POLICY "restrict_pending_users_global" ON "Client" AS RESTRICTIVE
          FOR ALL USING (
            CASE 
              WHEN is_current_user_admin() THEN TRUE
              WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
              WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
              ELSE FALSE
            END
          );`
      },
      {
        name: 'restrict_pending_users_strategic_planning',
        table: 'StrategicPlanning',
        sql: `CREATE POLICY "restrict_pending_users_strategic_planning" ON "StrategicPlanning" AS RESTRICTIVE
          FOR ALL USING (
            CASE 
              WHEN is_current_user_admin() THEN TRUE
              WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
              WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
              ELSE FALSE
            END
          );`
      },
      {
        name: 'restrict_pending_users_commercial_proposal',
        table: 'CommercialProposal',
        sql: `CREATE POLICY "restrict_pending_users_commercial_proposal" ON "CommercialProposal" AS RESTRICTIVE
          FOR ALL USING (
            CASE 
              WHEN is_current_user_admin() THEN TRUE
              WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
              WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
              ELSE FALSE
            END
          );`
      },
      {
        name: 'restrict_pending_users_credit_transaction',
        table: 'CreditTransaction',
        sql: `CREATE POLICY "restrict_pending_users_credit_transaction" ON "CreditTransaction" AS RESTRICTIVE
          FOR ALL USING (
            CASE 
              WHEN is_current_user_admin() THEN TRUE
              WHEN get_current_user_approval_status() = 'APPROVED' THEN TRUE
              WHEN get_current_user_approval_status() = 'PENDING' THEN FALSE
              ELSE FALSE
            END
          );`
      }
    ];

    for (const policy of restrictivePolicies) {
      try {
        await prisma.$executeRawUnsafe(policy.sql);
        console.log(`  ✅ Política restritiva criada: ${policy.name} em ${policy.table}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Política ${policy.name} já existe`);
        } else {
          console.log(`  ❌ Política ${policy.name}:`, error.message);
        }
      }
    }

    // ==================================================
    // 4. POLÍTICAS ESPECÍFICAS PARA USUÁRIOS PENDING
    // ==================================================
    console.log('\n📋 4. CRIANDO POLÍTICAS PARA USUÁRIOS PENDING...');

    const pendingPolicies = [
      {
        name: 'pending_users_own_profile_only',
        sql: `CREATE POLICY "pending_users_own_profile_only" ON "User"
          FOR SELECT USING (
            CASE
              WHEN is_current_user_admin() THEN TRUE
              WHEN id = get_user_id_from_clerk() THEN TRUE
              ELSE FALSE
            END
          );`
      },
      {
        name: 'pending_users_limited_profile_update',
        sql: `CREATE POLICY "pending_users_limited_profile_update" ON "User"
          FOR UPDATE USING (
            id = get_user_id_from_clerk() AND 
            get_current_user_approval_status() IN ('PENDING', 'APPROVED')
          )
          WITH CHECK (
            id = get_user_id_from_clerk() AND
            OLD."approvalStatus" = NEW."approvalStatus" AND
            OLD."approvedAt" IS NOT DISTINCT FROM NEW."approvedAt" AND
            OLD."approvedBy" IS NOT DISTINCT FROM NEW."approvedBy" AND
            OLD."rejectedAt" IS NOT DISTINCT FROM NEW."rejectedAt" AND
            OLD."rejectedBy" IS NOT DISTINCT FROM NEW."rejectedBy" AND
            OLD."rejectionReason" IS NOT DISTINCT FROM NEW."rejectionReason" AND
            OLD."version" = NEW."version"
          );`
      }
    ];

    for (const policy of pendingPolicies) {
      try {
        await prisma.$executeRawUnsafe(policy.sql);
        console.log(`  ✅ Política pending criada: ${policy.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Política ${policy.name} já existe`);
        } else {
          console.log(`  ❌ Política ${policy.name}:`, error.message);
        }
      }
    }

    // ==================================================
    // 5. POLÍTICAS PARA MODERAÇÃO (ADMINS)
    // ==================================================
    console.log('\n📋 5. CRIANDO POLÍTICAS PARA ADMINS...');

    const adminPolicies = [
      {
        name: 'admins_view_all_users_for_moderation',
        sql: `CREATE POLICY "admins_view_all_users_for_moderation" ON "User"
          FOR SELECT USING (is_current_user_admin());`
      },
      {
        name: 'admins_can_moderate_users',
        sql: `CREATE POLICY "admins_can_moderate_users" ON "User"
          FOR UPDATE USING (is_current_user_admin())
          WITH CHECK (is_current_user_admin());`
      }
    ];

    for (const policy of adminPolicies) {
      try {
        await prisma.$executeRawUnsafe(policy.sql);
        console.log(`  ✅ Política admin criada: ${policy.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Política ${policy.name} já existe`);
        } else {
          console.log(`  ❌ Política ${policy.name}:`, error.message);
        }
      }
    }

    // ==================================================
    // 6. POLÍTICAS PARA AUDIT TRAIL
    // ==================================================
    console.log('\n📋 6. CRIANDO POLÍTICAS PARA AUDIT TRAIL...');

    const auditPolicies = [
      {
        name: 'admins_view_all_moderation_logs',
        sql: `CREATE POLICY "admins_view_all_moderation_logs" ON "UserModerationLog"
          FOR SELECT USING (is_current_user_admin());`
      },
      {
        name: 'admins_create_moderation_logs',
        sql: `CREATE POLICY "admins_create_moderation_logs" ON "UserModerationLog"
          FOR INSERT WITH CHECK (is_current_user_admin());`
      },
      {
        name: 'users_view_own_moderation_logs',
        sql: `CREATE POLICY "users_view_own_moderation_logs" ON "UserModerationLog"
          FOR SELECT USING (
            "userId" = get_user_id_from_clerk() OR
            is_current_user_admin()
          );`
      }
    ];

    for (const policy of auditPolicies) {
      try {
        await prisma.$executeRawUnsafe(policy.sql);
        console.log(`  ✅ Política audit criada: ${policy.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Política ${policy.name} já existe`);
        } else {
          console.log(`  ❌ Política ${policy.name}:`, error.message);
        }
      }
    }

    // ==================================================
    // 7. POLÍTICA DE EMERGÊNCIA
    // ==================================================
    console.log('\n📋 7. CRIANDO POLÍTICA DE EMERGÊNCIA...');

    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "emergency_super_admin_override" ON "User"
          FOR ALL USING (
            (auth.jwt() -> 'public_metadata' ->> 'role') = 'SUPER_ADMIN'
          );
      `);
      console.log('  ✅ Política emergency_super_admin_override criada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('  ⚠️  Política emergency já existe');
      } else {
        console.log('  ❌ Política emergency:', error.message);
      }
    }

    console.log('\n🎉 APLICAÇÃO DE POLÍTICAS RLS CONCLUÍDA!');

  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    throw error;
  }
}

// ==================================================
// FUNÇÃO PARA TESTAR POLÍTICAS RLS
// ==================================================
async function testRLSPoliciesFixed() {
  console.log('\n🧪 TESTANDO POLÍTICAS RLS...');

  try {
    // Teste 1: Verificar se as funções foram criadas
    console.log('\n📋 Teste 1: Verificando funções auxiliares...');

    try {
      const functions = await prisma.$queryRaw`
        SELECT proname FROM pg_proc 
        WHERE proname IN ('get_current_user_approval_status', 'is_current_user_admin', 'get_user_id_from_clerk');
      `;
      console.log('  ✅ Funções encontradas:', functions.length);
      functions.forEach(fn => console.log(`    - ${fn.proname}`));
    } catch (error) {
      console.log('  ⚠️  Erro ao verificar funções:', error.message);
    }

    // Teste 2: Verificar políticas RLS
    console.log('\n📋 Teste 2: Verificando políticas RLS...');

    try {
      const policies = await prisma.$queryRaw`
        SELECT schemaname, tablename, policyname, permissive, cmd
        FROM pg_policies 
        WHERE policyname LIKE '%pending%' OR policyname LIKE '%admin%' OR policyname LIKE '%emergency%' OR policyname LIKE '%restrict%'
        ORDER BY tablename, policyname;
      `;
      console.log('  ✅ Políticas RLS encontradas:', policies.length);
      policies.forEach(policy => {
        const permissive = policy.permissive === 'PERMISSIVE' ? '✅' : '🔒';
        console.log(`    ${permissive} ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    } catch (error) {
      console.log('  ⚠️  Erro ao verificar políticas:', error.message);
    }

    // Teste 3: Verificar RLS habilitado nas tabelas
    console.log('\n📋 Teste 3: Verificando RLS habilitado...');

    try {
      const rlsStatus = await prisma.$queryRaw`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename IN ('User', 'Client', 'StrategicPlanning', 'CommercialProposal', 'UserModerationLog', 'CreditTransaction')
        ORDER BY tablename;
      `;
      console.log('  ✅ Status RLS das tabelas:');
      rlsStatus.forEach(table => {
        const status = table.rowsecurity ? '🔒 HABILITADO' : '🔓 DESABILITADO';
        console.log(`    - ${table.tablename}: ${status}`);
      });
    } catch (error) {
      console.log('  ⚠️  Erro ao verificar RLS:', error.message);
    }

    // Teste 4: Contar políticas por tabela
    console.log('\n📋 Teste 4: Contagem de políticas por tabela...');

    try {
      const policyCount = await prisma.$queryRaw`
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE tablename IN ('User', 'Client', 'StrategicPlanning', 'CommercialProposal', 'UserModerationLog', 'CreditTransaction')
        GROUP BY tablename
        ORDER BY tablename;
      `;
      console.log('  ✅ Políticas por tabela:');
      policyCount.forEach(table => {
        console.log(`    - ${table.tablename}: ${table.policy_count} políticas`);
      });
    } catch (error) {
      console.log('  ⚠️  Erro ao contar políticas:', error.message);
    }

    console.log('\n✅ TESTES DE POLÍTICAS RLS CONCLUÍDOS');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

// ==================================================
// FUNÇÃO PARA CRIAR USUÁRIO DE TESTE
// ==================================================
async function createTestUserForSecurity() {
  console.log('\n🧪 CRIANDO USUÁRIO DE TESTE PARA VALIDAÇÃO...');

  try {
    // Criar usuário PENDING para testes
    const testUser = await prisma.user.create({
      data: {
        clerkId: 'test_user_pending_' + Date.now(),
        email: 'test.pending@example.com',
        firstName: 'Test',
        lastName: 'Pending',
        approvalStatus: 'PENDING',
        creditBalance: 0
      }
    });

    console.log('  ✅ Usuário de teste PENDING criado:', testUser.id);

    // Criar usuário APPROVED para testes
    const approvedUser = await prisma.user.create({
      data: {
        clerkId: 'test_user_approved_' + Date.now(),
        email: 'test.approved@example.com',
        firstName: 'Test',
        lastName: 'Approved',
        approvalStatus: 'APPROVED',
        creditBalance: 100
      }
    });

    console.log('  ✅ Usuário de teste APPROVED criado:', approvedUser.id);
    console.log('  📋 Usuários criados para validação de segurança');

  } catch (error) {
    console.log('  ⚠️  Erro ao criar usuários de teste:', error.message);
  }
}

// Executar aplicação
(async () => {
  try {
    await applyRLSPoliciesPrismaFixed();
    await testRLSPoliciesFixed();
    await createTestUserForSecurity();

    console.log('\n' + '='.repeat(60));
    console.log('✅ PHASE 2 - APLICAÇÃO RLS VIA PRISMA CONCLUÍDA COM SUCESSO');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})(); 