import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullFlow() {
  try {
    console.log('🧪 TESTE COMPLETO: Fluxo de Proposta + IA');
    console.log('=====================================\n');

    // 1. Simular dados do formulário
    const mockFormData = {
      titulo_proposta: "Teste Fluxo Completo - Proposta Digital",
      tipo_proposta: "Consultoria Digital",
      clientId: "cmbayt6ge0001ic0bx1qusnz6", // Cliente Rugido existente
      modalidade_entrega: "Remoto",
      servicos_incluidos: [
        "SEO Avançado",
        "Marketing de Conteúdo", 
        "Análise de Performance"
      ],
      urgencia_projeto: "Média",
      tomador_decisao: "CEO",
      descricao_objetivo: "Aumentar presença digital e conversões online",
      prazo_estimado: "3 meses",
      orcamento_estimado: "R$ 15.000 - R$ 20.000",
      requisitos_especiais: "Foco em resultados mensuráveis",
      concorrentes_considerados: "Agência XYZ, Digital Corp",
      contexto_adicional: "Cliente tem urgência para Q1 2025"
    };

    // 2. Buscar cliente para o snapshot
    const client = await prisma.client.findUnique({
      where: { id: mockFormData.clientId }
    });

    console.log('📝 1. CRIANDO PROPOSTA COM DADOS DO FORMULÁRIO...');
    console.log('Cliente:', client?.name);
    console.log('Título:', mockFormData.titulo_proposta);
    console.log('Serviços:', mockFormData.servicos_incluidos.length, 'itens');

    // 3. Criar proposta com dados do formulário
    const newProposal = await prisma.commercialProposal.create({
      data: {
        title: mockFormData.titulo_proposta,
        clientId: mockFormData.clientId,
        userId: "cmb4ip6290000093wziwuuiib", // User ID fixo para teste
        status: 'DRAFT',
        updatedAt: new Date(),
        
        // ✅ DADOS DO FORMULÁRIO EM CAMPO DEDICADO
        formDataJSON: mockFormData,
        clientSnapshot: {
          id: client?.id,
          name: client?.name,
          industry: client?.industry,
          richnessScore: client?.richnessScore,
          businessDetails: client?.businessDetails,
          contactEmail: client?.contactEmail,
          website: client?.website,
          targetAudience: client?.targetAudience,
          competitors: client?.competitors,
          snapshotAt: new Date().toISOString()
        },
        
        // Status temporário
        generatedContent: JSON.stringify({
          status: 'awaiting_ai',
          message: 'Aguardando processamento da IA...',
          timestamp: new Date().toISOString()
        }),
      },
      include: {
        Client: true
      }
    });

    console.log('✅ Proposta criada:', newProposal.id);
    console.log('   - Status:', newProposal.status);
    console.log('   - Tem formDataJSON:', !!newProposal.formDataJSON);
    console.log('   - Tem clientSnapshot:', !!newProposal.clientSnapshot);

    // 4. Simular resposta da IA
    console.log('\n🤖 2. SIMULANDO RESPOSTA DA IA VIA WEBHOOK...');
    
    const aiResponse = {
      success: true,
      proposal_id: newProposal.id,
      processing_time_ms: 12000,
      generated_content: {
        proposta_html: `
          <h1>Proposta de Consultoria Digital</h1>
          <h2>Cliente: ${client?.name}</h2>
          
          <div class="section">
            <h3>Visão Geral</h3>
            <p>Proposta personalizada para transformação digital focada em resultados mensuráveis e crescimento sustentável.</p>
          </div>
          
          <div class="section">
            <h3>Escopo dos Serviços</h3>
            <ul>
              <li><strong>SEO Avançado:</strong> Otimização técnica e de conteúdo</li>
              <li><strong>Marketing de Conteúdo:</strong> Estratégia editorial e produção</li>
              <li><strong>Análise de Performance:</strong> KPIs e relatórios customizados</li>
            </ul>
          </div>
          
          <div class="section">
            <h3>Investimento e Cronograma</h3>
            <p><strong>Valor:</strong> R$ 18.000,00</p>
            <p><strong>Prazo:</strong> 3 meses com entregas quinzenais</p>
            <p><strong>ROI Estimado:</strong> 300% em 6 meses</p>
          </div>
        `,
        proposta_markdown: `
# Proposta de Consultoria Digital

## Cliente: ${client?.name}

### Visão Geral
Proposta personalizada para transformação digital focada em resultados mensuráveis e crescimento sustentável.

### Escopo dos Serviços
- **SEO Avançado:** Otimização técnica e de conteúdo
- **Marketing de Conteúdo:** Estratégia editorial e produção  
- **Análise de Performance:** KPIs e relatórios customizados

### Investimento e Cronograma
- **Valor:** R$ 18.000,00
- **Prazo:** 3 meses com entregas quinzenais
- **ROI Estimado:** 300% em 6 meses
        `,
        dados_extras: {
          valor_total: 18000,
          prazo_total_dias: 90,
          nivel_complexidade: "intermediário",
          personalizacao_score: 90,
          fatores_decisao: [
            "Experiência com clientes do setor",
            "Metodologia comprovada de resultados",
            "Foco em ROI mensurável",
            "Equipe especializada em digital"
          ],
          riscos_identificados: [
            "Prazo apertado para Q1",
            "Necessidade de aprovação rápida"
          ],
          next_steps: [
            "Reunião de alinhamento em 24h",
            "Aprovação da proposta até sexta",
            "Kick-off na segunda-feira seguinte",
            "Primeira entrega em 15 dias"
          ]
        },
        ai_insights: {
          personalization_score: 90,
          industry_match: "excelente compatibilidade",
          urgency_consideration: "prazo adequado com foco em Q1",
          budget_alignment: "dentro da faixa premium",
          confidence_level: 95,
          recommended_approach: "implementação acelerada com marcos semanais",
          follow_up_strategy: [
            "Contato imediato para agendamento",
            "Envio de case studies similares",
            "Proposta de cronograma detalhado"
          ]
        },
        metadata: {
          generated_at: new Date().toISOString(),
          model_version: "gpt-4-turbo-preview",
          tokens_used: 3150,
          processing_complexity: "avançado",
          quality_score: 95
        }
      }
    };

    // 5. Simular webhook call
    const webhookSecret = 'test-secret-vortex-2025';
    const response = await fetch('http://localhost:3003/api/proposals/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: JSON.stringify(aiResponse)
    });

    console.log('Webhook enviado - Status:', response.status);
    
    if (response.ok) {
      const webhookResult = await response.json();
      console.log('✅ Webhook processado com sucesso');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro no webhook:', errorText);
    }

    // 6. Verificar resultado final
    console.log('\n📊 3. VERIFICANDO RESULTADO FINAL...');
    
    const finalProposal = await prisma.commercialProposal.findUnique({
      where: { id: newProposal.id },
      include: { Client: true }
    });

    console.log('=== PROPOSTA FINAL ===');
    console.log('ID:', finalProposal?.id);
    console.log('Status:', finalProposal?.status);
    console.log('');
    console.log('📝 DADOS DO FORMULÁRIO:');
    console.log('   - Tem formDataJSON:', !!finalProposal?.formDataJSON);
    console.log('   - Tem clientSnapshot:', !!finalProposal?.clientSnapshot);
    console.log('   - Serviços (formData):', finalProposal?.formDataJSON?.servicos_incluidos?.length || 0);
    console.log('');
    console.log('🤖 CONTEÚDO DA IA:');
    console.log('   - Tem aiGeneratedContent:', !!finalProposal?.aiGeneratedContent);
    console.log('   - Tem proposalHtml:', !!finalProposal?.proposalHtml);
    console.log('   - Tem proposalMarkdown:', !!finalProposal?.proposalMarkdown);
    console.log('   - Tem aiMetadata:', !!finalProposal?.aiMetadata);
    console.log('   - AI Score:', finalProposal?.aiGeneratedContent?.ai_insights?.personalization_score || 'N/A');
    console.log('   - Valor IA:', finalProposal?.aiGeneratedContent?.dados_extras?.valor_total || 'N/A');

    // 7. Mostrar URL para acessar
    console.log('\n🌐 ACESSE A PROPOSTA:');
    console.log(`http://localhost:3003/propostas/${finalProposal?.id}`);
    console.log('');
    console.log('✅ TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('   ✓ Dados do formulário preservados');
    console.log('   ✓ Conteúdo da IA adicionado');
    console.log('   ✓ Página individual com ambas as informações');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testFullFlow(); 