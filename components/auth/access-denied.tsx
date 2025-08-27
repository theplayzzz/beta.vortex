'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, Headphones } from 'lucide-react';

interface AccessDeniedProps {
  userStatus?: string;
  message?: string;
}

export function AccessDenied({ 
  userStatus = 'PENDING',
  message = 'Você ainda não foi aprovado para acessar esta modalidade' 
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-eerie-black rounded-lg border border-accent/20 p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-seasalt mb-3">
            Acesso Negado
          </h1>

          {/* Message */}
          <p className="text-seasalt/70 mb-2">
            {message}
          </p>

          {/* Sub-message for PENDING users */}
          {userStatus === 'PENDING' && (
            <p className="text-seasalt/50 text-sm mb-6">
              No momento, você tem acesso apenas ao módulo de vendas/coaching
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {userStatus === 'PENDING' && (
              <Link
                href="/coach/capture/pre-session"
                className="flex items-center justify-center w-full px-4 py-3 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
              >
                <Headphones className="w-5 h-5 mr-2" />
                Ir para Vendas
              </Link>
            )}

            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center w-full px-4 py-3 bg-eerie-black border border-accent/20 text-periwinkle font-medium rounded-lg hover:bg-accent/10 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Voltar à Home
            </button>
          </div>

          {/* Status Badge */}
          <div className="mt-6 pt-6 border-t border-accent/20">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
              Status: {userStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}