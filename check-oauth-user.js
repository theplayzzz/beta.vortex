const { PrismaClient } = require('@prisma/client');

async function checkOAuthUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for OAuth test user in database...\n');
    
    // Check for the Google OAuth test user
    const googleUser = await prisma.user.findFirst({
      where: { clerkId: 'user_oauth_google_test_001' },
      include: {
        UserPlan: {
          include: {
            Plan: true
          }
        }
      }
    });
    
    if (googleUser) {
      console.log('✅ Google OAuth test user found in database:');
      console.log('📧 Email:', googleUser.email);
      console.log('👤 Name:', `${googleUser.firstName} ${googleUser.lastName}`);
      console.log('🆔 Clerk ID:', googleUser.clerkId);
      console.log('📊 Approval Status:', googleUser.approvalStatus);
      console.log('💰 Credit Balance:', googleUser.creditBalance);
      console.log('📅 Created At:', googleUser.createdAt);
      console.log('📦 Plan:', googleUser.UserPlan?.Plan?.name || 'No plan assigned');
      console.log('🔧 Metadata:', JSON.stringify(googleUser.UserPlan?.Plan || {}, null, 2));
    } else {
      console.log('❌ Google OAuth test user NOT found in database');
    }
    
    console.log('\n🔍 Checking recent users for OAuth patterns...\n');
    
    // Check recent users for OAuth patterns
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        UserPlan: {
          include: {
            Plan: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${recentUsers.length} users created in last 24 hours:`);
    
    for (const user of recentUsers) {
      console.log(`\n👤 ${user.email}`);
      console.log(`   Clerk ID: ${user.clerkId}`);
      console.log(`   Status: ${user.approvalStatus}`);
      console.log(`   Plan: ${user.UserPlan?.Plan?.name || 'No plan'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
    }
    
    // Check for any users without plans
    console.log('\n🔍 Checking users without plans...\n');
    
    const usersWithoutPlans = await prisma.user.findMany({
      where: {
        UserPlan: {
          none: {}
        },
        createdAt: {
          gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    console.log(`📊 Found ${usersWithoutPlans.length} users without plans (last 7 days):`);
    
    for (const user of usersWithoutPlans) {
      console.log(`   📧 ${user.email} (${user.clerkId}) - ${user.approvalStatus} - ${user.createdAt.toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking OAuth user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOAuthUser().catch(console.error);