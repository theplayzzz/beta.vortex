import { FileText, CheckSquare, TrendingUp, BarChart } from 'lucide-react';
import FeatureCard from './feature-card';

export default function PromoSection() {
  return (
    <div className="space-y-8">
      {/* Título e subtítulo */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-seasalt mb-4">
          Gerencie suas tarefas e projetos
        </h1>
        <p className="text-lg text-periwinkle">
          Controle seus backlogs, tarefas e vendas em uma única 
          plataforma. Aumente sua produtividade e organize 
          melhor seu trabalho.
        </p>
      </div>
      
      {/* Grid 2x2 de funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard 
          title="Backlogs"
          description="Organize suas ideias e planejamentos futuros."
          icon={<FileText className="w-8 h-8" />}
        />
        <FeatureCard 
          title="Tarefas"
          description="Acompanhe sua lista de afazeres com prioridades."
          icon={<CheckSquare className="w-8 h-8" />}
        />
        <FeatureCard 
          title="Vendas"
          description="Monitore suas vendas e resultados financeiros."
          icon={<TrendingUp className="w-8 h-8" />}
        />
        <FeatureCard 
          title="Dashboard"
          description="Visualize métricas e estatísticas importantes."
          icon={<BarChart className="w-8 h-8" />}
        />
      </div>
    </div>
  );
} 