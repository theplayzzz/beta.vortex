'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { getPermissionsForStatus, Modalidade } from '@/types/permissions';
import { hasAccess } from '@/lib/permissions';
import { AlertCircle } from 'lucide-react';

interface ProtectedLinkProps {
  href: string;
  modalidade: Modalidade;
  children: React.ReactNode;
  className?: string;
  showModal?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedLink({
  href,
  modalidade,
  children,
  className,
  showModal = true,
  fallback
}: ProtectedLinkProps) {
  const { user } = useUser();
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  const publicMetadata = user?.publicMetadata as any;
  const userStatus = publicMetadata?.approvalStatus || 'PENDING';
  const userRole = publicMetadata?.role || 'USER';
  const permissions = getPermissionsForStatus(userStatus, userRole);
  
  const canAccess = hasAccess(modalidade, permissions);

  const handleClick = (e: React.MouseEvent) => {
    if (!canAccess) {
      e.preventDefault();
      if (showModal) {
        setShowDeniedModal(true);
      }
    }
  };

  if (!canAccess && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <Link 
        href={canAccess ? href : '#'}
        className={`${className} ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleClick}
      >
        {children}
      </Link>

      {/* Access Denied Modal */}
      {showDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-eerie-black rounded-lg border border-accent/20 max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-seasalt">
                  Acesso Negado
                </h3>
                <div className="mt-2 text-sm text-seasalt/70 space-y-1">
                  <p>Você não tem permissão para acessar esta seção.</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setShowDeniedModal(false)}
                className="px-4 py-2 bg-eerie-black border border-accent/20 text-periwinkle font-medium rounded-lg hover:bg-accent/10 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}