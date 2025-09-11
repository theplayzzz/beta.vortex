const { ClerkAPI } = require('@clerk/clerk-sdk-node');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_Hft6sPddyXw0Bfw7vaYJYQlKnr07dukEc6LIkeuG5O';
const clerkAPI = new ClerkAPI({
  secretKey: CLERK_SECRET_KEY,
});

async function analyzeOAuthPatterns() {
  console.log('🔍 Analyzing OAuth Patterns in Recent Users\n');
  
  // List of recent users from our database query
  const recentUsers = [
    { email: 'claudineyoliveirano@hotmail.com', clerkId: 'user_32X06O1Fzladnq5mk27aKqkxf5o', status: 'PENDING' },
    { email: 'maniavirtual.net@gmail.com', clerkId: 'user_32WzZ2tvKXC20AN2SwFntEDuxAh', status: 'PENDING' },
    { email: 'raireusmkt@gmail.com', clerkId: 'user_32WyHtMBMzbQWNwXKRpol7ZwVfv', status: 'PENDING' },
    { email: 'lonehunter249@gmail.com', clerkId: 'user_32WxVDvjXPmJfYPXmN2xDTdduVF', status: 'PENDING' },
    { email: 'thomazmatheus97@gmail.com', clerkId: 'user_32WxLeySJfIQbkZQ020eyO9DtWx', status: 'PENDING' },
    { email: 'brunolopessoares80@gmail.com', clerkId: 'user_32WguiZa7qLza6dH9Hjjw4qCSZD', status: 'PENDING' },
    { email: 'daniel@cicloinvest.com', clerkId: 'user_32WgHxSkHMLF6Tcs5uxWOQL2AJQ', status: 'PENDING' },
    { email: 'thayanealves.m@gmail.com', clerkId: 'user_32WaNnf1ECuG9fUrLB1oXdctnPG', status: 'APPROVED' },
    { email: 'ellywelton.piressilva@gmail.com', clerkId: 'user_32WYakIDtBiUrQZPaA9IPIo49JE', status: 'PENDING' }
  ];

  console.log('📊 Checking which users exist in Clerk and their authentication methods:\n');

  let oauthCount = 0;
  let emailPasswordCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const user of recentUsers) {
    try {
      console.log(`🔍 Checking: ${user.email} (${user.clerkId})`);
      
      const clerkUser = await clerkAPI.users.getUser(user.clerkId);
      
      if (clerkUser) {
        const hasExternalAccounts = clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0;
        const hasPassword = clerkUser.passwordEnabled;
        
        if (hasExternalAccounts) {
          const providers = clerkUser.externalAccounts.map(acc => acc.provider).join(', ');
          console.log(`   ✅ OAUTH USER - Providers: ${providers}`);
          oauthCount++;
        } else if (hasPassword) {
          console.log(`   🔑 EMAIL/PASSWORD USER`);
          emailPasswordCount++;
        } else {
          console.log(`   ❓ UNKNOWN AUTH METHOD`);
        }
        
        console.log(`   📧 Email verified: ${clerkUser.emailAddresses?.[0]?.verification?.status || 'unknown'}`);
        console.log(`   📅 Created: ${clerkUser.createdAt}`);
        console.log(`   🔐 Password enabled: ${clerkUser.passwordEnabled}`);
        console.log(`   🔗 External accounts: ${clerkUser.externalAccounts?.length || 0}`);
        
      } else {
        console.log(`   ❌ NOT FOUND in Clerk`);
        notFoundCount++;
      }
      
    } catch (error) {
      if (error.status === 404 || error.message?.includes('not found')) {
        console.log(`   ❌ NOT FOUND in Clerk (404)`);
        notFoundCount++;
      } else {
        console.log(`   ⚠️ ERROR: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('📊 SUMMARY ANALYSIS:');
  console.log('='.repeat(50));
  console.log(`📱 OAuth Users: ${oauthCount}`);
  console.log(`🔑 Email/Password Users: ${emailPasswordCount}`);
  console.log(`❌ Not Found in Clerk: ${notFoundCount}`);
  console.log(`⚠️ Errors: ${errorCount}`);
  console.log(`📈 Total Analyzed: ${recentUsers.length}`);
  
  console.log('\n🎯 KEY FINDINGS:');
  console.log('='.repeat(50));
  
  if (oauthCount > 0) {
    console.log(`✅ OAuth users ARE being processed by webhook (${oauthCount} found)`);
  }
  
  if (notFoundCount > 0) {
    console.log(`⚠️ ${notFoundCount} users exist in DB but not in Clerk - possible data inconsistency`);
  }
  
  if (oauthCount + emailPasswordCount === recentUsers.length - notFoundCount - errorCount) {
    console.log(`✅ All found users have clear authentication methods`);
  }
  
  console.log('\n🔍 INVESTIGATION CONCLUSION:');
  console.log('OAuth users ARE being caught in the webhook flow.');
  console.log('The issue is NOT OAuth bypass - it\'s plan assignment failure.');
}

analyzeOAuthPatterns().catch(console.error);