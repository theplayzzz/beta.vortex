interface ProposalProgressProps {
  currentProgress: number; // 0-100
  currentTab: number;      // 0-2 (para 3 abas)
}

export function ProposalProgress({ currentProgress, currentTab }: ProposalProgressProps) {
  const sectionWeights = {
    informacoesBasicas: 33,
    escopo: 34,
    comercial: 33
  };

  const sections = [
    { id: "informacoesBasicas", label: "Informações Básicas" },
    { id: "escopo", label: "Escopo de Serviços" },
    { id: "comercial", label: "Contexto Comercial" }
  ];
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-periwinkle">Progresso da Proposta</span>
        <span className="text-sm text-seasalt font-medium">{currentProgress}%</span>
      </div>
      
      {/* Barra de progresso principal */}
      <div className="w-full bg-eerie-black rounded-full h-2 mb-3">
        <div 
          className="bg-sgbus-green h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${currentProgress}%` }}
        />
      </div>
      
      {/* Indicadores de seção */}
      <div className="flex justify-between text-xs">
        {sections.map((section, index) => (
          <div 
            key={section.id}
            className={`flex flex-col items-center ${
              index === currentTab 
                ? 'text-sgbus-green' 
                : index < currentTab 
                  ? 'text-seasalt' 
                  : 'text-periwinkle/60'
            }`}
          >
            <div 
              className={`w-3 h-3 rounded-full mb-1 ${
                index === currentTab
                  ? 'bg-sgbus-green' 
                  : index < currentTab
                    ? 'bg-seasalt'
                    : 'bg-periwinkle/30'
              }`}
            />
            <span className="text-center leading-tight max-w-20">
              {section.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 