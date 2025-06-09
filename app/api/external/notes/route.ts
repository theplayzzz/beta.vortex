import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para criação de nota via API externa
const ExternalNoteSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  clientId: z.string().min(1, 'ID do cliente é obrigatório'),
  userEmail: z.string().email('Email do usuário é obrigatório'),
  externalId: z.string().optional(), // ID externo para referência
})

// Verificar API key
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
  const validApiKeys = [
    process.env.EXTERNAL_API_KEY,
    process.env.N8N_API_KEY,
    process.env.AUTOMATION_API_KEY
  ].filter(Boolean)

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return false
  }

  return true
}

// POST /api/external/notes - Criar nota via API externa (N8N)
export async function POST(request: NextRequest) {
  try {
    console.log('🔑 [EXTERNAL_API] Tentativa de criar nota via API key')

    // Verificar API key
    if (!verifyApiKey(request)) {
      console.log('❌ [EXTERNAL_API] API key inválida ou ausente')
      return NextResponse.json({ 
        error: 'API key inválida ou ausente',
        message: 'Use X-API-Key header ou Authorization: Bearer <token>'
      }, { status: 401 })
    }

    console.log('✅ [EXTERNAL_API] API key válida')

    const body = await request.json()
    console.log('📋 [EXTERNAL_API] Dados da nota recebidos:', JSON.stringify(body, null, 2))

    // Validar dados
    const validatedData = ExternalNoteSchema.parse(body)

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.userEmail },
      select: { id: true, email: true }
    })

    if (!user) {
      console.log('❌ [EXTERNAL_API] Usuário não encontrado:', validatedData.userEmail)
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        userEmail: validatedData.userEmail
      }, { status: 404 })
    }

    // Verificar se o cliente existe e pertence ao usuário
    const client = await prisma.$queryRaw`
      SELECT "id", "name" FROM "Client" 
      WHERE "id" = ${validatedData.clientId} AND "userId" = ${user.id}
    `

    if (!Array.isArray(client) || client.length === 0) {
      console.log('❌ [EXTERNAL_API] Cliente não encontrado ou não pertence ao usuário')
      return NextResponse.json({ 
        error: 'Cliente não encontrado ou não pertence ao usuário',
        clientId: validatedData.clientId,
        userEmail: validatedData.userEmail
      }, { status: 404 })
    }

    console.log('💾 [EXTERNAL_API] Criando nota no banco...')

    // Criar nota usando query raw para bypass do RLS
    await prisma.$executeRaw`
      INSERT INTO "ClientNote" (
        "id", "content", "clientId", "userId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), ${validatedData.content}, ${validatedData.clientId}, 
        ${user.id}, NOW(), NOW()
      )
    `

    console.log('✅ [EXTERNAL_API] Nota criada com sucesso')

    // Buscar nota criada para retorno
    const createdNote = await prisma.$queryRaw`
      SELECT "id", "content", "createdAt"
      FROM "ClientNote" 
      WHERE "clientId" = ${validatedData.clientId} AND "userId" = ${user.id}
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `

    const result = {
      success: true,
      note: Array.isArray(createdNote) ? createdNote[0] : createdNote,
      metadata: {
        clientId: validatedData.clientId,
        clientName: client[0].name,
        userEmail: user.email,
        externalId: validatedData.externalId,
        source: 'external_api',
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 [EXTERNAL_API] Resposta nota:', JSON.stringify(result, null, 2))

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro ao criar nota:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
        message: 'Verifique os campos obrigatórios e formatos'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: 'Erro ao processar nota externa'
    }, { status: 500 })
  }
}

// GET /api/external/notes - Listar notas via API externa
export async function GET(request: NextRequest) {
  try {
    // Verificar API key
    if (!verifyApiKey(request)) {
      return NextResponse.json({ 
        error: 'API key inválida ou ausente' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'userEmail é obrigatório' 
      }, { status: 400 })
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Montar query base
    let whereClause = `WHERE "userId" = '${user.id}'`
    if (clientId) {
      whereClause += ` AND "clientId" = '${clientId}'`
    }

    // Buscar notas usando query raw para bypass do RLS
    const notes = await prisma.$queryRawUnsafe(`
      SELECT n."id", n."content", n."clientId", n."createdAt", c."name" as "clientName"
      FROM "ClientNote" n
      LEFT JOIN "Client" c ON c."id" = n."clientId"
      ${whereClause}
      ORDER BY n."createdAt" DESC 
      LIMIT ${limit}
    `)

    return NextResponse.json({
      success: true,
      notes,
      metadata: {
        userEmail,
        clientId,
        count: Array.isArray(notes) ? notes.length : 0,
        source: 'external_api'
      }
    })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro ao listar notas:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 