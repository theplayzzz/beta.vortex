interface FormProgressProps {
  currentProgress: number; // 0-100
  currentTab: number;      // 0-3
}

export function FormProgress({ currentProgress, currentTab }: FormProgressProps) {
  const sectionWeights = {
    informacoesBasicas: 25,
    detalhesSetor: 25,
    marketing: 25,
    comercial: 25
  };

  const sections = [
    { id: "informacoesBasicas", label: "Informações Básicas" },
    { id: "detalhesSetor", label: "Detalhes do Setor" },
    { id: "marketing", label: "Marketing" },
    { id: "comercial", label: "Comercial" }
  ];
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-periwinkle">Progresso do Formulário</span>
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
            <span className="text-center leading-tight max-w-16">
              {section.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 