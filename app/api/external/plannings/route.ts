import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// Schema para criação de planejamento via API externa
const ExternalPlanningSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  clientId: z.string().min(1, 'ID do cliente é obrigatório'),
  userEmail: z.string().email('Email do usuário é obrigatório'),
  formDataJSON: z.object({}).optional(), // Dados do formulário original
  clientSnapshot: z.object({}).optional(), // Snapshot do cliente
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
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

// POST /api/external/plannings - Criar planejamento via API externa (N8N)
export async function POST(request: NextRequest) {
  try {
    console.log('🔑 [EXTERNAL_API] Tentativa de criar planejamento via API key')

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
    console.log('📋 [EXTERNAL_API] Dados do planejamento recebidos:', JSON.stringify(body, null, 2))

    // Validar dados
    const validatedData = ExternalPlanningSchema.parse(body)

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
      SELECT "id", "name", "industry", "richnessScore" FROM "Client" 
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

    console.log('💾 [EXTERNAL_API] Criando planejamento no banco...')

    // Preparar dados do planejamento
    const planningData = {
      title: validatedData.title,
      description: validatedData.description,
      clientId: validatedData.clientId,
      userId: user.id,
      status: validatedData.status,
      formDataJSON: validatedData.formDataJSON || {},
      clientSnapshot: validatedData.clientSnapshot || client[0]
    }

    // Criar planejamento usando query raw para bypass do RLS
    const planningId = randomUUID()
    
    await prisma.$executeRaw`
      INSERT INTO "StrategicPlanning" (
        "id", "title", "description", "clientId", "userId", "status", "createdAt", "updatedAt"
      ) VALUES (
        ${planningId}, ${planningData.title}, ${planningData.description},
        ${planningData.clientId}, ${planningData.userId}, ${planningData.status}::"PlanningStatus",
        NOW(), NOW()
      )
    `

    console.log('✅ [EXTERNAL_API] Planejamento criado com sucesso')

    // Buscar planejamento criado para retorno
    const createdPlanning = await prisma.$queryRaw`
      SELECT "id", "title", "description", "status", "createdAt"
      FROM "StrategicPlanning" 
      WHERE "id" = ${planningId}
    `

    const result = {
      success: true,
      planning: Array.isArray(createdPlanning) ? createdPlanning[0] : createdPlanning,
      metadata: {
        clientId: validatedData.clientId,
        clientName: client[0].name,
        userEmail: user.email,
        externalId: validatedData.externalId,
        source: 'external_api',
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 [EXTERNAL_API] Resposta planejamento:', JSON.stringify(result, null, 2))

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro ao criar planejamento:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
        message: 'Verifique os campos obrigatórios e formatos'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: 'Erro ao processar planejamento externo'
    }, { status: 500 })
  }
}

// GET /api/external/plannings - Listar planejamentos via API externa
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
    const status = searchParams.get('status')
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
    let whereClause = `WHERE p."userId" = '${user.id}'`
    if (clientId) {
      whereClause += ` AND p."clientId" = '${clientId}'`
    }
    if (status) {
      whereClause += ` AND p."status" = '${status}'`
    }

    // Buscar planejamentos usando query raw para bypass do RLS
    const plannings = await prisma.$queryRawUnsafe(`
      SELECT 
        p."id", p."title", p."description", p."status", p."clientId", p."createdAt", p."updatedAt",
        c."name" as "clientName", c."industry" as "clientIndustry"
      FROM "StrategicPlanning" p
      LEFT JOIN "Client" c ON c."id" = p."clientId"
      ${whereClause}
      ORDER BY p."createdAt" DESC 
      LIMIT ${limit}
    `)

    return NextResponse.json({
      success: true,
      plannings,
      metadata: {
        userEmail,
        clientId,
        status,
        count: Array.isArray(plannings) ? plannings.length : 0,
        source: 'external_api'
      }
    })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro ao listar planejamentos:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 