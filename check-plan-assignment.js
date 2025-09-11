const { PrismaClient } = require('@prisma/client');

async function checkPlanAssignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Investigating Plan Assignment Issues\n');
    
    // Check if there are any plans in the database
    console.log('1. Checking available plans...');
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log(`   📊 Found ${plans.length} active plans:`);
    plans.forEach(plan => {
      console.log(`   📦 ${plan.name} (ID: ${plan.id}) - Type: ${plan.planType}`);
      console.log(`      Max Plannings: ${plan.maxPlanningsMonth}, Max Transcription: ${plan.maxTranscriptionMinMonth}, Max Proposals: ${plan.maxProposalsMonth}`);
    });
    
    if (plans.length === 0) {
      console.log('   ❌ NO ACTIVE PLANS FOUND! This explains why plan assignment is failing.');
      return;
    }
    
    // Check for specific plan names that assignDefaultPlan looks for
    console.log('\n2. Checking for specific plan names used by assignDefaultPlan...');
    const expectedPlanNames = ['NoUser', 'FreePlan', 'BasicPlan', 'DefaultPlan'];
    
    for (const planName of expectedPlanNames) {
      const plan = await prisma.plan.findFirst({
        where: { 
          name: { contains: planName, mode: 'insensitive' },
          isActive: true 
        }
      });
      
      if (plan) {
        console.log(`   ✅ Found: ${plan.name} (matches ${planName})`);
      } else {
        console.log(`   ❌ Missing: ${planName}`);
      }
    }
    
    // Check the test OAuth user and see if we can assign a plan manually
    console.log('\n3. Testing plan assignment for OAuth user...');
    const testUser = await prisma.user.findFirst({
      where: { clerkId: 'user_oauth_google_test_001' }
    });
    
    if (testUser && plans.length > 0) {
      console.log(`   👤 Test user found: ${testUser.email} (Status: ${testUser.approvalStatus})`);
      
      // Try to assign the first available plan
      const firstPlan = plans[0];
      console.log(`   🎯 Attempting to assign plan: ${firstPlan.name}`);
      
      try {
        // Check if user already has a plan
        const existingPlan = await prisma.userPlan.findFirst({
          where: { userId: testUser.id, isActive: true }
        });
        
        if (existingPlan) {
          console.log(`   ⚠️ User already has an active plan (ID: ${existingPlan.planId})`);
        } else {
          // Assign plan to test user
          const userPlan = await prisma.userPlan.create({
            data: {
              userId: testUser.id,
              planId: firstPlan.id,
              startsAt: new Date(),
              isActive: true
            }
          });
          console.log(`   ✅ Successfully assigned plan to test user: ${userPlan.id}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to assign plan: ${error.message}`);
      }
    }
    
    // Check recent users without plans and try to understand why
    console.log('\n4. Analyzing recent users without plans...');
    const recentUsersWithoutPlans = await prisma.user.findMany({
      where: {
        UserPlan: { none: {} },
        createdAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   📊 Found ${recentUsersWithoutPlans.length} recent users without plans:`);
    for (const user of recentUsersWithoutPlans) {
      console.log(`   👤 ${user.email} (${user.approvalStatus}) - Created: ${user.createdAt.toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error investigating plan assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlanAssignment().catch(console.error);