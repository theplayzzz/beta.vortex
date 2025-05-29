import { getQuestionsForSector } from '@/lib/planning/sectorQuestions';
import { SetorPermitido } from '@/lib/planning/sectorConfig';
import { QuestionField } from '../QuestionField';

interface SectorDetailsTabProps {
  sector: SetorPermitido;
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function SectorDetailsTab({ 
  sector, 
  formData, 
  onFieldChange, 
  errors 
}: SectorDetailsTabProps) {
  const questions = getQuestionsForSector(sector);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-periwinkle">
          Nenhuma pergunta específica configurada para este setor.
        </p>
      </div>
    );
  }

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

      {questions.map((question) => (
        <QuestionField
          key={question.field}
          question={question}
          value={formData[question.field]}
          onChange={(value) => onFieldChange(question.field, value)}
          error={errors[question.field]}
        />
      ))}

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
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 