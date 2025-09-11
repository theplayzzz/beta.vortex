const { PrismaClient } = require('@prisma/client');

async function fixMissingPlans() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing Missing Plan Assignments\n');
    
    // Get the NoUser plan
    const noUserPlan = await prisma.plan.findFirst({
      where: { 
        name: { contains: 'NoUser', mode: 'insensitive' },
        isActive: true 
      }
    });
    
    if (!noUserPlan) {
      console.error('❌ NoUser plan not found!');
      return;
    }
    
    console.log(`📦 Using plan: ${noUserPlan.name} (${noUserPlan.id})`);
    
    // Find all users without plans from the last 7 days
    const usersWithoutPlans = await prisma.user.findMany({
      where: {
        UserPlan: { none: {} },
        createdAt: {
          gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`👥 Found ${usersWithoutPlans.length} users without plans (last 7 days):\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutPlans) {
      try {
        console.log(`🔄 Processing: ${user.email} (${user.approvalStatus})`);
        
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + noUserPlan.durationMonths);
        
        // Assign plan
        const userPlan = await prisma.userPlan.create({
          data: {
            userId: user.id,
            planId: noUserPlan.id,
            startsAt: startDate,
            endsAt: endDate,
            isActive: true
          }
        });
        
        console.log(`   ✅ Plan assigned successfully: ${userPlan.id}`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Failed to assign plan: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Successfully assigned: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total processed: ${usersWithoutPlans.length}`);
    
    // Verify the assignments
    console.log(`\n🔍 Verifying assignments...`);
    
    const usersWithPlansNow = await prisma.user.findMany({
      where: {
        id: { in: usersWithoutPlans.map(u => u.id) }
      },
      include: {
        UserPlan: {
          where: { isActive: true },
          include: { Plan: true }
        }
      }
    });
    
    usersWithPlansNow.forEach(user => {
      if (user.UserPlan && user.UserPlan.length > 0) {
        console.log(`✅ ${user.email}: ${user.UserPlan[0].Plan.name}`);
      } else {
        console.log(`❌ ${user.email}: Still no plan`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingPlans().catch(console.error);