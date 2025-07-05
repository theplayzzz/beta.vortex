'use client'

// Necessário para react-speech-recognition
import 'regenerator-runtime/runtime'

import { useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export interface UseScreenTranscriptionProps {
  recogLang?: string
  interimResults?: boolean
  enabled?: boolean
  phraseSepTime?: number
  minPhraseLength?: number
  maxPhraseLength?: number
  maxDelay?: number
}

export function useScreenTranscription(props: UseScreenTranscriptionProps = {}) {
  const [error, setError] = useState<string | null>(null)
  const [transcriptLog, setTranscriptLog] = useState('')

  const {
    recogLang = 'pt-BR',
    interimResults = true,
    phraseSepTime = 750, // ms
    minPhraseLength = 20,
    maxPhraseLength = 200,
    maxDelay = 5000, // ms
    enabled = false,
  } = props

  const {
    transcript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition()

  // Gerenciar início e parada da transcrição
  useEffect(() => {
    if (enabled && browserSupportsSpeechRecognition) {
      try {
        SpeechRecognition.startListening({
          language: recogLang,
          continuous: true,
          interimResults: interimResults,
        })
        setError(null)
      } catch (err) {
        console.error('Erro ao iniciar transcrição:', err)
        setError('Erro ao iniciar reconhecimento de fala')
      }
    } else if (!enabled) {
      SpeechRecognition.stopListening()
    }

    return () => {
      if (enabled) {
        SpeechRecognition.stopListening()
      }
    }
  }, [enabled, recogLang, interimResults, browserSupportsSpeechRecognition])

  // Gerenciar processamento de frases finalizadas
  useEffect(() => {
    let maxDelayTimer: NodeJS.Timeout
    let phraseTimer: NodeJS.Timeout

    if (finalTranscript && enabled) {
      // Timer máximo para processar frase
      maxDelayTimer = setTimeout(() => {
        if (finalTranscript) {
          processFinishedPhrase(finalTranscript)
        }
      }, maxDelay)

      // Timer baseado no tamanho da frase
      if (finalTranscript.length > maxPhraseLength) {
        processFinishedPhrase(finalTranscript)
      } else {
        phraseTimer = setTimeout(() => {
          if (finalTranscript.length > minPhraseLength) {
            processFinishedPhrase(finalTranscript)
          }
        }, phraseSepTime)
      }
    }

    return () => {
      if (maxDelayTimer) clearTimeout(maxDelayTimer)
      if (phraseTimer) clearTimeout(phraseTimer)
    }
  }, [finalTranscript, enabled, maxDelay, maxPhraseLength, minPhraseLength, phraseSepTime])

  // Processar frase finalizada
  const processFinishedPhrase = (text: string) => {
    const trimmedText = text.trim()
    if (trimmedText) {
      setTranscriptLog(prev => {
        const newLog = prev + (prev ? ' ' : '') + trimmedText
        // Limitar tamanho do log (últimas 5000 caracteres)
        return newLog.length > 5000 ? newLog.slice(-5000) : newLog
      })
      resetTranscript()
    }
  }

  // Função para resetar tudo
  const reset = () => {
    resetTranscript()
    setTranscriptLog('')
    setError(null)
  }

  // Verificar compatibilidade do navegador
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.')
    } else if (!navigator.onLine) {
      setError('Dispositivo offline! O reconhecimento de fala requer conexão com a internet.')
    }
  }, [browserSupportsSpeechRecognition])

  // Reconexão automática quando a transcrição para inesperadamente
  useEffect(() => {
    if (enabled && !listening && browserSupportsSpeechRecognition && navigator.onLine) {
      const reconnectTimer = setTimeout(() => {
        try {
          SpeechRecognition.startListening({
            language: recogLang,
            continuous: true,
            interimResults: interimResults,
          })
        } catch (err) {
          console.error('Erro na reconexão:', err)
          setError('Erro na reconexão automática')
        }
      }, 1000)

      return () => clearTimeout(reconnectTimer)
    }
  }, [enabled, listening, browserSupportsSpeechRecognition, recogLang, interimResults])

  // Retornar transcript combinado (log + atual)
  const fullTranscript = transcriptLog + (transcriptLog && transcript ? ' ' : '') + transcript

  return {
    transcript: fullTranscript,
    listening,
    reset,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    error,
  }
} 