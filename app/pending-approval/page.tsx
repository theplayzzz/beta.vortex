'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApprovalStatusPolling } from '@/hooks/useApprovalStatusPolling';
import { useClerk, SignOutButton } from '@clerk/nextjs';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { session } = useClerk();
  const { statusData, isLoading, isError } = useApprovalStatusPolling({
    pollingInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    if (statusData?.approvalStatus === 'APPROVED') {
      session?.touch()
        .then(() => {
          router.push('/planejamentos');
        })
        .catch(err => {
          console.error("Failed to update session, retrying redirect:", err);
          router.push('/planejamentos'); // Attempt redirect even if touch fails
        });
    } else if (statusData?.approvalStatus === 'REJECTED' || statusData?.approvalStatus === 'SUSPENDED') {
      session?.touch()
        .then(() => {
          router.push('/account-rejected');
        })
        .catch(err => {
          console.error("Failed to update session, retrying redirect:", err);
          router.push('/account-rejected');
        });
    }
  }, [statusData, router, session]);

  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: 'var(--night)' }}>
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-xl" style={{ borderColor: 'rgba(249, 251, 252, 0.1)', backgroundColor: 'var(--eerie-black)' }}>
        <div className="flex flex-col items-center justify-center space-y-4 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--seasalt)' }}>Aprovação Pendente</h3>
          <p className="text-sm" style={{ color: 'var(--periwinkle)' }}>
            Sua conta está aguardando aprovação de um administrador. Você será
            redirecionado automaticamente assim que sua conta for revisada.
          </p>
          <div className="mt-4 h-6">
            {isLoading && (
              <p className="text-sm animate-pulse" style={{ color: 'var(--periwinkle)' }}>
                Verificando status...
              </p>
            )}
            {isError && (
              <p className="text-sm" style={{ color: '#F87171' }}>
                Erro ao verificar o status. Tentando novamente...
              </p>
            )}
          </div>
          <div className="w-full pt-4">
            <SignOutButton redirectUrl="/sign-in">
                <button className="w-full rounded-md py-2 px-4 text-sm font-medium transition-colors" style={{ backgroundColor: 'var(--sgbus-green)', color: 'var(--night)' }}>
                    Sair
                </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
