const { PrismaClient } = require('@prisma/client');

async function testPlanAssignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Plan Assignment Logic\n');
    
    // Test the exact logic from assignDefaultPlan function
    const targetPlanName = 'NoUser';
    
    console.log(`1. Looking for exact plan name: "${targetPlanName}"`);
    let plan = await prisma.plan.findFirst({
      where: { 
        name: targetPlanName,
        isActive: true 
      }
    });
    
    if (plan) {
      console.log(`   ✅ Found exact match: ${plan.name}`);
    } else {
      console.log(`   ❌ Exact match not found`);
      
      // Test fallback logic for NoUser
      console.log(`\n2. Testing fallback logic for NoUser...`);
      plan = await prisma.plan.findFirst({
        where: { 
          OR: [
            { name: { contains: 'NoUser', mode: 'insensitive' } },
            { name: { contains: 'Plano NoUser', mode: 'insensitive' } }
          ],
          isActive: true 
        },
        orderBy: { displayOrder: 'asc' }
      });
      
      if (plan) {
        console.log(`   ✅ Found via fallback: ${plan.name} (ID: ${plan.id})`);
      } else {
        console.log(`   ❌ Fallback also failed`);
      }
    }
    
    // Now test assignment for one of the recent users without plans
    console.log(`\n3. Testing assignment to a real user...`);
    
    const userWithoutPlan = await prisma.user.findFirst({
      where: {
        UserPlan: { none: {} },
        email: 'claudineyoliveirano@hotmail.com'
      }
    });
    
    if (userWithoutPlan && plan) {
      console.log(`   👤 User found: ${userWithoutPlan.email} (${userWithoutPlan.id})`);
      console.log(`   📦 Plan to assign: ${plan.name} (${plan.id})`);
      
      // Check if user already has a plan (shouldn't have one based on our query)
      const existingPlan = await prisma.userPlan.findFirst({
        where: { 
          userId: userWithoutPlan.id, 
          isActive: true 
        }
      });
      
      if (existingPlan) {
        console.log(`   ⚠️ User already has a plan: ${existingPlan.planId}`);
      } else {
        console.log(`   ✅ User has no existing plan, ready to assign`);
        
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + plan.durationMonths);
        
        try {
          const userPlan = await prisma.userPlan.create({
            data: {
              userId: userWithoutPlan.id,
              planId: plan.id,
              startsAt: startDate,
              endsAt: endDate,
              isActive: true
            },
            include: { Plan: true }
          });
          
          console.log(`   ✅ SUCCESS! Plan assigned: ${userPlan.Plan.name}`);
          console.log(`   📅 Duration: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } catch (assignError) {
          console.log(`   ❌ Assignment failed: ${assignError.message}`);
        }
      }
    }
    
    // Test the actual assignDefaultPlan function
    console.log(`\n4. Testing the actual assignDefaultPlan function...`);
    
    // Import and test the function
    const { assignDefaultPlan } = require('./utils/plan-assignment.ts');
    
    const anotherUser = await prisma.user.findFirst({
      where: {
        UserPlan: { none: {} },
        email: 'maniavirtual.net@gmail.com'
      }
    });
    
    if (anotherUser) {
      console.log(`   👤 Testing with user: ${anotherUser.email}`);
      
      const result = await assignDefaultPlan(anotherUser.id, 'PENDING', 'USER');
      
      console.log(`   📊 Result:`, result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlanAssignment().catch(console.error);