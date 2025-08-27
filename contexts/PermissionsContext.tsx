'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { UserPermissions, Modalidade, getPermissionsForStatus } from '@/types/permissions';
import { hasAccess, getAllowedRoutesForUser } from '@/lib/permissions';

interface PermissionsContextType {
  permissions: UserPermissions | null;
  isLoading: boolean;
  checkAccess: (modalidade: Modalidade) => boolean;
  getAllowedRoutes: () => string[];
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: null,
  isLoading: true,
  checkAccess: () => false,
  getAllowedRoutes: () => [],
  refreshPermissions: async () => {}
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!isLoaded || !userLoaded || !userId || !user) {
      setIsLoading(false);
      setPermissions(null);
      return;
    }

    try {
      const publicMetadata = user.publicMetadata as any;
      const status = publicMetadata?.approvalStatus || 'PENDING';
      const role = publicMetadata?.role || 'USER';
      
      const userPermissions = getPermissionsForStatus(status, role);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, userLoaded, userId, user]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const checkAccess = useCallback((modalidade: Modalidade): boolean => {
    return hasAccess(modalidade, permissions);
  }, [permissions]);

  const getAllowedRoutes = useCallback((): string[] => {
    return getAllowedRoutesForUser(permissions);
  }, [permissions]);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    await loadPermissions();
  }, [loadPermissions]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        checkAccess,
        getAllowedRoutes,
        refreshPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}