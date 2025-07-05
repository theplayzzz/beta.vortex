// 🚀 Perfis de Configuração para Velocidade de Transcrição

const SPEECH_PROFILES = {
  // ⚡ ULTRA RÁPIDO - 1-2 segundos
  ULTRA_FAST: {
    model: 'latest_short',
    useEnhanced: true,
    maxAlternatives: 1,
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
    speechContexts: [
      {
        phrases: ['sim', 'não', 'ok', 'pronto', 'finalizar', 'obrigado'],
        boost: 25.0,
      },
      {
        phrases: ['ponto', 'vírgula', 'parágrafo'],
        boost: 20.0,
      }
    ],
  },

  // 🏃 RÁPIDO - 2-3 segundos
  FAST: {
    model: 'latest_short',
    useEnhanced: false,
    maxAlternatives: 2,
    enableAutomaticPunctuation: true,
    speechContexts: [
      {
        phrases: ['ponto', 'vírgula', 'parágrafo'],
        boost: 15.0,
      }
    ],
  },

  // ⚖️ BALANCEADO - 3-5 segundos (padrão original)
  BALANCED: {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 3,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
  },

  // 🎯 PRECISO - 5-8 segundos
  PRECISE: {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 5,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableWordTimeOffsets: true,
  }
};

module.exports = SPEECH_PROFILES; 