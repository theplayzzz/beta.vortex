import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { AIGeneratedContent } from '@/lib/proposals/types';

// Schema para validação da resposta da IA
const WebhookResponseSchema = z.object({
  success: z.boolean(),
  proposal_id: z.string(),
  processing_time_ms: z.number().optional(),
  generated_content: z.object({
    proposta_html: z.string(),
    proposta_markdown: z.string(),
    dados_extras: z.object({
      valor_total: z.number(),
      prazo_total_dias: z.number(),
      nivel_complexidade: z.string(),
      personalizacao_score: z.number(),
      fatores_decisao: z.array(z.string()),
      riscos_identificados: z.array(z.string()),
      next_steps: z.array(z.string()),
    }),
    ai_insights: z.object({
      personalization_score: z.number(),
      industry_match: z.string(),
      urgency_consideration: z.string(),
      budget_alignment: z.string(),
      confidence_level: z.number(),
      recommended_approach: z.string(),
      follow_up_strategy: z.array(z.string()),
    }),
    metadata: z.object({
      generated_at: z.string(),
      model_version: z.string(),
      tokens_used: z.number(),
      processing_complexity: z.string(),
      quality_score: z.number(),
    }),
  }),
  ai_insights: z.object({
    personalization_score: z.number(),
    industry_match: z.string(),
    urgency_consideration: z.string(),
    budget_alignment: z.string(),
    confidence_level: z.number(),
    recommended_approach: z.string(),
    follow_up_strategy: z.array(z.string()),
  }).optional(),
  metadata: z.object({
    generated_at: z.string(),
    model_version: z.string(),
    tokens_used: z.number(),
    processing_complexity: z.string(),
    quality_score: z.number(),
  }).optional(),
});

// POST /api/proposals/webhook - Receber resposta da IA externa
export async function POST(request: NextRequest) {
  try {
    // Validar webhook secret para segurança
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('❌ [WEBHOOK] Secret inválido:', webhookSecret);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('📥 [WEBHOOK] Recebido:', JSON.stringify(body, null, 2));

    // Validar estrutura da resposta
    const data = WebhookResponseSchema.parse(body);

    if (!data.success) {
      console.error('❌ [WEBHOOK] IA retornou erro para proposta:', data.proposal_id);
      
      // Atualizar proposta com erro
      await prisma.commercialProposal.update({
        where: { id: data.proposal_id },
        data: {
          status: 'DRAFT',
          updatedAt: new Date(),
          generatedContent: JSON.stringify({
            error: 'IA externa retornou erro',
            timestamp: new Date().toISOString()
          }),
        },
      });

      return NextResponse.json({
        error: 'AI processing failed',
        proposal_id: data.proposal_id
      }, { status: 400 });
    }

    // Verificar se a proposta existe
    const existingProposal = await prisma.commercialProposal.findUnique({
      where: { id: data.proposal_id },
    });

    if (!existingProposal) {
      console.error('❌ [WEBHOOK] Proposta não encontrada:', data.proposal_id);
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Atualizar proposta com conteúdo gerado pela IA
    const updatedProposal = await prisma.commercialProposal.update({
      where: { id: data.proposal_id },
      data: {
        status: 'SENT', // Mudando para SENT após geração bem-sucedida
        updatedAt: new Date(),
        
        // Salvar conteúdo estruturado da IA
        aiGeneratedContent: data.generated_content as any,
        proposalHtml: data.generated_content.proposta_html,
        proposalMarkdown: data.generated_content.proposta_markdown,
        aiMetadata: data.generated_content.metadata as any,
        
        // Manter compatibilidade com campo antigo
        generatedContent: data.generated_content.proposta_html,
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

    console.log('✅ [WEBHOOK] Proposta atualizada com sucesso:', data.proposal_id);

    return NextResponse.json({
      success: true,
      proposal_id: data.proposal_id,
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro ao processar webhook:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid webhook payload', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 