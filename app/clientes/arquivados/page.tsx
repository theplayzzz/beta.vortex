import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Archive, RotateCcw } from "lucide-react";
import ArchivedClientsList from "@/components/client/archived-clients-list";

export const metadata: Metadata = {
  title: "Clientes Arquivados | Vortex Vault",
  description: "Gerencie clientes arquivados",
};

export default function ClientesArquivadosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/clientes"
            className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-seasalt" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-seasalt flex items-center gap-3">
              <Archive className="h-8 w-8 text-periwinkle" />
              Clientes Arquivados
            </h1>
            <p className="text-periwinkle mt-2">
              Visualize e restaure clientes que foram arquivados
            </p>
          </div>
        </div>
      </div>

      {/* Lista de clientes arquivados */}
      <ArchivedClientsList />
    </div>
  );
} 