import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWebhook() {
  try {
    // 1. Verificar propostas existentes
    const proposals = await prisma.commercialProposal.findMany({
      include: { Client: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 Total de propostas encontradas: ${proposals.length}`);
    
    if (proposals.length === 0) {
      console.log('❌ Nenhuma proposta encontrada para testar');
      return;
    }

    // 2. Selecionar primeira proposta para teste
    const testProposal = proposals[0];
    console.log('🎯 Testando com proposta:', {
      id: testProposal.id,
      title: testProposal.title,
      status: testProposal.status,
      client: testProposal.Client?.name
    });

    // 3. Simular resposta da IA para testar o webhook callback
    const aiResponse = {
      success: true,
      proposal_id: testProposal.id,
      processing_time_ms: 15000,
      generated_content: {
        proposta_html: `
          <h1>Proposta Comercial - ${testProposal.title}</h1>
          <h2>Cliente: ${testProposal.Client?.name || 'N/A'}</h2>
          
          <div class="section">
            <h3>Visão Geral</h3>
            <p>Esta proposta foi gerada automaticamente pela nossa IA avançada, considerando as necessidades específicas do seu negócio.</p>
          </div>
          
          <div class="section">
            <h3>Escopo de Trabalho</h3>
            <ul>
              <li>Análise estratégica completa</li>
              <li>Implementação de soluções customizadas</li>
              <li>Acompanhamento e suporte técnico</li>
              <li>Relatórios de performance</li>
            </ul>
          </div>
          
          <div class="section">
            <h3>Investimento</h3>
            <p>Valor total: R$ 25.000,00</p>
            <p>Prazo de execução: 60 dias</p>
          </div>
        `,
        proposta_markdown: `
# Proposta Comercial - ${testProposal.title}

## Cliente: ${testProposal.Client?.name || 'N/A'}

### Visão Geral
Esta proposta foi gerada automaticamente pela nossa IA avançada, considerando as necessidades específicas do seu negócio.

### Escopo de Trabalho
- Análise estratégica completa
- Implementação de soluções customizadas  
- Acompanhamento e suporte técnico
- Relatórios de performance

### Investimento
- **Valor total:** R$ 25.000,00
- **Prazo de execução:** 60 dias
        `,
        dados_extras: {
          valor_total: 25000,
          prazo_total_dias: 60,
          nivel_complexidade: "intermediário",
          personalizacao_score: 85,
          fatores_decisao: [
            "Expertise comprovada no setor",
            "Metodologia ágil e flexível",
            "ROI estimado em 6 meses",
            "Suporte técnico especializado"
          ],
          riscos_identificados: [
            "Dependência de integração com sistemas legados",
            "Necessidade de treinamento da equipe interna"
          ],
          next_steps: [
            "Aprovação da proposta pelo tomador de decisão",
            "Assinatura do contrato e definição de cronograma",
            "Kick-off meeting com as equipes envolvidas",
            "Início da fase de descoberta e análise"
          ]
        },
        ai_insights: {
          personalization_score: 85,
          industry_match: "alta compatibilidade",
          urgency_consideration: "prazo adequado considerando complexidade",
          budget_alignment: "dentro da faixa esperada",
          confidence_level: 92,
          recommended_approach: "implementação incremental com marcos bem definidos",
          follow_up_strategy: [
            "Agendar reunião de apresentação em 48h",
            "Enviar casos de sucesso similares",
            "Preparar demonstração técnica personalizada"
          ]
        },
        metadata: {
          generated_at: new Date().toISOString(),
          model_version: "gpt-4-turbo-preview",
          tokens_used: 2847,
          processing_complexity: "intermediário",
          quality_score: 92
        }
      }
    };

    // 4. Enviar para o endpoint webhook
    console.log('📡 Enviando resposta simulada da IA para webhook...');
    
    const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';
    const response = await fetch('http://localhost:3003/api/proposals/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: JSON.stringify(aiResponse)
    });

    const result = await response.text();
    console.log('📥 Resposta do webhook:', {
      status: response.status,
      statusText: response.statusText,
      body: result
    });

    // 5. Verificar se a proposta foi atualizada
    const updatedProposal = await prisma.commercialProposal.findUnique({
      where: { id: testProposal.id },
      include: { Client: true }
    });

    console.log('🔍 Proposta após webhook:', {
      id: updatedProposal?.id,
      status: updatedProposal?.status,
      hasAiContent: !!updatedProposal?.aiGeneratedContent,
      hasHtml: !!updatedProposal?.proposalHtml,
      hasMarkdown: !!updatedProposal?.proposalMarkdown,
      hasMetadata: !!updatedProposal?.aiMetadata
    });

    if (response.ok) {
      console.log('✅ Teste do webhook realizado com sucesso!');
    } else {
      console.log('❌ Erro no teste do webhook');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testWebhook(); 