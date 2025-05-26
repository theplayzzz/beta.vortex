'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthTabs() {
  const pathname = usePathname();
  const isSignIn = pathname.includes('/sign-in');
  
  return (
    <div className="flex space-x-1 bg-eerie-black/50 p-1 rounded-2xl mb-8">
      <Link
        href="/sign-in"
        className={`flex-1 text-center py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
          isSignIn
            ? 'bg-sgbus-green text-night shadow-lg'
            : 'text-periwinkle hover:text-seasalt hover:bg-eerie-black/70'
        }`}
      >
        Login
      </Link>
      <Link
        href="/sign-up"
        className={`flex-1 text-center py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
          !isSignIn
            ? 'bg-sgbus-green text-night shadow-lg'
            : 'text-periwinkle hover:text-seasalt hover:bg-eerie-black/70'
        }`}
      >
        Registro
      </Link>
    </div>
  );
} 