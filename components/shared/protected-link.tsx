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
                  {userStatus === 'PENDING' ? (
                    <>
                      <p>Você ainda não foi aprovado para acessar esta seção.</p>
                      <p>No momento, apenas o módulo de <strong>vendas/coaching</strong> está disponível.</p>
                      <p className="text-seasalt/50 text-xs">
                        💡 Já comprou seu plano? Entre em contato com o suporte para liberar seu acesso.
                      </p>
                    </>
                  ) : (
                    <p>Você não tem permissão para acessar esta seção.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              {userStatus === 'PENDING' && (
                <div className="flex space-x-3">
                  <Link
                    href="/coach/capture/pre-session"
                    className="flex-1 px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors text-center"
                  >
                    Acessar Vendas
                  </Link>
                  <a
                    href="mailto:suporte@exemplo.com"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                  >
                    Suporte
                  </a>
                </div>
              )}
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