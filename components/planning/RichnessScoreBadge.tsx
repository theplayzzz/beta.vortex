interface RichnessScoreBadgeProps {
  score: number; // 0-100
}

export function RichnessScoreBadge({ score }: RichnessScoreBadgeProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 80) return { 
      label: "Rico", 
      color: "bg-green-500", 
      icon: "🏆",
      textColor: "text-white"
    };
    if (score >= 60) return { 
      label: "Bom", 
      color: "bg-yellow-500", 
      icon: "⭐",
      textColor: "text-white"
    };
    if (score >= 40) return { 
      label: "Médio", 
      color: "bg-orange-500", 
      icon: "📊",
      textColor: "text-white"
    };
    return { 
      label: "Básico", 
      color: "bg-red-500", 
      icon: "📝",
      textColor: "text-white"
    };
  };
  
  const config = getScoreConfig(score);
  
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.textColor}`}>
      <span>{config.icon}</span>
      <span>{config.label} ({score}%)</span>
    </div>
  );
} 