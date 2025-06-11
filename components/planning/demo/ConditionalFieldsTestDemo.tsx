'use client';

import { useState } from 'react';
import { SectorDetailsTab } from '../tabs/SectorDetailsTab';
import { createDetalhesSetorSchema } from '@/lib/planning/formSchema';
import { getQuestionsForSector } from '@/lib/planning/sectorQuestions';
import type { SetorPermitido } from '@/lib/planning/sectorConfig';

export function ConditionalFieldsTestDemo() {
  const [selectedSector, setSelectedSector] = useState<SetorPermitido>('Alimentação');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove error when field is filled
    if (errors[field] && value !== undefined && value !== '' && value !== null) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = () => {
    console.log('💾 Auto-save simulado:', formData);
  };

  const testValidation = () => {
    try {
      const schema = createDetalhesSetorSchema(selectedSector);
      const result = schema.safeParse(formData);
      
      setValidationResult(result);
      
      if (result.success) {
        alert('✅ Validação passou! Formulário pode ser submetido.');
        console.log('✅ Dados válidos:', result.data);
      } else {
        console.error('❌ Erros de validação:', result.error.flatten());
        
        // Extrair erros específicos
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        
        setErrors(fieldErrors);
        alert('❌ Há erros de validação. Verifique os campos marcados.');
      }
    } catch (error) {
      console.error('💥 Erro na validação:', error);
      alert('💥 Erro interno na validação.');
    }
  };

  const resetForm = () => {
    setFormData({});
    setErrors({});
    setValidationResult(null);
  };

  const questions = getQuestionsForSector(selectedSector);
  const conditionalQuestions = questions.filter(q => q.conditional);
  const requiredConditionalQuestions = conditionalQuestions.filter(q => q.required);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-seasalt">
          🧪 Teste: Campos Condicionais
        </h1>
        <p className="text-periwinkle max-w-3xl mx-auto">
          Este demo testa especificamente o problema dos campos condicionais obrigatórios 
          que não deveriam impedir o submit quando não estão visíveis.
        </p>
      </div>

      {/* Test Info */}
      <div className="bg-eerie-black p-6 rounded-lg">
        <h3 className="text-seasalt font-medium mb-4">Informações do Teste</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-periwinkle">Setor:</span>
            <p className="text-seasalt font-medium">{selectedSector}</p>
          </div>
          <div>
            <span className="text-periwinkle">Campos Condicionais:</span>
            <p className="text-seasalt font-medium">{conditionalQuestions.length}</p>
          </div>
          <div>
            <span className="text-periwinkle">Condicionais Obrigatórios:</span>
            <p className="text-seasalt font-medium">{requiredConditionalQuestions.length}</p>
          </div>
        </div>
        
        {requiredConditionalQuestions.length > 0 && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <h4 className="text-orange-400 font-medium mb-2">Campos Condicionais Obrigatórios:</h4>
            <ul className="text-orange-300 text-sm space-y-1">
              {requiredConditionalQuestions.map(q => (
                <li key={q.field}>
                  • <strong>{q.label}</strong> (aparece quando "{q.conditional?.dependsOn}" = {q.conditional?.showWhen.join(' ou ')})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-night border border-seasalt/20 rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-seasalt font-medium">Formulário Dinâmico - {selectedSector}</h3>
          <button
            onClick={() => setSelectedSector(selectedSector === 'Alimentação' ? 'Educação' : 'Alimentação')}
            className="px-3 py-1 text-sm bg-sgbus-green/20 text-sgbus-green rounded-lg hover:bg-sgbus-green/30 transition-colors"
          >
            Alternar para {selectedSector === 'Alimentação' ? 'Educação' : 'Alimentação'}
          </button>
        </div>
        
        <SectorDetailsTab
          sector={selectedSector}
          formData={formData}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          errors={errors}
        />
      </div>

      {/* Test Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={testValidation}
          className="px-6 py-3 bg-sgbus-green text-white rounded-lg hover:bg-sgbus-green/90 transition-colors font-medium"
        >
          🧪 Testar Validação (Submit)
        </button>
        
        <button
          onClick={resetForm}
          className="px-6 py-3 bg-eerie-black text-seasalt border border-seasalt/20 rounded-lg hover:bg-seasalt/10 transition-colors"
        >
          🔄 Resetar Formulário
        </button>
        
        <button
          onClick={() => console.log('📊 Estado completo:', { selectedSector, formData, errors, validationResult })}
          className="px-6 py-3 bg-night text-periwinkle border border-seasalt/20 rounded-lg hover:bg-seasalt/5 transition-colors"
        >
          🔍 Debug no Console
        </button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className={`p-4 rounded-lg border ${
          validationResult.success 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <h4 className={`font-medium mb-2 ${
            validationResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {validationResult.success ? '✅ Validação Passou' : '❌ Erros de Validação'}
          </h4>
          
          {!validationResult.success && (
            <div className="text-red-300 text-sm">
              <pre className="bg-black/20 p-3 rounded overflow-x-auto">
                {JSON.stringify(validationResult.error.flatten(), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Real-time Data */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-3">📊 Dados Atuais</h4>
          <pre className="text-periwinkle text-sm overflow-x-auto bg-night p-3 rounded border border-seasalt/10 max-h-60">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-3">⚠️ Erros Atuais</h4>
          <pre className="text-red-300 text-sm overflow-x-auto bg-night p-3 rounded border border-seasalt/10 max-h-60">
            {Object.keys(errors).length > 0 
              ? JSON.stringify(errors, null, 2)
              : 'Nenhum erro no momento'
            }
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-eerie-black to-night p-6 rounded-lg border border-sgbus-green/20">
        <h4 className="text-seasalt font-medium mb-3">📋 Como Testar</h4>
        <ol className="text-periwinkle text-sm space-y-2 list-decimal list-inside">
          <li>Preencha apenas alguns campos <strong>não condicionais</strong> (deixe campos "Outro" vazios)</li>
          <li>Clique em <strong>"Testar Validação"</strong> - deveria PASSAR</li>
          <li>Agora selecione uma opção que ativa um campo condicional (ex: "Outro")</li>
          <li>Deixe o campo condicional vazio e teste novamente - deveria FALHAR</li>
          <li>Preencha o campo condicional e teste - deveria PASSAR</li>
        </ol>
        <p className="text-sgbus-green text-sm mt-4 font-medium">
          ✅ Se seguir essa lógica, o problema dos campos condicionais foi resolvido!
        </p>
      </div>
    </div>
  );
} 