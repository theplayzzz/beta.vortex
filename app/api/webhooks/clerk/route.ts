import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma/client'

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name?: string
    last_name?: string
    image_url?: string
  }
}

export async function POST(req: NextRequest) {
  // Verificar se o webhook secret está configurado
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Obter headers usando NextRequest
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  // Se não há headers, erro
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Obter o body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Criar nova instância do Svix com o secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkWebhookEvent

  // Verificar o payload com os headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Processar o evento
  const { type, data } = evt

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
      default:
        console.log(`Unhandled webhook event type: ${type}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id)
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user')
  }

  // Criar usuário no banco com saldo inicial de créditos
  await prisma.user.create({
    data: {
      clerkId: data.id,
      email: primaryEmail.email_address,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      profileImageUrl: data.image_url || null,
      creditBalance: 100, // Saldo inicial de 100 créditos
      updatedAt: new Date(),
    },
  })

  // Criar transação de crédito inicial
  const user = await prisma.user.findUnique({
    where: { clerkId: data.id },
  })

  if (user) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'INITIAL_GRANT',
        description: 'Créditos iniciais de boas-vindas',
      },
    })
  }

  console.log(`User created: ${data.id}`)
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id)
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user')
  }

  // Atualizar usuário no banco
  await prisma.user.update({
    where: { clerkId: data.id },
    data: {
      email: primaryEmail.email_address,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      profileImageUrl: data.image_url || null,
    },
  })

  console.log(`User updated: ${data.id}`)
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  // Deletar usuário do banco (cascade delete irá remover dados relacionados)
  await prisma.user.delete({
    where: { clerkId: data.id },
  })

  console.log(`User deleted: ${data.id}`)
} 