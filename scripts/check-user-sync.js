// Carregar variáveis de ambiente
require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function checkUserCounts() {
  const prisma = new PrismaClient();
  
  // Criar instância do Clerk com as credenciais
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  try {
    // Contar usuários no Supabase
    const supabaseUsers = await prisma.user.findMany({
      select: { id: true, clerkId: true, email: true, approvalStatus: true }
    });
    
    console.log('📊 ANÁLISE DE USUÁRIOS');
    console.log('='.repeat(50));
    console.log(`Usuários no Supabase: ${supabaseUsers.length}`);
    
    if (supabaseUsers.length > 0) {
      console.log('\n🔍 Usuários no Supabase:');
      supabaseUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (Clerk: ${user.clerkId}) - Status: ${user.approvalStatus}`);
      });
    }
    
    // Tentar contar usuários no Clerk
    try {
      console.log('\n🔄 Consultando usuários no Clerk...');
      const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
      console.log(`Usuários no Clerk: ${clerkUsers.data.length}`);
      
      if (clerkUsers.data.length > 0) {
        console.log('\n🔍 Usuários no Clerk:');
        clerkUsers.data.forEach((user, index) => {
          const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
          console.log(`${index + 1}. ${email} (ID: ${user.id})`);
        });
      }
      
      // Identificar usuários não sincronizados
      const supabaseClerkIds = new Set(supabaseUsers.map(u => u.clerkId));
      const unsyncedUsers = clerkUsers.data.filter(clerkUser => !supabaseClerkIds.has(clerkUser.id));
      
      console.log(`\n⚠️  Usuários não sincronizados: ${unsyncedUsers.length}`);
      if (unsyncedUsers.length > 0) {
        console.log('\n🔗 Usuários que precisam ser migrados:');
        unsyncedUsers.forEach((user, index) => {
          const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
          console.log(`${index + 1}. ${email} (ID: ${user.id})`);
        });
        
        return unsyncedUsers; // Retornar para uso na migração
      }
      
    } catch (clerkError) {
      console.log('\n❌ Erro ao acessar Clerk:', clerkError.message);
      console.log('Verifique se CLERK_SECRET_KEY está configurado corretamente');
      console.log('Chave atual:', process.env.CLERK_SECRET_KEY ? 'Configurada' : 'Não configurada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCounts(); 