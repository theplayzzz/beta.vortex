import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Monitor, Mic, MicOff, ScreenShare, Trash2, Brain, HelpCircle, Settings, User } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Etapa 1: Configuração e Início da Sessão",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
              <Play size={28} style={{ color: 'var(--sgbus-green)' }} />
            </div>
            <p className="text-base" style={{ color: 'var(--seasalt)' }}>
              <strong>Configure sua sessão</strong> e inicie a captura de áudio
            </p>
          </div>

          {/* Contexto do Formulário */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <Settings size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>Informações do Cliente</h4>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--seasalt)' }}>
              O formulário preenchido anteriormente <strong>alimenta automaticamente o contexto</strong> do agente de IA.
            </p>
            <p className="text-xs opacity-70" style={{ color: 'var(--periwinkle)' }}>
              Dados do cliente + transcrição = análises mais precisas e personalizadas
            </p>
          </div>

          {/* Botão Conectar */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)', border: '1px solid rgba(107, 233, 76, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
                <Play size={16} style={{ color: 'var(--sgbus-green)' }} />
              </div>
              <h4 className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>1. Clique &quot;CONECTAR&quot;</h4>
            </div>
            <ul className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
              <li>• Sistema abre automaticamente o popup de compartilhamento</li>
              <li>• Aguarde o carregamento da interface de captura</li>
            </ul>
          </div>

          {/* Escolha da Tela */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <Monitor size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>2. Selecione Tela/Janela</h4>
            </div>
            <div className="text-sm space-y-2" style={{ color: 'var(--seasalt)' }}>
              <p><strong style={{ color: 'var(--sgbus-green)' }}>CRÍTICO:</strong> Marque <strong>&quot;Compartilhar áudio da aba&quot;</strong></p>
              <p>• <strong>Tela Inteira:</strong> captura tudo na tela</p>
              <p>• <strong>Janela Específica:</strong> captura apenas uma aplicação</p>
              <p>• <strong>Aba do Navegador:</strong> melhor qualidade de áudio</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Etapa 2: Controles de Áudio e Transcrição",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(207, 198, 254, 0.2)' }}>
              <Mic size={28} style={{ color: 'var(--periwinkle)' }} />
            </div>
            <p className="text-base" style={{ color: 'var(--seasalt)' }}>
              <strong>Gerencie as fontes de áudio</strong> e acompanhe a transcrição em tempo real
            </p>
          </div>

          {/* Status de Conexão */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)', border: '1px solid rgba(107, 233, 76, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--sgbus-green)' }}></div>
              <h4 className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>Status &quot;CONECTADO&quot;</h4>
            </div>
            <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
              Quando aparecer em verde, a transcrição iniciará automaticamente (até 3 segundos)
            </p>
          </div>

          {/* Controles de Microfone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)', border: '1px solid rgba(249, 251, 252, 0.1)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Mic size={18} style={{ color: 'var(--sgbus-green)' }} />
                <MicOff size={18} style={{ color: '#ef4444' }} />
              </div>
              <h5 className="font-semibold text-sm mb-1" style={{ color: 'var(--seasalt)' }}>Microfone</h5>
              <p className="text-xs opacity-70" style={{ color: 'var(--seasalt)' }}>
                Liga/desliga captura do seu microfone
              </p>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)', border: '1px solid rgba(249, 251, 252, 0.1)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <ScreenShare size={18} style={{ color: 'var(--sgbus-green)' }} />
                <Monitor size={18} style={{ color: '#ef4444' }} />
              </div>
              <h5 className="font-semibold text-sm mb-1" style={{ color: 'var(--seasalt)' }}>Áudio da Tela</h5>
              <p className="text-xs opacity-70" style={{ color: 'var(--seasalt)' }}>
                Liga/desliga captura do áudio da tela compartilhada
              </p>
            </div>
          </div>

          {/* Botão Compartilhar */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <ScreenShare size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>Botão Compartilhar</h4>
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
              <p>• <strong>Trocar tela:</strong> seleciona nova tela/janela para compartilhar</p>
              <p>• <strong>Parar compartilhamento:</strong> encerra captura da tela atual</p>
            </div>
          </div>

          {/* Separação de Fontes */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-2 mb-3">
              <Settings size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>
                Separação Inteligente de Áudio
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)', border: '1px solid rgba(107, 233, 76, 0.2)' }}>
                <ScreenShare size={20} className="mx-auto mb-2" style={{ color: 'var(--sgbus-green)' }} />
                <div className="font-semibold mb-1" style={{ color: 'var(--sgbus-green)' }}>ÁUDIO DA TELA</div>
                <p className="text-xs opacity-80" style={{ color: 'var(--seasalt)' }}>Transcrições em <strong style={{ color: 'var(--sgbus-green)' }}>verde</strong><br/>quando captura áudio da tela compartilhada</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
                <Mic size={20} className="mx-auto mb-2" style={{ color: 'var(--periwinkle)' }} />
                <div className="font-semibold mb-1" style={{ color: 'var(--periwinkle)' }}>SEU MICROFONE</div>
                <p className="text-xs opacity-80" style={{ color: 'var(--seasalt)' }}>Transcrições em <strong style={{ color: 'var(--periwinkle)' }}>azul</strong><br/>quando captura seu microfone</p>
              </div>
            </div>
            <p className="text-xs mt-4 opacity-70" style={{ color: 'var(--periwinkle)' }}>
              <strong>Sistema identifica automaticamente</strong> a origem de cada fala e aplica as cores correspondentes na transcrição em tempo real
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Etapa 3: Análise por IA e Gerenciamento",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
              <Brain size={28} style={{ color: 'var(--sgbus-green)' }} />
            </div>
            <p className="text-base" style={{ color: 'var(--seasalt)' }}>
              <strong>Análise inteligente</strong> combina contexto do cliente + transcrição
            </p>
          </div>

          {/* Botões de Análise */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)', border: '1px solid rgba(107, 233, 76, 0.2)' }}>
              <div className="flex items-center space-x-3 mb-3">
                <Brain size={20} style={{ color: 'var(--sgbus-green)' }} />
                <h4 className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>Análise Ampla (Verde)</h4>
              </div>
              <div className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
                <p>• <strong>Análise detalhada e completa</strong> do contexto</p>
                <p>• Combina: dados do cliente + toda a transcrição</p>
                <p>• Recomendações estratégicas e insights aprofundados</p>
                <p>• Ideal para sessões longas com muito conteúdo</p>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
              <div className="flex items-center space-x-3 mb-3">
                <Brain size={20} style={{ color: 'rgba(255, 193, 7, 1)' }} />
                <h4 className="font-semibold" style={{ color: 'rgba(255, 193, 7, 1)' }}>Análise Rápida (Amarelo)</h4>
              </div>
              <div className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
                <p>• <strong>Análise concisa e objetiva</strong> (caixa marcada)</p>
                <p>• Foco em pontos-chave e ações imediatas</p>
                <p>• Processamento mais rápido</p>
                <p>• Ideal para validações rápidas e decisões pontuais</p>
              </div>
            </div>
          </div>

          {/* Contexto Integrado */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <Settings size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>Contexto Integrado</h4>
            </div>
            <div className="text-sm space-y-2" style={{ color: 'var(--seasalt)' }}>
              <p><strong>A IA sempre considera:</strong></p>
              <p>• Informações do formulário do cliente</p>
              <p>• Todo o histórico de transcrição atual</p>
              <p>• Objetivos e perfil definidos na sessão</p>
              <p>• Contexto do produto/solução apresentado</p>
            </div>
          </div>

          {/* Botão Lixeira */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)', border: '1px solid rgba(249, 251, 252, 0.1)' }}>
            <div className="flex items-center space-x-3 mb-3">
              <Trash2 size={20} style={{ color: 'var(--seasalt)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--seasalt)' }}>Limpeza de Contexto</h4>
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
              <p>• <strong>Exclui apenas</strong> o histórico de transcrição</p>
              <p>• <strong>Mantém:</strong> dados do cliente e configurações</p>
              <p>• Útil para focar em novos tópicos sem contexto anterior</p>
              <p>• Evita análises &quot;poluídas&quot; por conversas antigas</p>
            </div>
          </div>

          {/* Dicas de Uso */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
            <div className="flex items-center space-x-2 mb-3">
              <HelpCircle size={20} style={{ color: 'var(--periwinkle)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>
                Dicas de Uso Eficiente
              </h4>
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--seasalt)' }}>
              <p>• Aguarde acumular conteúdo suficiente antes de analisar</p>
              <p>• Use limpeza entre tópicos diferentes na mesma sessão</p>
              <p>• Análise verde para insights estratégicos completos</p>
              <p>• Análise amarela para validações rápidas e pontuais</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pt-8" style={{ zIndex: 9999 }} onClick={handleClose}>
      <div 
        className="rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--eerie-black)', border: '1px solid rgba(249, 251, 252, 0.1)', zIndex: 10000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--seasalt)' }}>
              {steps[currentStep].title}
            </h2>
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep ? 'w-6' : ''
                  }`}
                  style={{
                    backgroundColor: index === currentStep 
                      ? 'var(--sgbus-green)' 
                      : index < currentStep 
                        ? 'rgba(107, 233, 76, 0.5)' 
                        : 'rgba(249, 251, 252, 0.2)'
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/20"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto persistent-scrollbar">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
            style={{
              backgroundColor: currentStep === 0 ? 'rgba(249, 251, 252, 0.1)' : 'rgba(207, 198, 254, 0.2)',
              color: currentStep === 0 ? 'var(--seasalt)' : 'var(--periwinkle)',
              border: `1px solid ${currentStep === 0 ? 'rgba(249, 251, 252, 0.2)' : 'rgba(207, 198, 254, 0.3)'}`
            }}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <div className="flex space-x-3">
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                style={{
                  backgroundColor: 'rgba(107, 233, 76, 0.2)',
                  color: 'var(--sgbus-green)',
                  border: '1px solid rgba(107, 233, 76, 0.3)'
                }}
              >
                <span>Começar a Usar</span>
                <Play size={16} />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                style={{
                  backgroundColor: 'rgba(107, 233, 76, 0.2)',
                  color: 'var(--sgbus-green)',
                  border: '1px solid rgba(107, 233, 76, 0.3)'
                }}
              >
                <span>Próximo</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}