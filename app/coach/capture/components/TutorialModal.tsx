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
          <div className="text-center mb-6">
            <p className="text-base mb-2" style={{ color: 'var(--seasalt)' }}>
              🎯 <strong>Transcrição dual stream + IA</strong> em 3 passos simples
            </p>
          </div>

          {/* Passo 1: Iniciar */}
          <div className="flex items-start space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)' }}>
            <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.2)' }}>
              <Play size={24} style={{ color: 'var(--sgbus-green)' }} />
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--sgbus-green)' }}>
                1. Clique "🎙️ INICIAR"
              </h3>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                ⏳ Aguarde o popup de compartilhamento de tela abrir automaticamente
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
                2. ✅ Marque "Compartilhar áudio da aba"
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--seasalt)' }}>
                <strong>Essencial:</strong> Ative o áudio para capturar som de vídeos, músicas, chamadas, etc.
              </p>
              <p className="text-xs opacity-70" style={{ color: 'var(--periwinkle)' }}>
                💡 Prefira compartilhar aba específica (melhor qualidade)
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
                3. 🟢 Status "CONECTADO" = Pronto!
              </h3>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                ⏱️ A transcrição pode levar até 3 segundos para iniciar
              </p>
            </div>
          </div>

          {/* Controles Disponíveis */}
          <div className="border-t pt-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--seasalt)' }}>
              🎛️ Controles:
            </h3>
            
            {/* Controles de Áudio - Resumido */}
            <div className="flex justify-center space-x-6 mb-6">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <MicOff size={16} style={{ color: 'rgb(239, 68, 68)' }} />
                  <Mic size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>🎤 Microfone</p>
              </div>
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <MonitorSpeaker size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                  <MonitorSpeaker size={16} style={{ color: 'rgb(239, 68, 68)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--seasalt)' }}>🖥️ Tela</p>
              </div>
            </div>

            {/* Botões Principais - Separados */}
            <div className="space-y-4">
              {/* Botão de Análise */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 233, 76, 0.1)', border: '1px solid rgba(107, 233, 76, 0.2)' }}>
                <div className="flex items-center space-x-3 mb-2">
                  <Brain size={20} style={{ color: 'var(--sgbus-green)' }} />
                  <h4 className="font-semibold" style={{ color: 'var(--sgbus-green)' }}>🧠 ANALISAR</h4>
                </div>
                <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                  Reúne <strong>todo o contexto do histórico</strong> de transcrição e envia para a IA analisar
                </p>
              </div>

              {/* Botão de Limpeza */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 198, 254, 0.1)', border: '1px solid rgba(207, 198, 254, 0.2)' }}>
                <div className="flex items-center space-x-3 mb-2">
                  <Trash2 size={20} style={{ color: 'var(--periwinkle)' }} />
                  <h4 className="font-semibold" style={{ color: 'var(--periwinkle)' }}>🗑️ LIMPEZA</h4>
                </div>
                <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                  Apaga o histórico transcrito para <strong>análise focada</strong> apenas no conteúdo relevante, evitando contexto antigo
                </p>
              </div>
            </div>
          </div>

          {/* Dica Importante */}
          <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <AlertCircle size={20} style={{ color: '#f59e0b' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--seasalt)' }}>
                <strong style={{ color: '#f59e0b' }}>💡 Dica:</strong> A IA analisa <strong>todo o contexto transcrito</strong>. Use "ANALISAR" após acumular conteúdo suficiente.
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