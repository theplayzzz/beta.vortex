'use client'

// Necessário para react-speech-recognition
import 'regenerator-runtime/runtime'

import { useEffect, useState, useRef } from 'react'
import { hasValidAudio, createAudioLevelMonitor } from './audioStreamUtils'

export interface UseScreenAudioTranscriptionProps {
  enabled?: boolean
  audioStream?: MediaStream | null
}

export function useScreenAudioTranscription(props: UseScreenAudioTranscriptionProps = {}) {
  const [error, setError] = useState<string | null>(null)
  const [transcriptLog, setTranscriptLog] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const cleanupMonitorRef = useRef<(() => void) | null>(null)
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    enabled = false,
    audioStream = null,
  } = props

  // Verificar compatibilidade do navegador
  const browserSupportsSpeechRecognition = !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  )

  // Simular transcrição baseada no nível de áudio
  const simulateTranscription = (level: number) => {
    // Simular transcrição apenas quando há áudio significativo
    if (level > 0.01) {
      // Frases de exemplo para simulação
      const samplePhrases = [
        'Conteúdo da tela está sendo compartilhado',
        'Áudio da tela detectado',
        'Transmissão de áudio ativa',
        'Sistema de compartilhamento funcionando'
      ]
      
      // Simular transcrição ocasional
      if (Math.random() < 0.1) { // 10% de chance a cada verificação
        const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)]
        setCurrentTranscript(phrase)
        
        // Processar frase após um tempo
        setTimeout(() => {
          setTranscriptLog(prev => {
            const newLog = prev + (prev ? ' ' : '') + phrase
            return newLog.length > 5000 ? newLog.slice(-5000) : newLog
          })
          setCurrentTranscript('')
        }, 2000)
      }
    }
  }

  // Configurar processamento de áudio da tela
  const setupAudioProcessing = async (stream: MediaStream) => {
    try {
      // Criar contexto de áudio
      const audioContext = new AudioContext()
      
      // Criar nó de origem do stream da tela
      const sourceNode = audioContext.createMediaStreamSource(stream)
      
      // Salvar referências
      audioContextRef.current = audioContext
      sourceNodeRef.current = sourceNode
      
      console.log('Processamento de áudio da tela configurado')
      setListening(true)
      setError(null)
      
      return true
    } catch (err) {
      console.error('Erro ao configurar processamento de áudio:', err)
      setError('Erro ao configurar processamento de áudio da tela')
      return false
    }
  }

  // Gerenciar transcrição baseada no audioStream
  useEffect(() => {
    const startTranscription = async () => {
      if (!enabled || !audioStream || !hasValidAudio(audioStream)) {
        return
      }

      try {
        // Configurar processamento de áudio
        const success = await setupAudioProcessing(audioStream)
        if (!success) {
          return
        }

        // Configurar monitor de nível de áudio
        const cleanupMonitor = createAudioLevelMonitor(audioStream, (level) => {
          setAudioLevel(level)
          simulateTranscription(level)
        })
        cleanupMonitorRef.current = cleanupMonitor

        // Iniciar simulação periódica
        simulationIntervalRef.current = setInterval(() => {
          if (audioLevel > 0.01) {
            simulateTranscription(audioLevel)
          }
        }, 3000)

        console.log('Monitoramento de áudio da tela iniciado')
        
      } catch (err) {
        console.error('Erro ao iniciar monitoramento de áudio da tela:', err)
        setError('Erro ao iniciar monitoramento de áudio da tela')
      }
    }

    const stopTranscription = () => {
      // Parar simulação
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
      
      // Limpar monitor de áudio
      if (cleanupMonitorRef.current) {
        cleanupMonitorRef.current()
        cleanupMonitorRef.current = null
      }
      
      // Fechar contexto de áudio
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      // Limpar referências
      sourceNodeRef.current = null
      
      setListening(false)
      setAudioLevel(0)
      console.log('Monitoramento de áudio da tela parado')
    }

    if (enabled && audioStream) {
      startTranscription()
    } else {
      stopTranscription()
    }

    return () => {
      stopTranscription()
    }
  }, [enabled, audioStream, audioLevel])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
      if (cleanupMonitorRef.current) {
        cleanupMonitorRef.current()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Função para resetar tudo
  const reset = () => {
    setTranscriptLog('')
    setCurrentTranscript('')
    setError(null)
    setAudioLevel(0)
  }

  // Retornar transcript combinado (log + atual)
  const fullTranscript = transcriptLog + (transcriptLog && currentTranscript ? ' ' : '') + currentTranscript

  return {
    transcript: fullTranscript,
    listening,
    audioLevel,
    reset,
    browserSupportsSpeechRecognition,
    error,
  }
} 