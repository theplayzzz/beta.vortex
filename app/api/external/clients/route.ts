import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para criação de cliente via API externa
const ExternalClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  industry: z.string().nullable().optional(),
  serviceOrProduct: z.string().nullable().optional(),
  initialObjective: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  businessDetails: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  marketingObjectives: z.string().nullable().optional(),
  historyAndStrategies: z.string().nullable().optional(),
  challengesOpportunities: z.string().nullable().optional(),
  competitors: z.string().nullable().optional(),
  resourcesBudget: z.string().nullable().optional(),
  toneOfVoice: z.string().nullable().optional(),
  preferencesRestrictions: z.string().nullable().optional(),
  // Identificação do usuário dono do cliente
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

// POST /api/external/clients - Criar cliente via API externa (N8N)
export async function POST(request: NextRequest) {
  try {
    console.log('🔑 [EXTERNAL_API] Tentativa de acesso via API key')

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
    console.log('📋 [EXTERNAL_API] Dados recebidos:', JSON.stringify(body, null, 2))

    // Validar dados
    const validatedData = ExternalClientSchema.parse(body)

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.userEmail },
      select: { id: true, email: true, approvalStatus: true }
    })

    if (!user) {
      console.log('❌ [EXTERNAL_API] Usuário não encontrado:', validatedData.userEmail)
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        userEmail: validatedData.userEmail
      }, { status: 404 })
    }

    console.log('👤 [EXTERNAL_API] Usuário encontrado:', user.email, 'Status:', user.approvalStatus)

    // Calcular richnessScore inicial
    const allFields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]
    
    const filledFields = allFields.filter(field => {
      const value = validatedData[field as keyof typeof validatedData]
      return value && value.toString().trim().length > 0
    })

    const richnessScore = Math.round((filledFields.length / allFields.length) * 100)

    // Preparar dados para criação
    const clientData = {
      name: validatedData.name,
      industry: validatedData.industry,
      serviceOrProduct: validatedData.serviceOrProduct,
      initialObjective: validatedData.initialObjective,
      contactEmail: validatedData.contactEmail,
      contactPhone: validatedData.contactPhone,
      website: validatedData.website,
      address: validatedData.address,
      businessDetails: validatedData.businessDetails,
      targetAudience: validatedData.targetAudience,
      marketingObjectives: validatedData.marketingObjectives,
      historyAndStrategies: validatedData.historyAndStrategies,
      challengesOpportunities: validatedData.challengesOpportunities,
      competitors: validatedData.competitors,
      resourcesBudget: validatedData.resourcesBudget,
      toneOfVoice: validatedData.toneOfVoice,
      preferencesRestrictions: validatedData.preferencesRestrictions,
      richnessScore: richnessScore,
      userId: user.id,
    }

    console.log('💾 [EXTERNAL_API] Criando cliente no banco...')

    // Usar operação direct para bypass do RLS
    const client = await prisma.$executeRaw`
      INSERT INTO "Client" (
        "id", "name", "industry", "serviceOrProduct", "initialObjective",
        "contactEmail", "contactPhone", "website", "address", "businessDetails",
        "targetAudience", "marketingObjectives", "historyAndStrategies", 
        "challengesOpportunities", "competitors", "resourcesBudget",
        "toneOfVoice", "preferencesRestrictions", "richnessScore", "userId",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), ${clientData.name}, ${clientData.industry}, 
        ${clientData.serviceOrProduct}, ${clientData.initialObjective},
        ${clientData.contactEmail}, ${clientData.contactPhone}, 
        ${clientData.website}, ${clientData.address}, ${clientData.businessDetails},
        ${clientData.targetAudience}, ${clientData.marketingObjectives}, 
        ${clientData.historyAndStrategies}, ${clientData.challengesOpportunities},
        ${clientData.competitors}, ${clientData.resourcesBudget},
        ${clientData.toneOfVoice}, ${clientData.preferencesRestrictions},
        ${clientData.richnessScore}, ${clientData.userId},
        NOW(), NOW()
      ) RETURNING "id", "name", "richnessScore", "createdAt"
    `

    console.log('✅ [EXTERNAL_API] Cliente criado com sucesso')

    // Buscar cliente criado para retorno
    const createdClient = await prisma.$queryRaw`
      SELECT "id", "name", "industry", "richnessScore", "createdAt", "updatedAt"
      FROM "Client" 
      WHERE "userId" = ${user.id} 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `

    const result = {
      success: true,
      client: Array.isArray(createdClient) ? createdClient[0] : createdClient,
      metadata: {
        richnessScore,
        filledFields: filledFields.length,
        totalFields: allFields.length,
        userEmail: user.email,
        externalId: validatedData.externalId,
        source: 'external_api',
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 [EXTERNAL_API] Resposta:', JSON.stringify(result, null, 2))

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
        message: 'Verifique os campos obrigatórios e formatos'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: 'Erro ao processar requisição externa'
    }, { status: 500 })
  }
}

// GET /api/external/clients - Listar clientes via API externa
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

    // Buscar clientes usando query raw para bypass do RLS
    const clients = await prisma.$queryRaw`
      SELECT "id", "name", "industry", "contactEmail", "richnessScore", "createdAt"
      FROM "Client" 
      WHERE "userId" = ${user.id} AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC 
      LIMIT ${limit}
    `

    return NextResponse.json({
      success: true,
      clients,
      metadata: {
        userEmail,
        count: Array.isArray(clients) ? clients.length : 0,
        source: 'external_api'
      }
    })

  } catch (error) {
    console.error('❌ [EXTERNAL_API] Erro ao listar:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 