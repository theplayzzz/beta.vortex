import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para dados de geração de proposta
const GenerateProposalSchema = z.object({
  titulo_proposta: z.string().min(1, 'Título é obrigatório'),
  tipo_proposta: z.string().min(1, 'Tipo é obrigatório'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  modalidade_entrega: z.string().min(1, 'Modalidade é obrigatória'),
  servicos_incluidos: z.array(z.string()).min(1, 'Pelo menos um serviço é obrigatório'),
  urgencia_projeto: z.string().min(1, 'Urgência é obrigatória'),
  tomador_decisao: z.string().min(1, 'Tomador de decisão é obrigatório'),
  descricao_objetivo: z.string().optional(),
  prazo_estimado: z.string().optional(),
  orcamento_estimado: z.string().optional(),
  requisitos_especiais: z.string().optional(),
  concorrentes_considerados: z.string().optional(),
  contexto_adicional: z.string().optional(),
});

// Função para construir payload do webhook
function buildProposalPayload(
  proposalId: string,
  userId: string,
  userData: any,
  clientData: any,
  formData: any
) {
  return {
    proposal_id: proposalId,
    timestamp: new Date().toISOString(),
    user_info: {
      id: userId,
      name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Usuário',
      email: userData.email,
    },
    client_info: {
      id: clientData.id,
      name: clientData.name,
      industry: clientData.industry || 'Não informado',
      richnessScore: clientData.richnessScore,
      businessDetails: clientData.businessDetails || 'Não informado',
      contactEmail: clientData.contactEmail || 'Não informado',
      website: clientData.website || 'Não informado',
      targetAudience: clientData.targetAudience || 'Não informado',
      competitors: clientData.competitors || 'Não informado',
      data_quality: clientData.richnessScore > 80 ? "alto" : clientData.richnessScore > 50 ? "médio" : "baixo"
    },
    proposal_requirements: {
      titulo_proposta: formData.titulo_proposta,
      tipo_proposta: formData.tipo_proposta,
      modalidade_entrega: formData.modalidade_entrega,
      servicos_incluidos: formData.servicos_incluidos,
      urgencia_projeto: formData.urgencia_projeto,
      tomador_decisao: formData.tomador_decisao,
      descricao_objetivo: formData.descricao_objetivo || '',
      prazo_estimado: formData.prazo_estimado || '',
      orcamento_estimado: formData.orcamento_estimado || 'A definir',
      requisitos_especiais: formData.requisitos_especiais || '',
      concorrentes_considerados: formData.concorrentes_considerados || '',
      contexto_adicional: formData.contexto_adicional || '',
    },
    context_enrichment: {
      client_richness_level: clientData.richnessScore > 80 ? "alto" : clientData.richnessScore > 50 ? "médio" : "baixo",
      industry_specific_insights: true,
      personalization_level: clientData.richnessScore > 80 ? "avançado" : "intermediário",
      recommended_complexity: clientData.richnessScore > 80 ? "avançado" : "intermediário",
      services_count: formData.servicos_incluidos.length,
      urgency_level: formData.urgencia_projeto
    },
    submission_metadata: {
      user_id: userId,
      submitted_at: new Date().toISOString(),
      form_version: "1.0",
      session_id: `proposal_${proposalId}`
    }
  };
}

// POST /api/proposals/generate - Gerar proposta via webhook IA
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const formData = GenerateProposalSchema.parse(body);

    // Verificar se o cliente existe e pertence ao usuário
    const client = await prisma.client.findFirst({
      where: {
        id: formData.clientId,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or not owned by user' },
        { status: 404 }
      );
    }

    // Criar proposta inicial
    const proposal = await prisma.commercialProposal.create({
      data: {
        title: formData.titulo_proposta,
        clientId: formData.clientId,
        userId: user.id,
        status: 'DRAFT',
        updatedAt: new Date(),
        generatedContent: JSON.stringify({
          formData: formData,
          clientSnapshot: client,
          status: 'generating',
          createdAt: new Date().toISOString()
        }),
      },
      include: {
        Client: true,
      },
    });

    // 🔥 ENVIAR WEBHOOK PARA IA EXTERNA
    try {
      if (!process.env.PROPOSTA_WEBHOOK_URL) {
        throw new Error('PROPOSTA_WEBHOOK_URL não configurada');
      }

      // Construir payload estruturado
      const webhookPayload = buildProposalPayload(
        proposal.id,
        user.id,
        user,
        client,
        formData
      );

      console.log('📡 Enviando proposta para IA externa:', process.env.PROPOSTA_WEBHOOK_URL);
      console.log('📤 Payload:', JSON.stringify(webhookPayload, null, 2));

      // Obter domínio da aplicação
      const originDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

      // Enviar webhook com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const webhookResponse = await fetch(process.env.PROPOSTA_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
          'X-Origin-Domain': originDomain,
          'User-Agent': 'Vortex-Proposal-System/1.0'
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (webhookResponse.ok) {
        const webhookResult = await webhookResponse.json();
        console.log('✅ Webhook enviado com sucesso:', webhookResult);

        // Atualizar proposta com o conteúdo gerado
        const updatedProposal = await prisma.commercialProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'SENT', // Mudando para SENT após geração
            updatedAt: new Date(),
            generatedContent: webhookResult.generated_content || 'Proposta gerada com sucesso',
          },
          include: {
            Client: {
              select: {
                id: true,
                name: true,
                industry: true,
                richnessScore: true,
              },
            },
          },
        });

        console.log('✅ Proposta atualizada com conteúdo gerado');
        return NextResponse.json({
          proposal: updatedProposal,
          message: 'Proposta gerada com sucesso',
          webhookResult
        }, { status: 201 });

      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Erro no webhook:', webhookResponse.status, errorText);
        
        // Atualizar proposta com erro
        await prisma.commercialProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'DRAFT',
            updatedAt: new Date(),
            generatedContent: JSON.stringify({
              error: `Erro no webhook: ${webhookResponse.status}`,
              details: errorText,
              timestamp: new Date().toISOString()
            }),
          },
        });

        return NextResponse.json({
          error: 'Erro ao gerar proposta',
          details: `Webhook retornou status ${webhookResponse.status}`,
          proposal: proposal
        }, { status: 500 });
      }

    } catch (webhookError: any) {
      console.error('❌ Erro ao enviar webhook:', webhookError);

      // Atualizar proposta com erro
      await prisma.commercialProposal.update({
        where: { id: proposal.id },
        data: {
          status: 'DRAFT',
          updatedAt: new Date(),
          generatedContent: JSON.stringify({
            error: 'Falha na comunicação com IA externa',
            details: webhookError.message,
            timestamp: new Date().toISOString()
          }),
        },
      });

      return NextResponse.json({
        error: 'Erro na comunicação com IA externa',
        details: webhookError.message,
        proposal: proposal
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating proposal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 