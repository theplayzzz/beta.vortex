'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AccessDenied } from './access-denied';
import { getPermissionsForStatus, Modalidade } from '@/types/permissions';
import { hasAccess, getModalidadeFromRoute } from '@/lib/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredModalidade?: Modalidade;
  fallback?: React.ReactNode;
}

export function RouteGuard({ 
  children, 
  requiredModalidade,
  fallback 
}: RouteGuardProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const publicMetadata = user?.publicMetadata as any;
    const userStatus = publicMetadata?.approvalStatus || 'PENDING';
    const userRole = publicMetadata?.role || 'USER';
    const permissions = getPermissionsForStatus(userStatus, userRole);

    // Determine required modalidade from route or prop
    const modalidade = requiredModalidade || getModalidadeFromRoute(pathname);
    
    if (modalidade) {
      setHasPermission(hasAccess(modalidade, permissions));
    } else {
      // No specific modalidade required, allow access
      setHasPermission(true);
    }
  }, [isLoaded, user, pathname, requiredModalidade]);

  // Show loading state
  if (!isLoaded || hasPermission === null) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-seasalt">Verificando permissões...</div>
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasPermission) {
    const publicMetadata = user?.publicMetadata as any;
    const userStatus = publicMetadata?.approvalStatus || 'PENDING';
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <AccessDenied userStatus={userStatus} />;
  }

  // User has permission, show content
  return <>{children}</>;
}