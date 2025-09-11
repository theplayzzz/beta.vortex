import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { ApprovalStatus, ModerationAction } from '@prisma/client';
import { upgradePlanOnApproval } from '@/utils/plan-assignment';

interface ModerationRequest {
  action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'UNSUSPEND_TO_APPROVED' | 'UNSUSPEND_TO_PENDING';
  reason?: string;
  version: number; // Para optimistic concurrency control
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
    const { userId: targetUserClerkId } = await params;

    // Validações
    if (!['APPROVE', 'REJECT', 'SUSPEND', 'UNSUSPEND_TO_APPROVED', 'UNSUSPEND_TO_PENDING'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    if (action === 'REJECT' && !reason) {
      return NextResponse.json({ error: 'Motivo é obrigatório para rejeição' }, { status: 400 });
    }

    // **CLERK-FIRST**: Buscar usuário do Clerk como fonte de verdade
    const targetUser = await clerkClient.users.getUser(targetUserClerkId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado no Clerk' }, { status: 404 });
    }

    const currentMetadata = targetUser.publicMetadata || {};
    const currentStatus = currentMetadata.approvalStatus || 'PENDING';
    const currentVersion = currentMetadata.version || 1;

    // Verificar versão para optimistic concurrency control
    if (currentVersion !== version) {
      return NextResponse.json({ 
        error: 'Conflito de concorrência - usuário foi modificado por outro admin',
        currentVersion 
      }, { status: 409 });
    }

    // Determinar novo status e metadata
    let newStatus: ApprovalStatus;
    const now = new Date();
    let newMetadata: any = {
      ...currentMetadata,
      version: currentVersion + 1,
      lastModerated: now.toISOString(),
      moderatedBy: moderatorClerkId
    };

    switch (action) {
      case 'APPROVE':
        newStatus = ApprovalStatus.APPROVED;
        newMetadata.approvalStatus = newStatus;
        newMetadata.approvedAt = now.toISOString();
        newMetadata.approvedBy = moderatorClerkId;
        newMetadata.creditBalance = 100; // Liberar créditos iniciais
        // Limpar dados de rejeição se existirem
        delete newMetadata.rejectedAt;
        delete newMetadata.rejectedBy;
        delete newMetadata.rejectionReason;
        break;

      case 'REJECT':
        newStatus = ApprovalStatus.REJECTED;
        newMetadata.approvalStatus = newStatus;
        newMetadata.rejectedAt = now.toISOString();
        newMetadata.rejectedBy = moderatorClerkId;
        newMetadata.rejectionReason = reason;
        newMetadata.creditBalance = 0; // Zerar créditos
        // Limpar dados de aprovação se existirem
        delete newMetadata.approvedAt;
        delete newMetadata.approvedBy;
        break;

      case 'SUSPEND':
        newStatus = ApprovalStatus.SUSPENDED;
        newMetadata.approvalStatus = newStatus;
        newMetadata.creditBalance = 0; // Zerar créditos na suspensão
        break;

      case 'UNSUSPEND_TO_APPROVED':
        newStatus = ApprovalStatus.APPROVED;
        newMetadata.approvalStatus = newStatus;
        newMetadata.approvedAt = now.toISOString();
        newMetadata.approvedBy = moderatorClerkId;
        newMetadata.creditBalance = 100; // Restituir créditos
        newMetadata.unsuspendedAt = now.toISOString();
        newMetadata.unsuspendedBy = moderatorClerkId;
        break;

      case 'UNSUSPEND_TO_PENDING':
        newStatus = ApprovalStatus.PENDING;
        newMetadata.approvalStatus = newStatus;
        newMetadata.creditBalance = 0; // Manter sem créditos até nova aprovação
        newMetadata.unsuspendedAt = now.toISOString();
        newMetadata.unsuspendedBy = moderatorClerkId;
        // Limpar dados de aprovação anterior
        delete newMetadata.approvedAt;
        delete newMetadata.approvedBy;
        break;

      default:
        return NextResponse.json({ error: 'Ação não implementada' }, { status: 400 });
    }

    // **CLERK-FIRST**: Atualizar metadata no Clerk como ação primária
    try {
      await clerkClient.users.updateUserMetadata(targetUserClerkId, {
        publicMetadata: newMetadata
      });

      // Se rejeitado, banir no Clerk
      if (action === 'REJECT') {
        await clerkClient.users.banUser(targetUserClerkId);
      }

    } catch (clerkError) {
      console.error('Erro ao atualizar Clerk (ação primária):', clerkError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar dados no Clerk' 
      }, { status: 500 });
    }

    // **SUPABASE OPCIONAL**: Salvar auditoria no Supabase apenas para histórico
    try {
      // Buscar IDs do banco para auditoria (se existirem)
      const [targetDbUser, moderatorDbUser] = await Promise.all([
        prisma.user.findUnique({
          where: { clerkId: targetUserClerkId },
          select: { id: true, email: true }
        }),
        prisma.user.findUnique({
          where: { clerkId: moderatorClerkId },
          select: { id: true }
        })
      ]);

      // Criar log de auditoria (opcional - não afeta o funcionamento se falhar)
      if (targetDbUser && moderatorDbUser) {
        await prisma.userModerationLog.create({
          data: {
            userId: targetDbUser.id,
            moderatorId: moderatorDbUser.id,
            action: action as ModerationAction,
            previousStatus: currentStatus as ApprovalStatus,
            newStatus: newStatus,
            reason: reason || null,
            metadata: {
              moderatorClerkId,
              targetUserClerkId,
              targetUserEmail: targetDbUser.email,
              timestamp: now.toISOString(),
              userAgent: request.headers.get('user-agent'),
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              source: 'clerk-first-moderation'
            }
          }
        });

        // Sincronizar dados do usuário no Supabase (opcional)
        await prisma.user.update({
          where: { clerkId: targetUserClerkId },
          data: {
            approvalStatus: newStatus,
            creditBalance: newMetadata.creditBalance,
            approvedAt: newMetadata.approvedAt ? new Date(newMetadata.approvedAt) : null,
            approvedBy: newMetadata.approvedBy || null,
            rejectedAt: newMetadata.rejectedAt ? new Date(newMetadata.rejectedAt) : null,
            rejectedBy: newMetadata.rejectedBy || null,
            rejectionReason: newMetadata.rejectionReason || null,
            version: newMetadata.version
          }
        });

        // Upgrade plan when user is approved
        if ((action === 'APPROVE' || action === 'UNSUSPEND_TO_APPROVED') && targetDbUser) {
          try {
            const planResult = await upgradePlanOnApproval(targetDbUser.id);
            if (planResult.success) {
              console.log(`[MODERATE_PLAN_UPGRADE] ✅ Plan upgraded after approval: ${targetDbUser.id} → ${planResult.planName}`);
            } else {
              console.error(`[MODERATE_PLAN_UPGRADE] ❌ Plan upgrade failed: ${planResult.error}`);
            }
          } catch (planError: any) {
            console.error(`[MODERATE_PLAN_UPGRADE] ❌ Plan upgrade error (non-blocking):`, planError);
            // Don't fail moderation due to plan error
          }
        }
      }

    } catch (supabaseError) {
      console.warn('Erro ao salvar auditoria no Supabase (não crítico):', supabaseError);
      // Continuar mesmo se falhar - Clerk é a fonte de verdade
    }

    // **CLERK-FIRST**: Buscar dados atualizados do Clerk para resposta
    const updatedUser = await clerkClient.users.getUser(targetUserClerkId);
    const finalMetadata = updatedUser.publicMetadata || {};

    const responseUser = {
      id: finalMetadata.dbUserId || targetUserClerkId,
      clerkId: targetUserClerkId,
      email: updatedUser.emailAddresses?.[0]?.emailAddress || '',
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profileImageUrl: updatedUser.imageUrl,
      approvalStatus: finalMetadata.approvalStatus,
      creditBalance: finalMetadata.creditBalance || 0,
      version: finalMetadata.version,
      approvedAt: finalMetadata.approvedAt || null,
      approvedBy: finalMetadata.approvedBy || null,
      rejectedAt: finalMetadata.rejectedAt || null,
      rejectedBy: finalMetadata.rejectedBy || null,
      rejectionReason: finalMetadata.rejectionReason || null
    };

    // Mensagens de sucesso personalizadas
    const successMessages = {
      'APPROVE': 'aprovado',
      'REJECT': 'rejeitado',
      'SUSPEND': 'suspenso',
      'UNSUSPEND_TO_APPROVED': 'removido da suspensão e aprovado',
      'UNSUSPEND_TO_PENDING': 'removido da suspensão e retornado para pendente'
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: `Usuário ${successMessages[action]} com sucesso`,
      source: 'clerk-first'
    });

  } catch (error) {
    console.error('Erro na moderação Clerk-First:', error);

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