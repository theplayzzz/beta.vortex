'use client';

import { useSearchParams } from 'next/navigation';
import { AccessDenied } from '@/components/auth/access-denied';
import { useUser } from '@clerk/nextjs';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  // Pegar informações dos parâmetros da URL ou do usuário
  const requestedPath = searchParams.get('path') || 'esta área';
  const userStatus = (user?.publicMetadata as any)?.approvalStatus || 'PENDING';
  
  const getMessage = () => {
    if (userStatus === 'PENDING') {
      return `Você tentou acessar ${requestedPath} mas ainda não foi aprovado para esta funcionalidade.`;
    }
    return `Você não tem permissão para acessar ${requestedPath}.`;
  };

  return (
    <AccessDenied 
      userStatus={userStatus}
      message={getMessage()}
    />
  );
}