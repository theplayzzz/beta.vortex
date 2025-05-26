'use client';

// import { FileText, CheckSquare, TrendingUp, BarChart } from 'lucide-react';
import FeatureCard from './feature-card';

export default function PromoSection() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Título e subtítulo */}
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-seasalt mb-4">
          Gerencie suas tarefas e projetos
        </h1>
        <p className="text-base lg:text-lg text-periwinkle max-w-2xl mx-auto">
          Controle seus backlogs, tarefas e vendas em uma única 
          plataforma. Aumente sua produtividade e organize 
          melhor seu trabalho.
        </p>
      </div>
      
      {/* Grid 2x2 de funcionalidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <FeatureCard 
          title="Backlogs"
          description="Organize suas ideias e planejamentos futuros."
          iconName="FileText"
        />
        <FeatureCard 
          title="Tarefas"
          description="Acompanhe sua lista de afazeres com prioridades."
          iconName="CheckSquare"
        />
        <FeatureCard 
          title="Vendas"
          description="Monitore suas vendas e resultados financeiros."
          iconName="TrendingUp"
        />
        <FeatureCard 
          title="Dashboard"
          description="Visualize métricas e estatísticas importantes."
          iconName="BarChart"
        />
      </div>
    </div>
  );
} 