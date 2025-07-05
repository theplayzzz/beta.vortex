'use client'

// Utilitários para conversão de streams de áudio da tela compartilhada

export interface AudioStreamConversionOptions {
  sampleRate?: number
  channelCount?: number
  bufferSize?: number
}

/**
 * Converte um MediaStream de áudio da tela para um formato compatível com Web Speech API
 */
export function convertScreenAudioStream(
  screenStream: MediaStream,
  options: AudioStreamConversionOptions = {}
): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    try {
      const {
        sampleRate = 16000,
        channelCount = 1,
        bufferSize = 4096
      } = options

      const audioTracks = screenStream.getAudioTracks()
      if (audioTracks.length === 0) {
        reject(new Error('Nenhuma track de áudio encontrada no stream da tela'))
        return
      }

      // Criar AudioContext para processar o áudio
      const audioContext = new AudioContext({
        sampleRate,
        latencyHint: 'interactive'
      })

      // Criar source a partir do stream da tela
      const source = audioContext.createMediaStreamSource(screenStream)

      // Criar um processador de áudio para converter o stream
      const processor = audioContext.createScriptProcessor(bufferSize, channelCount, channelCount)

      // Criar um MediaStreamDestination para output
      const destination = audioContext.createMediaStreamDestination()

      // Conectar source -> processor -> destination
      source.connect(processor)
      processor.connect(destination)

      // Processar áudio em tempo real
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer
        const outputBuffer = event.outputBuffer

        // Copiar dados de entrada para saída (passthrough)
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const inputData = inputBuffer.getChannelData(channel)
          const outputData = outputBuffer.getChannelData(channel)
          
          for (let i = 0; i < inputBuffer.length; i++) {
            outputData[i] = inputData[i]
          }
        }
      }

      // Retornar o stream convertido
      resolve(destination.stream)

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Cria um MediaStream fake com áudio silencioso para evitar conflitos
 */
export function createSilentAudioStream(): MediaStream {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  const destination = audioContext.createMediaStreamDestination()

  // Configurar oscillator para frequência inaudível
  oscillator.frequency.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0, audioContext.currentTime) // Volume zero (silencioso)

  // Conectar oscillator -> gainNode -> destination
  oscillator.connect(gainNode)
  gainNode.connect(destination)

  // Iniciar oscillator
  oscillator.start()

  return destination.stream
}

/**
 * Verifica se um MediaStream tem áudio válido
 */
export function hasValidAudio(stream: MediaStream): boolean {
  const audioTracks = stream.getAudioTracks()
  return audioTracks.length > 0 && audioTracks[0].readyState === 'live'
}

/**
 * Monitora o nível de áudio de um MediaStream
 */
export function createAudioLevelMonitor(
  stream: MediaStream,
  callback: (level: number) => void
): () => void {
  try {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    source.connect(analyser)
    
    let animationId: number
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      
      // Calcular nível médio
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      const normalizedLevel = average / 255
      
      callback(normalizedLevel)
      animationId = requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
    
    // Retornar função de cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (audioContext.state !== 'closed') {
        audioContext.close()
      }
    }
  } catch (error) {
    console.error('Erro ao criar monitor de nível de áudio:', error)
    return () => {}
  }
}

/**
 * Combina múltiplos streams de áudio em um único stream
 * Útil para unir áudio do microfone com áudio da tela
 */
export function combineAudioStreams(streams: MediaStream[]): MediaStream | null {
  try {
    // Filtrar apenas streams válidos com áudio
    const validStreams = streams.filter(stream => hasValidAudio(stream))
    
    if (validStreams.length === 0) {
      console.warn('Nenhum stream de áudio válido para combinar')
      return null
    }
    
    // Se há apenas um stream, retornar diretamente
    if (validStreams.length === 1) {
      return validStreams[0]
    }
    
    // Criar contexto de áudio para combinação
    const audioContext = new AudioContext()
    
    // Criar nó de destino
    const destination = audioContext.createMediaStreamDestination()
    
    // Conectar todos os streams ao destino
    validStreams.forEach(stream => {
      try {
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(destination)
      } catch (err) {
        console.error('Erro ao conectar stream:', err)
      }
    })
    
    console.log(`Combinados ${validStreams.length} streams de áudio`)
    return destination.stream
    
  } catch (err) {
    console.error('Erro ao combinar streams de áudio:', err)
    return null
  }
} 