import React from 'react';
import { Lock } from 'lucide-react';

interface DisabledSectionProps {
  children: React.ReactNode;
  message?: string;
}

export function DisabledSection({ 
  children, 
  message = "Em breve nas próximas atualizações" 
}: DisabledSectionProps) {
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-night/30 backdrop-blur-sm rounded-xl">
        <div className="bg-eerie-black px-4 py-2 rounded-full border border-seasalt/10 flex items-center gap-2 transition-all duration-200 motion-reduce:transition-none">
          <Lock className="h-3 w-3 text-periwinkle" />
          <span className="text-xs text-periwinkle font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}