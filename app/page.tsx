import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">
            Bem-vindo, {user.firstName || "Usuário"}!
          </h1>
          <p className="text-seasalt/70 mt-1">
            Aqui está um resumo das suas atividades no Vortex Vault
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-seasalt/70">Créditos:</span>
          <span className="text-lg font-semibold text-sgbus-green">
            {user.creditBalance}
          </span>
        </div>
      </div>

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget Planejamentos */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Planejamentos</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <span className="text-sgbus-green text-sm font-bold">📋</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">0</div>
            <div className="text-sm text-seasalt/70">Planejamentos ativos</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <button className="text-sgbus-green text-sm hover:underline">
              Ver todos →
            </button>
          </div>
        </div>

        {/* Widget Tarefas */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Tarefas</h3>
            <div className="w-8 h-8 bg-periwinkle/20 rounded-lg flex items-center justify-center">
              <span className="text-periwinkle text-sm font-bold">✓</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">0</div>
            <div className="text-sm text-seasalt/70">Tarefas pendentes</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <button className="text-periwinkle text-sm hover:underline">
              Ver lista →
            </button>
          </div>
        </div>

        {/* Widget Clientes */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-seasalt">Clientes</h3>
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <span className="text-sgbus-green text-sm font-bold">👥</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-seasalt">0</div>
            <div className="text-sm text-seasalt/70">Clientes cadastrados</div>
          </div>
          <div className="mt-4 pt-4 border-t border-accent/20">
            <button className="text-sgbus-green text-sm hover:underline">
              Gerenciar →
            </button>
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group">
            <div className="text-sgbus-green text-2xl mb-2">📋</div>
            <div className="text-seasalt font-medium">Novo Planejamento</div>
            <div className="text-seasalt/70 text-sm mt-1">Criar estratégia com IA</div>
          </button>
          
          <button className="p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group">
            <div className="text-periwinkle text-2xl mb-2">👥</div>
            <div className="text-seasalt font-medium">Novo Cliente</div>
            <div className="text-seasalt/70 text-sm mt-1">Cadastrar cliente</div>
          </button>
          
          <button className="p-4 bg-sgbus-green/10 hover:bg-sgbus-green/20 rounded-lg border border-sgbus-green/20 transition-colors group">
            <div className="text-sgbus-green text-2xl mb-2">💬</div>
            <div className="text-seasalt font-medium">Chat IA</div>
            <div className="text-seasalt/70 text-sm mt-1">Conversar com assistente</div>
          </button>
          
          <button className="p-4 bg-periwinkle/10 hover:bg-periwinkle/20 rounded-lg border border-periwinkle/20 transition-colors group opacity-50 cursor-not-allowed">
            <div className="text-periwinkle text-2xl mb-2">📊</div>
            <div className="text-seasalt font-medium">Vendas</div>
            <div className="text-seasalt/70 text-sm mt-1">Em breve</div>
          </button>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <h3 className="text-lg font-semibold text-seasalt mb-4">Atividade Recente</h3>
        <div className="text-center py-8">
          <div className="text-seasalt/50 text-4xl mb-4">📝</div>
          <div className="text-seasalt/70">Nenhuma atividade ainda</div>
          <div className="text-seasalt/50 text-sm mt-2">
            Suas ações aparecerão aqui conforme você usa a plataforma
          </div>
        </div>
      </div>
    </div>
  );
}
