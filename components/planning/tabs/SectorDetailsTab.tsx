import { memo, useState, useEffect } from 'react';
import { getQuestionsForSector } from '@/lib/planning/sectorQuestions';
import { SetorPermitido } from '@/lib/planning/sectorConfig';
import { QuestionField } from '../QuestionField';

interface SectorDetailsTabProps {
  sector: SetorPermitido;
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: () => void;
  errors: Record<string, string>;
}

export const SectorDetailsTab = memo(function SectorDetailsTab({ 
  sector, 
  formData, 
  onFieldChange, 
  onFieldBlur,
  errors 
}: SectorDetailsTabProps) {
  const questions = getQuestionsForSector(sector);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Lógica para mostrar/ocultar campos condicionais
  useEffect(() => {
    const newVisibleFields = new Set<string>();
    
    questions.forEach(question => {
      // Campo sempre visível se não tem condição
      if (!question.conditional) {
        newVisibleFields.add(question.field);
        return;
      }
      
      // Verificar se condição é atendida
      const dependentValue = formData[question.conditional.dependsOn];
      const stringValue = String(dependentValue);
      if (question.conditional.showWhen.includes(stringValue)) {
        newVisibleFields.add(question.field);
      } else {
        // Se campo não deve ser visível, limpar seu valor
        if (formData[question.field] !== undefined) {
          onFieldChange(question.field, undefined);
        }
      }
    });
    
    setVisibleFields(newVisibleFields);
  }, [questions, formData, onFieldChange]);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-periwinkle">
          Nenhuma pergunta específica configurada para este setor.
        </p>
      </div>
    );
  }

  // Filtrar perguntas visíveis
  const visibleQuestions = questions.filter(q => visibleFields.has(q.field));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          Detalhes Específicos - {sector}
        </h3>
        <p className="text-periwinkle text-sm">
          Responda as perguntas abaixo para personalizarmos melhor o seu planejamento estratégico.
        </p>
      </div>

      {visibleQuestions.map((question, index) => (
        <div key={question.field} className="space-y-4">
          <QuestionField
            question={question}
            value={formData[question.field]}
            onChange={(value) => onFieldChange(question.field, value)}
            onBlur={onFieldBlur}
            error={errors[question.field]}
          />
          
          {/* Indicador visual para campos condicionais */}
          {question.conditional && (
            <div className="ml-4 pl-4 border-l-2 border-sgbus-green/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-sgbus-green/50 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-periwinkle">
                    Campo condicional - Aparece quando "{question.conditional.dependsOn}" 
                    está em: {question.conditional.showWhen.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Contador de progresso */}
      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-seasalt font-medium">Progresso da Seção</h4>
          <span className="text-sgbus-green text-sm font-medium">
            {visibleQuestions.filter(q => formData[q.field] !== undefined && formData[q.field] !== '' && formData[q.field] !== null).length} / {visibleQuestions.length}
          </span>
        </div>
        
        <div className="w-full bg-seasalt/10 rounded-full h-2">
          <div 
            className="bg-sgbus-green h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(visibleQuestions.filter(q => formData[q.field] !== undefined && formData[q.field] !== '' && formData[q.field] !== null).length / visibleQuestions.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-sgbus-green/20 rounded-full flex items-center justify-center">
              <span className="text-sgbus-green text-sm">💡</span>
            </div>
          </div>
          <div>
            <h4 className="text-seasalt font-medium mb-1">Dica</h4>
            <p className="text-periwinkle text-sm">
              Quanto mais detalhadas forem suas respostas, mais personalizado e eficaz será 
              o planejamento estratégico gerado pela IA. 
              {visibleQuestions.some(q => q.conditional) && (
                <span className="block mt-2">
                  <span className="inline-block w-2 h-2 bg-sgbus-green/50 rounded-full mr-2"></span>
                  Algumas perguntas aparecem baseadas nas suas respostas anteriores.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}); 