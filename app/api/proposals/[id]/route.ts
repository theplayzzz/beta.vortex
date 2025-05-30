import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para atualização de proposta
const UpdateProposalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'NEGOTIATION', 'ARCHIVED']).optional(),
  generatedContent: z.string().optional(),
});

// GET /api/proposals/[id] - Buscar proposta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the actual values
    const { id } = await params;

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar proposta
    const proposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: user.id,
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

    // Parse do conteúdo gerado se for JSON
    let parsedContent = null;
    if (proposal.generatedContent) {
      try {
        parsedContent = JSON.parse(proposal.generatedContent);
      } catch (error) {
        // Se não for JSON válido, manter como string
        parsedContent = proposal.generatedContent;
      }
    }

    return NextResponse.json({
      ...proposal,
      parsedContent,
    });

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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the actual values
    const { id } = await params;

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const data = UpdateProposalSchema.parse(body);

    // Verificar se a proposta existe e pertence ao usuário
    const existingProposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: user.id,
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
        // Incrementar versão se o conteúdo foi alterado
        version: data.generatedContent ? existingProposal.version + 1 : existingProposal.version,
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the actual values
    const { id } = await params;

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se a proposta existe e pertence ao usuário
    const existingProposal = await prisma.commercialProposal.findFirst({
      where: {
        id: id,
        userId: user.id,
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