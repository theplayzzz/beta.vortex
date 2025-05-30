import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProposal() {
  try {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: 'cmbb1jf7c000309tutmx8ckry' },
      include: { Client: true }
    });

    console.log('=== PROPOSTA ATUALIZADA ===');
    console.log('ID:', proposal?.id);
    console.log('Status:', proposal?.status);
    console.log('Tem HTML:', !!proposal?.proposalHtml);
    console.log('Tem Markdown:', !!proposal?.proposalMarkdown);
    console.log('Tem AI Content:', !!proposal?.aiGeneratedContent);
    console.log('Tem AI Metadata:', !!proposal?.aiMetadata);
    
    if (proposal?.aiGeneratedContent) {
      console.log('AI Insights Score:', proposal.aiGeneratedContent.ai_insights?.personalization_score);
      console.log('Valor Total:', proposal.aiGeneratedContent.dados_extras?.valor_total);
      console.log('Próximos Passos:', proposal.aiGeneratedContent.dados_extras?.next_steps?.length, 'itens');
    }

    console.log('\n=== PREVIEW DO CONTEÚDO ===');
    if (proposal?.proposalHtml) {
      console.log('HTML (primeiros 200 chars):', proposal.proposalHtml.substring(0, 200) + '...');
    }
    
    if (proposal?.proposalMarkdown) {
      console.log('Markdown (primeiros 200 chars):', proposal.proposalMarkdown.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProposal(); 