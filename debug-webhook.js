const crypto = require('crypto');

// Test OAuth user creation scenarios
function simulateOAuthWebhookEvents() {
  const webhookSecret = 'whsec_vw/5G9eLPrsb3Igw+Vnmq95V6dh3+XKw';
  const webhookUrl = 'https://5.161.64.137:3003/api/webhooks/clerk';
  
  // Scenario 1: Google OAuth user
  const googleUserPayload = {
    type: 'user.created',
    data: {
      id: 'user_oauth_google_test_001',
      email_addresses: [{
        id: 'email_google_001',
        email_address: 'test.google.oauth@gmail.com'
      }],
      first_name: 'Google',
      last_name: 'OAuth',
      image_url: 'https://lh3.googleusercontent.com/test.jpg',
      public_metadata: {},
      private_metadata: {},
      external_accounts: [{
        id: 'extacc_google_001',
        provider: 'google',
        email_address: 'test.google.oauth@gmail.com',
        verification: {
          status: 'verified',
          strategy: 'oauth_google'
        }
      }],
      password_enabled: false,
      username: null
    }
  };

  // Scenario 2: Discord OAuth user
  const discordUserPayload = {
    type: 'user.created',
    data: {
      id: 'user_oauth_discord_test_002',
      email_addresses: [{
        id: 'email_discord_002',
        email_address: 'test.discord.oauth@example.com'
      }],
      first_name: 'Discord',
      last_name: 'OAuth',
      image_url: 'https://cdn.discordapp.com/avatars/test.png',
      public_metadata: {},
      private_metadata: {},
      external_accounts: [{
        id: 'extacc_discord_002',
        provider: 'discord',
        verification: {
          status: 'verified',
          strategy: 'oauth_discord'
        }
      }],
      password_enabled: false,
      username: 'discord_user_123'
    }
  };

  // Scenario 3: Email/Password user (for comparison)
  const emailPasswordPayload = {
    type: 'user.created',
    data: {
      id: 'user_email_password_test_003',
      email_addresses: [{
        id: 'email_password_003',
        email_address: 'test.email.password@example.com'
      }],
      first_name: 'Email',
      last_name: 'User',
      image_url: null,
      public_metadata: {},
      private_metadata: {},
      external_accounts: [],
      password_enabled: true,
      username: null
    }
  };

  function createWebhookTest(payload, scenario) {
    const payloadStr = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const msgId = 'msg_' + crypto.randomBytes(16).toString('hex');
    
    // Create SVIX signature
    const secret = webhookSecret.replace('whsec_', '');
    const secretBytes = Buffer.from(secret, 'base64');
    
    const signedPayload = `${msgId}.${timestamp}.${payloadStr}`;
    const signature = crypto.createHmac('sha256', secretBytes).update(signedPayload).digest('base64');
    
    console.log(`\n🧪 ${scenario} - OAuth Webhook Test`);
    console.log('='.repeat(50));
    console.log('📍 URL:', webhookUrl);
    console.log('👤 User ID:', payload.data.id);
    console.log('📧 Email:', payload.data.email_addresses[0].email_address);
    console.log('🔗 OAuth Provider:', payload.data.external_accounts.length > 0 ? payload.data.external_accounts[0].provider : 'none');
    console.log('🔑 Password Enabled:', payload.data.password_enabled);
    
    console.log('\n🚀 Comando curl para testar:');
    console.log(`curl -X POST "${webhookUrl}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "svix-id: ${msgId}" \\`);
    console.log(`  -H "svix-timestamp: ${timestamp}" \\`);
    console.log(`  -H "svix-signature: v1,${signature}" \\`);
    console.log(`  -d '${payloadStr}' \\`);
    console.log(`  --insecure -v`);
    
    return {
      scenario,
      payload,
      headers: {
        'svix-id': msgId,
        'svix-timestamp': timestamp,
        'svix-signature': `v1,${signature}`
      },
      curlCommand: `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -H "svix-id: ${msgId}" -H "svix-timestamp: ${timestamp}" -H "svix-signature: v1,${signature}" -d '${payloadStr}' --insecure -v`
    };
  }

  console.log('🔍 OAuth Webhook Analysis - Testing Different Authentication Methods\n');
  
  const tests = [
    createWebhookTest(googleUserPayload, 'GOOGLE OAUTH'),
    createWebhookTest(discordUserPayload, 'DISCORD OAUTH'),
    createWebhookTest(emailPasswordPayload, 'EMAIL/PASSWORD')
  ];

  console.log('\n📊 Analysis Summary:');
  console.log('='.repeat(50));
  console.log('1. Google OAuth: external_accounts[0].provider = "google", password_enabled = false');
  console.log('2. Discord OAuth: external_accounts[0].provider = "discord", password_enabled = false');
  console.log('3. Email/Password: external_accounts = [], password_enabled = true');
  console.log('\n🔍 Check webhook execution for each scenario to identify OAuth-specific issues');
  
  return tests;
}

// Execute and generate test cases
const tests = simulateOAuthWebhookEvents();

// Export for use in testing
module.exports = { simulateOAuthWebhookEvents };