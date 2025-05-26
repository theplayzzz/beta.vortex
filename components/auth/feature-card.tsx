'use client';

import { ReactNode } from 'react';
import { FileText, CheckSquare, TrendingUp, BarChart } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  iconName: 'FileText' | 'CheckSquare' | 'TrendingUp' | 'BarChart';
}

const iconMap = {
  FileText: FileText,
  CheckSquare: CheckSquare,
  TrendingUp: TrendingUp,
  BarChart: BarChart,
};

export default function FeatureCard({ title, description, iconName }: FeatureCardProps) {
  const IconComponent = iconMap[iconName];
  
  return (
    <div className="bg-eerie-black/50 border border-seasalt/10 rounded-2xl p-6 hover:bg-eerie-black/70 transition-colors duration-200">
      <div className="text-sgbus-green mb-4 w-8 h-8">
        <IconComponent className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-seasalt mb-2">
        {title}
      </h3>
      <p className="text-periwinkle">
        {description}
      </p>
    </div>
  );
} 