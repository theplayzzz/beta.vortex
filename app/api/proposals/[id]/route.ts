import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para atualização de proposta
const UpdateProposalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'NEGOTIATION', 'ARCHIVED']).optional(),
  // 🔥 CAMPO LEGACY REMOVIDO COMPLETAMENTE
});

// GET /api/proposals/[id] - Buscar proposta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    // Await params to get the actual values
    const { id } = await params;

    // 🔥 LOG PARA CONFIRMAR BUSCA FRESCA
    console.log(`🔄 [API] Buscando proposta ${id} - dados frescos do banco de dados (${new Date().toISOString()})`);

    // Buscar proposta
    const proposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            businessDetails: true,
            contactEmail: true,
            website: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // 🔥 REMOVER CAMPO LEGACY PARA EVITAR INTERFERÊNCIA
    const { generatedContent, ...proposalWithoutLegacy } = proposal;

    // 🔥 HEADERS PARA EVITAR CACHE NO SERVIDOR E BROWSER
    const response = NextResponse.json({
      ...proposalWithoutLegacy,
      // 🔥 CAMPO LEGACY REMOVIDO COMPLETAMENTE
    });

    // Adicionar headers para evitar cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;

  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/proposals/[id] - Atualizar proposta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    // Await params to get the actual values
    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const data = UpdateProposalSchema.parse(body);

    // Verificar se a proposta existe e pertence ao usuário
    const existingProposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Atualizar proposta
    const updatedProposal = await prisma.commercialProposal.update({
      where: { id: id },
      data: {
        ...data,
        updatedAt: new Date(),
        // 🔥 LÓGICA LEGACY REMOVIDA COMPLETAMENTE
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            businessDetails: true,
            contactEmail: true,
            website: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProposal);

  } catch (error) {
    console.error('Error updating proposal:', error);
    
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

// DELETE /api/proposals/[id] - Deletar proposta (soft delete ou hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    // Await params to get the actual values
    const { id } = await params;

    // Verificar se a proposta existe e pertence ao usuário
    const existingProposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Parse query parameters para verificar tipo de delete
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete - remover completamente
      await prisma.commercialProposal.delete({
        where: { id: id },
      });
      
      return NextResponse.json({ 
        message: 'Proposal permanently deleted',
        deletedId: id 
      });
    } else {
      // Soft delete - marcar como arquivada
      const archivedProposal = await prisma.commercialProposal.update({
        where: { id: id },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ 
        message: 'Proposal archived',
        proposal: archivedProposal 
      });
    }

  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 