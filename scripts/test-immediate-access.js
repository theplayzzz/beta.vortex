#!/usr/bin/env node

const { createClerkClient } = require('@clerk/backend');

async function testImmediateAccess() {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY || 'sk_test_Hft6sPddyXw0Bfw7vaYJYQlKnr07dukEc6LIkeuG5O';
  const userId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB';
  
  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const user = await clerk.users.getUser(userId);
    
    console.log('🔍 TESTE DE ACESSO IMEDIATO');
    console.log('='.repeat(50));
    console.log('ID:', user.id);
    console.log('Email:', user.emailAddresses[0]?.emailAddress);
    console.log('Public Metadata:');
    console.log(JSON.stringify(user.publicMetadata, null, 2));
    
    const approval = user.publicMetadata.approvalStatus;
    const role = user.publicMetadata.role;
    
    if (approval === 'APPROVED' && role === 'ADMIN') {
      console.log('✅ USUÁRIO DEVERIA TER ACESSO IMEDIATO!');
      console.log('   Se ainda está em pending, problema é no JWT template');
    } else {
      console.log('❌ Metadata ainda incorreto');
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Substituir middleware.ts por middleware-fallback.ts');
    console.log('2. Configurar JWT template no Clerk Dashboard');
    console.log('3. Usuário fazer logout/login');
    console.log('4. Deve funcionar imediatamente!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

if (require.main === module) {
  testImmediateAccess();
}

module.exports = testImmediateAccess;