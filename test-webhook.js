const crypto = require('crypto');

function generateWebhookTest() {
  const webhookSecret = 'whsec_vw/5G9eLPrsb3Igw+Vnmq95V6dh3+XKw';
  const webhookUrl = 'https://5.161.64.137:3003/api/webhooks/clerk';
  
  // Payload simulando criação de usuário
  const payload = {
    type: 'user.created',
    data: {
      id: 'user_test_webhook_123',
      email_addresses: [{
        id: 'email_123',
        email_address: 'test-webhook@example.com'
      }],
      first_name: 'Test',
      last_name: 'Webhook',
      image_url: null,
      public_metadata: {},
      private_metadata: {},
      external_accounts: [],
      password_enabled: true
    }
  };
  
  const payloadStr = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const msgId = 'msg_' + crypto.randomBytes(16).toString('hex');
  
  // Criar assinatura SVIX
  const secret = webhookSecret.replace('whsec_', '');
  const secretBytes = Buffer.from(secret, 'base64');
  
  const signedPayload = `${msgId}.${timestamp}.${payloadStr}`;
  const signature = crypto.createHmac('sha256', secretBytes).update(signedPayload).digest('base64');
  
  console.log('🧪 Teste de Webhook do Clerk\n');
  console.log('📍 URL:', webhookUrl);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n🔐 Headers:');
  console.log('svix-id:', msgId);
  console.log('svix-timestamp:', timestamp);
  console.log('svix-signature:', `v1,${signature}`);
  
  console.log('\n🚀 Comando curl para testar:');
  console.log(`curl -X POST "${webhookUrl}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "svix-id: ${msgId}" \\`);
  console.log(`  -H "svix-timestamp: ${timestamp}" \\`);
  console.log(`  -H "svix-signature: v1,${signature}" \\`);
  console.log(`  -d '${payloadStr}' \\`);
  console.log(`  --insecure -v`);
  
  return { payload, headers: { 'svix-id': msgId, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` } };
}

generateWebhookTest();