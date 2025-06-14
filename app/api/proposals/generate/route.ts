import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { convertMarkdownToHtml } from '@/lib/proposals/markdownConverter';
import { logProposalError } from '@/lib/monitoring/proposalMonitoring';

// Schema para dados de geração de proposta ATUALIZADO
const GenerateProposalSchema = z.object({
  titulo_da_proposta: z.string().min(1, 'Título é obrigatório'),
  tipo_de_proposta: z.string().min(1, 'Tipo é obrigatório'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  nome_da_contratada: z.string().min(1, 'Nome da contratada é obrigatório'),
  membros_da_equipe: z.string().optional(),
  modalidade_entrega: z.string().min(1, 'Modalidade é obrigatória'),
  servicos_incluidos: z.array(z.string()).min(1, 'Pelo menos um serviço é obrigatório'),
  requisitos_especiais: z.string().optional(),
  orcamento_estimado: z.string().min(1, 'Orçamento estimado é obrigatório'),
  forma_prazo_pagamento: z.string().min(1, 'Forma e prazo de pagamento é obrigatório'),
  urgencia_do_projeto: z.string().min(1, 'Urgência é obrigatória'),
  tomador_de_decisao: z.string().min(1, 'Tomador de decisão é obrigatório'),
  resumo_dor_problema_cliente: z.string().min(1, 'Resumo da dor/problema é obrigatório'),
  contexto_adicional: z.string().optional(),
});

// Função para construir payload do webhook ATUALIZADO
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
    submission_metadata: {
      titulo_da_proposta: formData.titulo_da_proposta,
      tipo_de_proposta: formData.tipo_de_proposta,
      nome_da_contratada: formData.nome_da_contratada,
      membros_da_equipe: formData.membros_da_equipe || '',
    },
    context_enrichment: {
      urgencia_do_projeto: formData.urgencia_do_projeto,
      tomador_de_decisao: formData.tomador_de_decisao,
      resumo_dor_problema_cliente: formData.resumo_dor_problema_cliente,
      contexto_adicional: formData.contexto_adicional || '',
    },
    proposal_requirements: {
      orcamento_estimado: formData.orcamento_estimado,
      forma_prazo_pagamento: formData.forma_prazo_pagamento,
      escopo_detalhado: `Modalidade: ${formData.modalidade_entrega}. Serviços: ${formData.servicos_incluidos.join(', ')}`,
      deliverables: formData.servicos_incluidos,
      modalidade_entrega: formData.modalidade_entrega,
      requisitos_especiais: formData.requisitos_especiais || '',
    },
  };
}

/**
 * 🏥 VERIFICAÇÃO DE SAÚDE DO WEBHOOK
 * Verifica se o serviço de IA está disponível antes de processar
 */
async function checkWebhookHealth(): Promise<boolean> {
  try {
    if (!process.env.PROPOSTA_WEBHOOK_URL) {
      console.log('⚠️ [Health] PROPOSTA_WEBHOOK_URL não configurada');
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout para health check

    const response = await fetch(process.env.PROPOSTA_WEBHOOK_URL.replace('/generate', '/health') || process.env.PROPOSTA_WEBHOOK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vortex-Health-Check/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const isHealthy = response.status < 500;
    console.log(`🏥 [Health] Webhook health check: ${isHealthy ? '✅ Saudável' : '❌ Indisponível'} (status: ${response.status})`);
    
    return isHealthy;
  } catch (error: any) {
    console.log('🏥 [Health] Webhook health check falhou:', error.message);
    return false;
  }
}

/**
 * 🚀 PROCESSAMENTO DA IA EM BACKGROUND
 * Esta função processa a proposta com IA externa sem bloquear a resposta HTTP
 */
async function processProposalWithAI(
  proposalId: string, 
  user: any, 
  client: any, 
  formData: any,
  retryCount: number = 0
) {
  const maxRetries = 2;
  const timeoutMs = 180000; // Aumentando para 3 minutos
  
  try {
    console.log(`🚀 [Background] Iniciando processamento da IA para proposta ${proposalId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
    
    if (!process.env.PROPOSTA_WEBHOOK_URL) {
      throw new Error('PROPOSTA_WEBHOOK_URL não configurada');
    }

    // Verificar saúde do webhook antes de processar
    const isWebhookHealthy = await checkWebhookHealth();
    if (!isWebhookHealthy && retryCount === 0) {
      console.log('⚠️ [Background] Webhook não está saudável, mas continuando processamento...');
    }

    // Construir payload estruturado
    const webhookPayload = buildProposalPayload(
      proposalId,
      user.id,
      user,
      client,
      formData
    );

    console.log('📡 [Background] Enviando proposta para IA externa:', process.env.PROPOSTA_WEBHOOK_URL);

    // Obter domínio da aplicação
    const originDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

    // Enviar webhook com timeout aumentado
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [Background] Timeout de ${timeoutMs}ms atingido para proposta ${proposalId}`);
      controller.abort();
    }, timeoutMs);

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
      console.log('✅ [Background] Webhook enviado com sucesso');

      // Extrair markdown da estrutura real da resposta
      const markdownContent = webhookResult.Proposta;
      
      if (!markdownContent) {
        console.error('❌ [Background] Estrutura da resposta webhook:', Object.keys(webhookResult));
        throw new Error('Resposta da IA não contém o campo "Proposta"');
      }

      console.log('📄 [Background] Markdown extraído, convertendo para HTML...');

      // Converter markdown para HTML
      const htmlContent = convertMarkdownToHtml(markdownContent);

      // Atualizar proposta com conteúdo gerado
      const updatedProposal = await prisma.commercialProposal.update({
        where: { id: proposalId },
        data: {
          status: 'SENT', // Mudando para SENT após geração
          updatedAt: new Date(),
          
          // Salvar markdown e HTML da IA nos campos dedicados
          proposalMarkdown: markdownContent,
          proposalHtml: htmlContent,
          
          // Metadata da geração
          aiMetadata: {
            generatedAt: new Date().toISOString(),
            contentLength: markdownContent.length,
            wordCount: markdownContent.split(/\s+/).length,
            processingTime: webhookResult.processing_time_ms || null,
            modelUsed: 'external-ai',
            retryCount: retryCount
          },
          
          // 🔧 CAMPO LEGADO: Manter apenas para compatibilidade (não usado para lógica de status)
          generatedContent: JSON.stringify({
            status: 'legacy_completed', // Indicar que é campo legado
            message: 'Proposta gerada - usar campos novos para status',
            completedAt: new Date().toISOString(),
            markdownLength: markdownContent.length,
            retryCount: retryCount,
            note: 'Este campo é mantido apenas para compatibilidade. Use proposalMarkdown/proposalHtml/aiGeneratedContent.'
          }),
        },
      });

      console.log(`✅ [Background] Proposta ${proposalId} atualizada com conteúdo gerado pela IA`);

    } else {
      const errorText = await webhookResponse.text();
      console.error('❌ [Background] Erro no webhook:', webhookResponse.status, errorText);
      
      // Se for erro de servidor e ainda há tentativas, fazer retry
      if (webhookResponse.status >= 500 && retryCount < maxRetries) {
        console.log(`🔄 [Background] Tentando novamente em 5 segundos... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return processProposalWithAI(proposalId, user, client, formData, retryCount + 1);
      }
      
      // Atualizar proposta com erro
      await prisma.commercialProposal.update({
        where: { id: proposalId },
        data: {
          status: 'DRAFT',
          updatedAt: new Date(),
          // 🔧 CAMPO LEGADO: Manter apenas para compatibilidade
          generatedContent: JSON.stringify({
            status: 'legacy_error',
            error: `Erro no webhook: ${webhookResponse.status}`,
            details: errorText,
            timestamp: new Date().toISOString(),
            retryCount: retryCount,
            note: 'Este campo é mantido apenas para compatibilidade. Use status DRAFT para verificar erros.'
          }),
        },
      });
    }

  } catch (error: any) {
    console.error(`❌ [Background] Erro ao processar IA para proposta ${proposalId}:`, error);

    // Log estruturado do erro para monitoramento
    logProposalError(proposalId, error, {
      userId: user.id,
      clientId: client.id,
      retryCount,
      timeoutMs,
      webhookUrl: process.env.PROPOSTA_WEBHOOK_URL
    });

    // Verificar se é erro de timeout/abort e se ainda há tentativas
    if (error.name === 'AbortError' && retryCount < maxRetries) {
      console.log(`🔄 [Background] Operação abortada, tentando novamente em 5 segundos... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return processProposalWithAI(proposalId, user, client, formData, retryCount + 1);
    }

    // Determinar tipo de erro
    let errorType = 'unknown';
    let errorMessage = 'Falha na comunicação com IA externa';
    
    if (error.name === 'AbortError') {
      errorType = 'timeout';
      errorMessage = 'Timeout na comunicação com IA externa';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorType = 'network';
      errorMessage = 'Erro de rede na comunicação com IA externa';
    }

    // Atualizar proposta com erro
    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        status: 'DRAFT',
        updatedAt: new Date(),
        // 🔧 CAMPO LEGADO: Manter apenas para compatibilidade
        generatedContent: JSON.stringify({
          status: 'legacy_error',
          error: errorMessage,
          errorType: errorType,
          details: error.message,
          timestamp: new Date().toISOString(),
          retryCount: retryCount,
          note: 'Este campo é mantido apenas para compatibilidade. Use status DRAFT para verificar erros.'
        }),
      },
    });
  }
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
        title: formData.titulo_da_proposta,
        clientId: formData.clientId,
        userId: user.id,
        status: 'DRAFT',
        updatedAt: new Date(),
        
        // 🔥 SALVAR DADOS DO FORMULÁRIO EM CAMPO DEDICADO
        formDataJSON: formData,
        clientSnapshot: {
          id: client.id,
          name: client.name,
          industry: client.industry,
          richnessScore: client.richnessScore,
          businessDetails: client.businessDetails,
          contactEmail: client.contactEmail,
          website: client.website,
          targetAudience: client.targetAudience,
          competitors: client.competitors,
          snapshotAt: new Date().toISOString()
        },
        
        // 🔧 CAMPO LEGADO: Manter apenas para compatibilidade
        generatedContent: JSON.stringify({
          status: 'legacy_generating',
          message: 'Processamento iniciado - usar campos novos para status',
          timestamp: new Date().toISOString(),
          note: 'Este campo é mantido apenas para compatibilidade. Use status DRAFT/SENT para verificar progresso.'
        }),
      },
      include: {
        Client: true,
      },
    });

    // 🔥 RETORNAR PROPOSTA IMEDIATAMENTE E PROCESSAR IA EM BACKGROUND
    console.log('✅ Proposta criada com sucesso, iniciando processamento da IA em background');
    
    // 🚀 ENVIAR WEBHOOK EM BACKGROUND (não bloquear resposta)
    processProposalWithAI(proposal.id, user, client, formData).catch(error => {
      console.error('❌ Erro no processamento background da IA:', error);
    });

    // ✅ RETORNAR IMEDIATAMENTE PARA PERMITIR REDIRECIONAMENTO
    return NextResponse.json({
      proposal: proposal,
      message: 'Proposta criada com sucesso. Processamento da IA iniciado em background.',
      status: 'created'
    }, { status: 201 });

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