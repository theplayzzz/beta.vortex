import { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getQuestionsForSector, Question } from '@/lib/planning/sectorQuestions';
import { SetorPermitido } from '@/lib/planning/sectorConfig';
import { QuestionField } from '../QuestionField';
import { EyeOff } from 'lucide-react';

/**
 * Verifica se um campo condicional deve estar visível baseado no valor do campo dependente
 */
function checkConditionalVisibility(dependentValue: any, showWhen: string[]): boolean {
  // Tratar valores undefined/null
  if (dependentValue === undefined || dependentValue === null) {
    return false;
  }
  
  // Para valores boolean (campos toggle)
  if (typeof dependentValue === 'boolean') {
    const booleanString = dependentValue.toString(); // true -> "true", false -> "false"
    return showWhen.includes(booleanString);
  }
  
  // Para arrays (campos multiselect)
  if (Array.isArray(dependentValue)) {
    // Verificar se algum dos valores do array está em showWhen
    return dependentValue.some(item => showWhen.includes(String(item)));
  }
  
  // Para outros tipos, converter para string e comparar
  const stringValue = String(dependentValue);
  return showWhen.includes(stringValue);
}

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
      const shouldBeVisible = checkConditionalVisibility(dependentValue, question.conditional.showWhen);
      
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

  // Organizar perguntas na ordem correta (principais com suas condicionais logo após)
  const organizedQuestions = useMemo(() => {
    const result: Question[] = [];
    const processedConditionals = new Set<string>();
    
    // Para cada pergunta principal
    questions.filter(q => !q.conditional).forEach(mainQuestion => {
      // Adicionar pergunta principal
      result.push(mainQuestion);
      
      // Procurar perguntas condicionais que dependem desta
      const relatedConditionals = questions.filter(q => 
        q.conditional && 
        q.conditional.dependsOn === mainQuestion.field &&
        !processedConditionals.has(q.field)
      );
      
      relatedConditionals.forEach(conditional => {
        result.push(conditional);
        processedConditionals.add(conditional.field);
      });
    });
    
    // Adicionar perguntas condicionais órfãs (que dependem de campos não encontrados)
    questions.filter(q => 
      q.conditional && !processedConditionals.has(q.field)
    ).forEach(orphan => {
      result.push(orphan);
    });
    
    return result;
  }, [questions]);

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
          As perguntas aparecerão quando forem adicionadas para &quot;{sector}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 form-container">
      {/* Renderizar perguntas na ordem organizada */}
      {organizedQuestions.map((question, index) => {
        const isVisible = !question.conditional || visibleFields.has(question.field);
        
        if (!isVisible) return null;
        
        const isConditional = !!question.conditional;
        
        return (
          <div 
            key={question.field}
            className={`
              transform transition-all duration-300 ease-out
              ${isConditional ? 'ml-6 pl-4 border-l-2 border-orange-400/30' : ''}
              ${animatingFields.has(question.field) ? 'animate-pulse scale-105' : ''}
            `}
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
        );
      })}

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
          </div>
        </div>
      </div>
    </div>
  );
}); 