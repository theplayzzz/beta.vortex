'use client'

// Necessário para react-speech-recognition
import 'regenerator-runtime/runtime'

import { useEffect, useState, useRef } from 'react'
import { hasValidAudio } from './audioStreamUtils'

export interface UseCombinedAudioTranscriptionProps {
  recogLang?: string
  interimResults?: boolean
  enabled?: boolean
  phraseSepTime?: number
  minPhraseLength?: number
  maxPhraseLength?: number
  maxDelay?: number
  microphoneEnabled?: boolean
  screenAudioStream?: MediaStream | null
}

export function useCombinedAudioTranscription(props: UseCombinedAudioTranscriptionProps = {}) {
  const [error, setError] = useState<string | null>(null)
  const [transcriptLog, setTranscriptLog] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)
  const [screenAudioLevel, setScreenAudioLevel] = useState(0)
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const microphoneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const screenSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const gainMicRef = useRef<GainNode | null>(null)
  const gainScreenRef = useRef<GainNode | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const microphoneAnalyserRef = useRef<AnalyserNode | null>(null)
  const screenAnalyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const {
    recogLang = 'pt-BR',
    interimResults = true,
    phraseSepTime = 750,
    minPhraseLength = 20,
    maxPhraseLength = 200,
    maxDelay = 5000,
    enabled = false,
    microphoneEnabled = false,
    screenAudioStream = null,
  } = props

  // Verificar compatibilidade do navegador
  const browserSupportsSpeechRecognition = !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  )

  // Função para processar frase finalizada
  const processFinishedPhrase = (text: string) => {
    const trimmedText = text.trim()
    if (trimmedText) {
      setTranscriptLog(prev => {
        const newLog = prev + (prev ? ' ' : '') + trimmedText
        return newLog.length > 5000 ? newLog.slice(-5000) : newLog
      })
      setCurrentTranscript('')
    }
  }

  // Função para monitorar níveis de áudio
  const monitorAudioLevels = () => {
    if (!microphoneAnalyserRef.current && !screenAnalyserRef.current) return

    const updateLevels = () => {
      // Monitorar microfone
      if (microphoneAnalyserRef.current) {
        const dataArray = new Uint8Array(microphoneAnalyserRef.current.frequencyBinCount)
        microphoneAnalyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setMicrophoneLevel(average / 255)
      }

      // Monitorar áudio da tela
      if (screenAnalyserRef.current) {
        const dataArray = new Uint8Array(screenAnalyserRef.current.frequencyBinCount)
        screenAnalyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setScreenAudioLevel(average / 255)
      }

      animationFrameRef.current = requestAnimationFrame(updateLevels)
    }

    updateLevels()
  }

  // Capturar áudio do microfone
  const captureMicrophoneAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      setMicrophoneStream(stream)
      console.log('Áudio do microfone capturado')
      return stream
    } catch (err) {
      console.error('Erro ao capturar áudio do microfone:', err)
      setError('Erro ao acessar microfone. Verifique as permissões.')
      return null
    }
  }

  // Configurar sistema de áudio combinado
  const setupCombinedAudio = async () => {
    try {
      // Criar contexto de áudio
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // Criar nó de destino para stream combinado
      const destination = audioContext.createMediaStreamDestination()
      destinationRef.current = destination

      // Configurar microfone se habilitado
      if (microphoneEnabled) {
        const micStream = microphoneStream || await captureMicrophoneAudio()
        if (micStream) {
          const micSource = audioContext.createMediaStreamSource(micStream)
          const micGain = audioContext.createGain()
          const micAnalyser = audioContext.createAnalyser()
          
          micGain.gain.value = 1.0 // Volume do microfone
          micAnalyser.fftSize = 256
          
          micSource.connect(micAnalyser)
          micAnalyser.connect(micGain)
          micGain.connect(destination)
          
          microphoneSourceRef.current = micSource
          gainMicRef.current = micGain
          microphoneAnalyserRef.current = micAnalyser
          
          console.log('Microfone conectado ao mixer')
        }
      }

      // Configurar áudio da tela se disponível
      if (screenAudioStream && hasValidAudio(screenAudioStream)) {
        const screenSource = audioContext.createMediaStreamSource(screenAudioStream)
        const screenGain = audioContext.createGain()
        const screenAnalyser = audioContext.createAnalyser()
        
        screenGain.gain.value = 1.0 // Volume da tela
        screenAnalyser.fftSize = 256
        
        screenSource.connect(screenAnalyser)
        screenAnalyser.connect(screenGain)
        screenGain.connect(destination)
        
        screenSourceRef.current = screenSource
        gainScreenRef.current = screenGain
        screenAnalyserRef.current = screenAnalyser
        
        console.log('Áudio da tela conectado ao mixer')
      }

      // Iniciar monitoramento de níveis
      monitorAudioLevels()

      console.log('Sistema de áudio combinado configurado')
      return destination.stream
    } catch (err) {
      console.error('Erro ao configurar sistema de áudio combinado:', err)
      setError('Erro ao configurar sistema de áudio')
      return null
    }
  }

  // Configurar reconhecimento de fala
  const setupSpeechRecognition = (combinedStream: MediaStream) => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = interimResults
      recognition.lang = recogLang
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('Reconhecimento de áudio combinado iniciado')
        setListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setCurrentTranscript(interimTranscript)

        if (finalTranscript) {
          processFinishedPhrase(finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de áudio combinado:', event.error)
        if (event.error === 'not-allowed') {
          setError('Permissão negada para acesso ao microfone')
        } else if (event.error === 'aborted') {
          console.log('Reconhecimento abortado')
        } else {
          setError(`Erro na transcrição: ${event.error}`)
        }
        setListening(false)
      }

      recognition.onend = () => {
        console.log('Reconhecimento de áudio combinado parado')
        setListening(false)
        
        // Reconexão automática se ainda estiver habilitado
        if (enabled) {
          setTimeout(() => {
            try {
              if (recognitionRef.current && enabled) {
                recognitionRef.current.start()
              }
            } catch (err) {
              console.error('Erro na reconexão automática:', err)
            }
          }, 1000)
        }
      }

      recognitionRef.current = recognition
      console.log('Reconhecimento de fala configurado')
    } catch (err) {
      console.error('Erro ao configurar reconhecimento de fala:', err)
      setError('Erro ao configurar reconhecimento de fala')
    }
  }

  // Iniciar sistema completo
  const startCombinedTranscription = async () => {
    if (!browserSupportsSpeechRecognition) {
      setError('Seu navegador não suporta reconhecimento de fala')
      return
    }

    try {
      // Configurar áudio combinado
      const combinedStream = await setupCombinedAudio()
      if (!combinedStream) {
        return
      }

      // Configurar reconhecimento
      setupSpeechRecognition(combinedStream)

      // Iniciar reconhecimento
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      console.log('Sistema de transcrição combinada iniciado')
    } catch (err) {
      console.error('Erro ao iniciar transcrição combinada:', err)
      setError('Erro ao iniciar transcrição combinada')
    }
  }

  // Parar sistema completo
  const stopCombinedTranscription = () => {
    // Parar reconhecimento
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Parar monitoramento
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Parar stream do microfone
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop())
      setMicrophoneStream(null)
    }

    // Fechar contexto de áudio
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Limpar referências
    microphoneSourceRef.current = null
    screenSourceRef.current = null
    gainMicRef.current = null
    gainScreenRef.current = null
    destinationRef.current = null
    microphoneAnalyserRef.current = null
    screenAnalyserRef.current = null

    setListening(false)
    setMicrophoneLevel(0)
    setScreenAudioLevel(0)
    console.log('Sistema de transcrição combinada parado')
  }

  // Gerenciar sistema baseado nos parâmetros
  useEffect(() => {
    if (enabled && (microphoneEnabled || screenAudioStream)) {
      startCombinedTranscription()
    } else {
      stopCombinedTranscription()
    }

    return () => {
      stopCombinedTranscription()
    }
  }, [enabled, microphoneEnabled, screenAudioStream])

  // Gerenciar processamento de frases com timers
  useEffect(() => {
    let maxDelayTimer: NodeJS.Timeout
    let phraseTimer: NodeJS.Timeout

    if (currentTranscript && enabled) {
      maxDelayTimer = setTimeout(() => {
        if (currentTranscript) {
          processFinishedPhrase(currentTranscript)
        }
      }, maxDelay)

      if (currentTranscript.length > maxPhraseLength) {
        processFinishedPhrase(currentTranscript)
      } else if (currentTranscript.length > minPhraseLength) {
        phraseTimer = setTimeout(() => {
          if (currentTranscript) {
            processFinishedPhrase(currentTranscript)
          }
        }, phraseSepTime)
      }
    }

    return () => {
      if (maxDelayTimer) clearTimeout(maxDelayTimer)
      if (phraseTimer) clearTimeout(phraseTimer)
    }
  }, [currentTranscript, enabled, maxDelay, maxPhraseLength, minPhraseLength, phraseSepTime])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopCombinedTranscription()
    }
  }, [])

  // Função para resetar tudo
  const reset = () => {
    setTranscriptLog('')
    setCurrentTranscript('')
    setError(null)
    setMicrophoneLevel(0)
    setScreenAudioLevel(0)
  }

  // Função para ajustar volume do microfone
  const setMicrophoneVolume = (volume: number) => {
    if (gainMicRef.current) {
      gainMicRef.current.gain.value = volume
    }
  }

  // Função para ajustar volume da tela
  const setScreenAudioVolume = (volume: number) => {
    if (gainScreenRef.current) {
      gainScreenRef.current.gain.value = volume
    }
  }

  // Retornar transcript combinado
  const fullTranscript = transcriptLog + (transcriptLog && currentTranscript ? ' ' : '') + currentTranscript

  return {
    transcript: fullTranscript,
    listening,
    microphoneLevel,
    screenAudioLevel,
    reset,
    setMicrophoneVolume,
    setScreenAudioVolume,
    browserSupportsSpeechRecognition,
    error,
  }
} 