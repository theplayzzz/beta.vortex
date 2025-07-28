import { X, Play, Monitor, Mic, MicOff, MonitorSpeaker, Trash2, Brain, AlertCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--eerie-black)', border: '1px solid rgba(249, 251, 252, 0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--seasalt)' }}>
            Como usar a Plataforma de Transcrição e Análise
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Introdução */}
          <div className="text-center mb-8">
            <p className="text-lg mb-2" style={{ color: 'var(--seasalt)' }}>
              Esta plataforma oferece transcrição em tempo real com separação de áudio dual (microfone + tela) 
              e análise de IA integrada para seus conteúdos.
            </p>
            <p className="text-sm opacity-70" style={{ color: 'var(--periwinkle)' }}>
              Siga os passos abaixo para usar todas as funcionalidades disponíveis.
            </p>
          </div>

          {/* Passo 1: Iniciar */}
          <div className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)' }}>
            <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
              <Play size={24} style={{ color: 'var(--sgbus-green)' }} />
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--sgbus-green)' }}>
                1. Clique em "INICIAR" para começar
              </h3>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                O botão verde "🎙️ INICIAR" ativa o sistema de transcrição. A conexão será estabelecida 
                automaticamente e você verá o status mudar para "CONECTADO".
              </p>
            </div>
          </div>

          {/* Passo 2: Compartilhamento de Tela */}
          <div className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)' }}>
            <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.2)' }}>
              <Monitor size={24} style={{ color: 'var(--periwinkle)' }} />
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--periwinkle)' }}>
                2. Compartilhe sua tela com áudio
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--seasalt)' }}>
                O navegador solicitará permissão para compartilhar sua tela. <strong>Certifique-se de marcar a opção 
                "Compartilhar áudio da aba"</strong> para capturar o som da tela (vídeos, áudios, chamadas, etc.).
              </p>
              <p className="text-xs opacity-70" style={{ color: 'var(--periwinkle)' }}>
                💡 Dica: Escolha compartilhar uma aba específica com áudio para melhor qualidade.
              </p>
            </div>
          </div>

          {/* Passo 3: Aguardar Conexão */}
          <div className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(249, 251, 252, 0.05)' }}>
            <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'rgba(249, 251, 252, 0.1)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--sgbus-green)' }}>
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--seasalt)' }}>
                3. Aguarde a conexão ser estabelecida
              </h3>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                Quando o status mostrar "CONECTADO" com um ponto verde, o sistema está pronto. 
                As barras de áudio "MIC" e "TELA" começarão a mostrar os níveis de som detectados.
              </p>
            </div>
          </div>

          {/* Controles Disponíveis */}
          <div className="border-t pt-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--seasalt)' }}>
              Controles Disponíveis:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Controles de Microfone */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)' }}>
                  <Mic size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgb(34, 197, 94)' }}>MIC ON</span>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <MicOff size={16} style={{ color: 'rgb(239, 68, 68)' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgb(239, 68, 68)' }}>MIC OFF</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>
                  Controla a captura do seu microfone. Inicia desligado por padrão.
                </p>
              </div>

              {/* Controles de Áudio da Tela */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)' }}>
                  <MonitorSpeaker size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgb(34, 197, 94)' }}>TELA ON</span>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <MonitorSpeaker size={16} style={{ color: 'rgb(239, 68, 68)' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgb(239, 68, 68)' }}>TELA OFF</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>
                  Controla a captura do áudio da tela. Inicia ligado por padrão.
                </p>
              </div>

              {/* Botão de Limpeza */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)' }}>
                  <Trash2 size={16} style={{ color: 'var(--periwinkle)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--periwinkle)' }}>LIMPEZA</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>
                  Remove todo o histórico de transcrição acumulado.
                </p>
              </div>

              {/* Botão de Análise */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)' }}>
                  <Brain size={16} style={{ color: 'var(--sgbus-green)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--sgbus-green)' }}>🧠 ANALISAR</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>
                  Envia todo o contexto transcrito para análise de IA.
                </p>
              </div>
            </div>
          </div>

          {/* Observação Importante */}
          <div className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <div className="flex-shrink-0">
              <AlertCircle size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#f59e0b' }}>
                ⚠️ Observação Importante sobre Contexto
              </h3>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                A análise de IA considera <strong>todo o contexto transcrito</strong> (tanto blocos finalizados quanto 
                texto em andamento). Para melhores resultados, use a função "ANALISAR" quando tiver uma quantidade 
                significativa de conteúdo transcrito.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-opacity-10" style={{ borderColor: 'var(--seasalt)' }}>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: 'rgba(107, 233, 76, 0.2)',
              color: 'var(--sgbus-green)',
              border: '1px solid rgba(107, 233, 76, 0.3)'
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}