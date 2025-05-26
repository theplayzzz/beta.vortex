import { Metadata } from "next";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import ClientListWithFilters from "@/components/client/client-list-with-filters";

export const metadata: Metadata = {
  title: "Clientes | Vortex Vault",
  description: "Gestão completa de clientes",
};

export default function ClientesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-seasalt">Lista de Clientes</h1>
          <p className="text-periwinkle mt-2">
            Gerencie todos os seus clientes em um só lugar
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
        >
          <Users className="h-4 w-4 mr-2" />
          Novo Cliente
        </Link>
      </div>

      {/* Lista com filtros */}
      <ClientListWithFilters />
    </div>
  );
} 