const { createClient } = require('@supabase/supabase-js');

async function testSupabaseDirectAccess() {
  try {
    console.log('🧪 TESTE DIRETO SUPABASE (Simulando N8N)');
    console.log('='.repeat(50));
    
    // Configuração usando as credenciais reais
    const supabaseUrl = 'https://yikhktawbwnywlbsnjns.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpa2hrdGF3YndueXdsYnNuam5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODExOTAyMywiZXhwIjoyMDYzNjk1MDIzfQ.bEs66BQMZFUXQx8WePIde6FdEqAiBqHPNH8xZBQlZRQ';
    
    // Cliente com service role (bypass completo)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    
    console.log('✅ Cliente Supabase criado');
    
    console.log('\n📋 1. Testando inserção de cliente...');
    
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .insert({
        id: `test-n8n-${Date.now()}`,
        name: 'Cliente Teste N8N Direto',
        industry: 'Automação',
        contactEmail: 'n8n-teste@email.com',
        richnessScore: 75,
        userId: 'cmbmazoja000909yox6gv567p', // ID do usuário play-felix@hotmail.com
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select();
    
    if (clientError) {
      console.log('❌ Erro ao inserir cliente:', clientError);
      return;
    }
    
    console.log('✅ Cliente inserido:', clientData[0]);
    const clientId = clientData[0].id;
    
    console.log('\n📋 2. Testando inserção de nota...');
    
    const { data: noteData, error: noteError } = await supabase
      .from('ClientNote')
      .insert({
        id: `test-note-${Date.now()}`,
        content: 'Nota criada diretamente via Supabase (simulando N8N)',
        clientId: clientId,
        userId: 'cmbmazoja000909yox6gv567p',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select();
    
    if (noteError) {
      console.log('❌ Erro ao inserir nota:', noteError);
    } else {
      console.log('✅ Nota inserida:', noteData[0]);
    }
    
    console.log('\n📋 3. Testando inserção de planejamento...');
    
    const { data: planningData, error: planningError } = await supabase
      .from('StrategicPlanning')
      .insert({
        id: `test-planning-${Date.now()}`,
        title: 'Planejamento N8N Direto',
        description: 'Criado via teste direto Supabase',
        clientId: clientId,
        userId: 'cmbmazoja000909yox6gv567p',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select();
    
    if (planningError) {
      console.log('❌ Erro ao inserir planejamento:', planningError);
    } else {
      console.log('✅ Planejamento inserido:', planningData[0]);
    }
    
    console.log('\n📋 4. Limpando dados de teste...');
    
    // Limpar na ordem correta
    if (planningData?.[0]) {
      await supabase.from('StrategicPlanning').delete().eq('id', planningData[0].id);
    }
    if (noteData?.[0]) {
      await supabase.from('ClientNote').delete().eq('id', noteData[0].id);
    }
    await supabase.from('Client').delete().eq('id', clientId);
    
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 TESTE SUPABASE DIRETO CONCLUÍDO!');
    console.log('🔑 Use as seguintes configurações no N8N:');
    console.log('   URL: https://yikhktawbwnywlbsnjns.supabase.co');
    console.log('   Key: SERVICE_ROLE_KEY (não a anon key)');
    console.log('   Schema: public');
    
    console.log('\n⚡ IMPORTANTE PARA N8N:');
    console.log('   1. Use a SERVICE_ROLE_KEY (não a anon key)');
    console.log('   2. Configure o schema como "public"');
    console.log('   3. Certifique-se de que RLS está desabilitado (está!)');
    console.log('   4. Use userId válido: cmbmazoja000909yox6gv567p');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📄 Stack:', error.stack);
  }
}

testSupabaseDirectAccess(); 