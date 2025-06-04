import { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getQuestionsForSector } from '@/lib/planning/sectorQuestions';
import { SetorPermitido } from '@/lib/planning/sectorConfig';
import { QuestionField } from '../QuestionField';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';

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
  const [animatingFields, setAnimatingFields] = useState<Set<string>>(new Set());
  const visibleFieldsRef = useRef(visibleFields);

  // Manter ref atualizada
  useEffect(() => {
    visibleFieldsRef.current = visibleFields;
  }, [visibleFields]);

  // Memoizar cálculos pesados
  const { totalQuestions, conditionalQuestions, mainQuestions } = useMemo(() => {
    const conditional = questions.filter(q => q.conditional);
    const main = questions.filter(q => !q.conditional);
    
    return {
      totalQuestions: questions.length,
      conditionalQuestions: conditional,
      mainQuestions: main
    };
  }, [questions]);

  // Estabilizar a função onFieldChange
  const stableOnFieldChange = useCallback((field: string, value: any) => {
    onFieldChange(field, value);
  }, [onFieldChange]);

  // Lógica para mostrar/ocultar campos condicionais
  useEffect(() => {
    const newVisibleFields = new Set<string>();
    const currentVisible = visibleFieldsRef.current;
    let fieldsToAnimate: string[] = [];
    
    questions.forEach(question => {
      // Campo sempre visível se não tem condição
      if (!question.conditional) {
        newVisibleFields.add(question.field);
        return;
      }
      
      // Verificar se condição é atendida
      const dependentValue = formData[question.conditional.dependsOn];
      const stringValue = String(dependentValue);
      const shouldBeVisible = question.conditional.showWhen.includes(stringValue);
      
      if (shouldBeVisible) {
        newVisibleFields.add(question.field);
        // Campo que apareceu agora
        if (!currentVisible.has(question.field)) {
          fieldsToAnimate.push(question.field);
        }
      } else {
        // Se campo não deve ser visível, limpar seu valor
        const currentValue = formData[question.field];
        if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
          stableOnFieldChange(question.field, undefined);
        }
      }
    });
    
    // Só atualizar se houve mudança real
    const hasChanges = newVisibleFields.size !== currentVisible.size || 
                      Array.from(newVisibleFields).some(field => !currentVisible.has(field));
    
    if (hasChanges) {
      setVisibleFields(newVisibleFields);
      
      // Animar campos que apareceram
      if (fieldsToAnimate.length > 0) {
        setAnimatingFields(new Set(fieldsToAnimate));
        
        // Parar animação após um tempo
        const timer = setTimeout(() => {
          setAnimatingFields(new Set());
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [questions, formData, stableOnFieldChange]);

  // Calcular progresso
  const { filledFields, progress } = useMemo(() => {
    const visibleQuestions = questions.filter(q => visibleFields.has(q.field));
    const filled = visibleQuestions.filter(q => {
      const value = formData[q.field];
      return value !== undefined && value !== '' && value !== null && 
             (!Array.isArray(value) || value.length > 0);
    }).length;
    
    return {
      filledFields: filled,
      progress: visibleQuestions.length > 0 ? Math.round((filled / visibleQuestions.length) * 100) : 0
    };
  }, [questions, visibleFields, formData]);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-periwinkle/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <EyeOff className="w-8 h-8 text-periwinkle" />
        </div>
        <p className="text-periwinkle text-lg">
          Nenhuma pergunta específica configurada para este setor.
        </p>
        <p className="text-periwinkle/70 text-sm mt-2">
          As perguntas aparecerão quando forem adicionadas para "{sector}".
        </p>
      </div>
    );
  }

  // Filtrar e ordenar perguntas visíveis
  const visibleQuestions = questions.filter(q => visibleFields.has(q.field));
  const groupedQuestions = {
    main: visibleQuestions.filter(q => !q.conditional),
    conditional: visibleQuestions.filter(q => q.conditional)
  };

  return (
    <div className="space-y-8 form-container">
      {/* Header com estatísticas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-seasalt mb-2">
              Detalhes Específicos - {sector}
            </h3>
            <p className="text-periwinkle text-sm">
              Responda as perguntas abaixo para personalizarmos melhor o seu planejamento estratégico.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-sgbus-green">{progress}%</div>
            <div className="text-xs text-periwinkle">Completo</div>
          </div>
        </div>

        {/* Barra de progresso principal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-seasalt font-medium">Progresso da Seção</span>
            <span className="text-periwinkle">
              {filledFields} de {visibleQuestions.length} perguntas
            </span>
          </div>
          <div className="w-full bg-seasalt/10 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sgbus-green to-sgbus-green/80 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-eerie-black rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-seasalt">{mainQuestions.length}</div>
            <div className="text-xs text-periwinkle">Principais</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-sgbus-green">{conditionalQuestions.length}</div>
            <div className="text-xs text-periwinkle">Condicionais</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">{visibleQuestions.length}</div>
            <div className="text-xs text-periwinkle">Visíveis</div>
          </div>
        </div>
      </div>

      {/* Perguntas principais */}
      {groupedQuestions.main.length > 0 && (
        <section className="space-y-6 form-section">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-sgbus-green rounded-full" />
            <h4 className="text-lg font-medium text-seasalt">Informações Principais</h4>
            <span className="text-sm text-periwinkle">({groupedQuestions.main.length})</span>
          </div>
          
          {groupedQuestions.main.map((question, index) => (
            <div 
              key={question.field}
              className="transform transition-all duration-300 ease-out"
              style={{ 
                animationDelay: `${index * 50}ms`,
                opacity: animatingFields.has(question.field) ? 0.7 : 1 
              }}
            >
              <QuestionField
                question={question}
                value={formData[question.field]}
                onChange={(value) => stableOnFieldChange(question.field, value)}
                onBlur={onFieldBlur}
                error={errors[question.field]}
              />
            </div>
          ))}
        </section>
      )}

      {/* Perguntas condicionais */}
      {groupedQuestions.conditional.length > 0 && (
        <section className="space-y-6 form-section">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-orange-400 rounded-full" />
            <h4 className="text-lg font-medium text-seasalt">Perguntas Dinâmicas</h4>
            <span className="text-sm text-periwinkle">({groupedQuestions.conditional.length})</span>
            <Eye className="w-4 h-4 text-orange-400" />
          </div>
          
          {groupedQuestions.conditional.map((question, index) => (
            <div 
              key={question.field}
              className={`
                transform transition-all duration-300 ease-out border-l-2 border-orange-400/30 pl-6 ml-2
                ${animatingFields.has(question.field) ? 'animate-pulse scale-105' : ''}
              `}
              style={{ animationDelay: `${(groupedQuestions.main.length + index) * 50}ms` }}
            >
              <QuestionField
                question={question}
                value={formData[question.field]}
                onChange={(value) => stableOnFieldChange(question.field, value)}
                onBlur={onFieldBlur}
                error={errors[question.field]}
              />
              
              {/* Indicador de dependência */}
              <div className="mt-3 p-3 bg-orange-400/10 rounded-lg border border-orange-400/20">
                <div className="flex items-start space-x-3">
                  <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-orange-400 font-medium">
                      Campo condicional
                    </p>
                    <p className="text-xs text-periwinkle mt-1">
                      Aparece quando <strong>"{question.conditional?.dependsOn}"</strong> está em: 
                      <span className="text-orange-400"> {question.conditional?.showWhen.join(', ')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Dica final */}
      <div className="mt-8 p-6 bg-gradient-to-r from-eerie-black to-night rounded-lg border border-sgbus-green/20">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-full flex items-center justify-center">
              <span className="text-sgbus-green text-lg">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-seasalt font-medium mb-2">Dica de Preenchimento</h4>
            <p className="text-periwinkle text-sm leading-relaxed">
              Quanto mais detalhadas forem suas respostas, mais personalizado e eficaz será 
              o planejamento estratégico gerado pela IA. 
            </p>
            {conditionalQuestions.length > 0 && (
              <div className="mt-3 p-3 bg-orange-400/10 rounded border border-orange-400/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-orange-400 font-medium">
                    {conditionalQuestions.length} perguntas aparecem baseadas nas suas respostas anteriores
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}); 