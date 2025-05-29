'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
  createdAt?: Date;
}

export interface ClientFormContextData {
  client: Client | null;
  setClient: (client: Client | null) => void;
  isClientSelected: boolean;
  clearClient: () => void;
}

const ClientFormContext = createContext<ClientFormContextData | undefined>(undefined);

interface ClientFormProviderProps {
  children: ReactNode;
  client: Client | null;
  onClientChange: (client: Client | null) => void;
}

export function ClientFormProvider({ 
  children, 
  client, 
  onClientChange 
}: ClientFormProviderProps) {
  const setClient = (newClient: Client | null) => {
    onClientChange(newClient);
  };

  const clearClient = () => {
    onClientChange(null);
  };

  const value: ClientFormContextData = {
    client,
    setClient,
    isClientSelected: !!client,
    clearClient
  };

  return (
    <ClientFormContext.Provider value={value}>
      {children}
    </ClientFormContext.Provider>
  );
}

export function useClientFormContext() {
  const context = useContext(ClientFormContext);
  if (context === undefined) {
    throw new Error('useClientFormContext must be used within a ClientFormProvider');
  }
  return context;
}

export { ClientFormContext }; 