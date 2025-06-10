import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { ApprovalStatus } from '@prisma/client';

// GET - Listar usuários com filtros para moderação (Clerk-First Strategy)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const adminUser = await clerkClient.users.getUser(userId);
    const isAdmin = adminUser.publicMetadata?.role === 'ADMIN' || 
                   adminUser.publicMetadata?.role === 'SUPER_ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado - Apenas admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as ApprovalStatus | 'ALL' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // **CLERK-FIRST**: Buscar TODOS os usuários do Clerk
    // Nota: Clerk não suporta filtros avançados na API, então fazemos client-side
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500, // Buscar mais usuários para filtrar client-side
      offset: 0
    });

    // **CLERK-FIRST**: Filtrar usuários baseado em Clerk metadata
    let filteredUsers = clerkUsers.data.filter(user => {
      // Filtro por status de aprovação
      const userStatus = user.publicMetadata?.approvalStatus || 'PENDING';
      if (statusFilter && statusFilter !== 'ALL' && userStatus !== statusFilter) {
        return false;
      }

      // Filtro por busca (email, nome)
      if (search) {
        const searchLower = search.toLowerCase();
        const emailMatch = user.emailAddresses?.[0]?.emailAddress?.toLowerCase().includes(searchLower);
        const nameMatch = user.firstName?.toLowerCase().includes(searchLower) || 
                         user.lastName?.toLowerCase().includes(searchLower);
        if (!emailMatch && !nameMatch) {
          return false;
        }
      }

      return true;
    });

    // Paginação client-side
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    // **CLERK-FIRST**: Mapear dados do Clerk para interface esperada
    const users = paginatedUsers.map(user => {
      const metadata = user.publicMetadata || {};
      
      return {
        id: metadata.dbUserId || user.id, // Usar dbUserId se disponível, senão clerkId
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.imageUrl,
        approvalStatus: metadata.approvalStatus || 'PENDING',
        creditBalance: metadata.creditBalance || 0,
        createdAt: user.createdAt,
        approvedAt: metadata.approvedAt || null,
        approvedBy: metadata.approvedBy || null,
        rejectedAt: metadata.rejectedAt || null,
        rejectedBy: metadata.rejectedBy || null,
        rejectionReason: metadata.rejectionReason || null,
        version: metadata.version || 1
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      },
      source: 'clerk-first' // Indicador de que está usando Clerk como fonte
    });

  } catch (error) {
    console.error('Erro ao buscar usuários do Clerk:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 