import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { ApprovalStatus, ModerationAction, PrismaClient } from '@prisma/client';

interface ModerationRequest {
  action: 'APPROVE' | 'REJECT' | 'SUSPEND';
  reason?: string;
  version: number; // Para optimistic concurrency control
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: moderatorClerkId } = await auth();
    if (!moderatorClerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const moderatorUser = await clerkClient.users.getUser(moderatorClerkId);
    const isAdmin = moderatorUser.publicMetadata?.role === 'ADMIN' || 
                   moderatorUser.publicMetadata?.role === 'SUPER_ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado - Apenas admins' }, { status: 403 });
    }

    const { action, reason, version }: ModerationRequest = await request.json();
    const targetUserId = params.userId;

    // Validações
    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    if (action === 'REJECT' && !reason) {
      return NextResponse.json({ error: 'Motivo é obrigatório para rejeição' }, { status: 400 });
    }

    // Buscar usuário alvo e moderador no banco
    const [targetUser, moderatorDbUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          approvalStatus: true,
          version: true
        }
      }),
      prisma.user.findUnique({
        where: { clerkId: moderatorClerkId },
        select: { id: true }
      })
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!moderatorDbUser) {
      return NextResponse.json({ error: 'Moderador não encontrado no banco' }, { status: 404 });
    }

    // Verificar versão para optimistic concurrency control
    if (targetUser.version !== version) {
      return NextResponse.json({ 
        error: 'Conflito de concorrência - usuário foi modificado por outro admin',
        currentVersion: targetUser.version 
      }, { status: 409 });
    }

    // Determinar novo status e dados da atualização
    let newStatus: ApprovalStatus;
    let updateData: any = {
      version: { increment: 1 }
    };

    const now = new Date();

    switch (action) {
      case 'APPROVE':
        newStatus = ApprovalStatus.APPROVED;
        updateData.approvalStatus = newStatus;
        updateData.approvedAt = now;
        updateData.approvedBy = moderatorClerkId;
        updateData.creditBalance = 100; // Liberar créditos iniciais
        // Limpar dados de rejeição se existirem
        updateData.rejectedAt = null;
        updateData.rejectedBy = null;
        updateData.rejectionReason = null;
        break;

      case 'REJECT':
        newStatus = ApprovalStatus.REJECTED;
        updateData.approvalStatus = newStatus;
        updateData.rejectedAt = now;
        updateData.rejectedBy = moderatorClerkId;
        updateData.rejectionReason = reason;
        updateData.creditBalance = 0; // Zerar créditos
        // Limpar dados de aprovação se existirem
        updateData.approvedAt = null;
        updateData.approvedBy = null;
        break;

      case 'SUSPEND':
        newStatus = ApprovalStatus.SUSPENDED;
        updateData.approvalStatus = newStatus;
        updateData.creditBalance = 0; // Zerar créditos na suspensão
        break;

      default:
        return NextResponse.json({ error: 'Ação não implementada' }, { status: 400 });
    }

    // Executar transação
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // 1. Atualizar usuário
      const updatedUser = await tx.user.update({
        where: { 
          id: targetUserId,
          version: version // Garantir que a versão ainda é a mesma
        },
        data: updateData,
        select: {
          id: true,
          clerkId: true,
          email: true,
          approvalStatus: true,
          creditBalance: true,
          version: true,
          approvedAt: true,
          approvedBy: true,
          rejectedAt: true,
          rejectedBy: true,
          rejectionReason: true
        }
      });

      // 2. Criar log de auditoria
      await tx.userModerationLog.create({
        data: {
          userId: targetUserId,
          moderatorId: moderatorDbUser.id,
          action: action as ModerationAction,
          previousStatus: targetUser.approvalStatus,
          newStatus: newStatus,
          reason: reason || null,
          metadata: {
            moderatorClerkId,
            targetUserEmail: targetUser.email,
            timestamp: now.toISOString(),
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        }
      });

      return updatedUser;
    });

    // 3. Atualizar metadata no Clerk
    try {
      await clerkClient.users.updateUserMetadata(targetUser.clerkId, {
        publicMetadata: {
          ...moderatorUser.publicMetadata,
          approvalStatus: newStatus,
          dbUserId: targetUser.id,
          lastModerated: now.toISOString(),
          moderatedBy: moderatorClerkId
        }
      });

      // 4. Se rejeitado, banir no Clerk
      if (action === 'REJECT') {
        await clerkClient.users.banUser(targetUser.clerkId);
      }

    } catch (clerkError) {
      console.error('Erro ao atualizar Clerk:', clerkError);
      // Continuar mesmo se houver erro no Clerk - o banco é a fonte da verdade
    }

    return NextResponse.json({
      success: true,
      user: result,
      message: `Usuário ${action === 'APPROVE' ? 'aprovado' : action === 'REJECT' ? 'rejeitado' : 'suspenso'} com sucesso`
    });

  } catch (error) {
    console.error('Erro na moderação:', error);

    // Verificar se é erro de concorrência
    if (error instanceof Error && error.message.includes('version')) {
      return NextResponse.json({ 
        error: 'Conflito de concorrência - tente novamente' 
      }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 