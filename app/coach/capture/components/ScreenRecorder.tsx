'use client'

import { useState, useEffect, useRef } from 'react'
import { useMicrophoneTranscription } from '../lib/useMicrophoneTranscription'
import { hasValidAudio, createAudioLevelMonitor } from '../lib/audioStreamUtils'
import { DualTranscriptionDisplay } from './DualTranscriptionDisplay'

export function ScreenRecorder() {
  const [enabled, setEnabled] = useState(false)
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [screenAudioLevel, setScreenAudioLevel] = useState(0)
  const [screenAudioError, setScreenAudioError] = useState<string | null>(null)
  const [screenListening, setScreenListening] = useState(false)
  const [screenTranscript, setScreenTranscript] = useState('')
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const screenAudioMonitorRef = useRef<(() => void) | null>(null)
  
  // Hook para transcrição do microfone
  const microphoneTranscription = useMicrophoneTranscription({
    enabled: microphoneEnabled,
    recogLang: 'pt-BR',
    interimResults: true,
  })

  // Verificar compatibilidade do navegador
  useEffect(() => {
    console.log('Verificando compatibilidade...')
    
    const microphoneSpeechSupport = !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    )
    
    const getDisplayMediaAvailable = !!(
      navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
    )
    
    console.log('microphoneSpeechSupport:', microphoneSpeechSupport)
    console.log('screenSpeechSupport:', true) // Sempre true agora
    console.log('getDisplayMedia available:', getDisplayMediaAvailable)
    
    if (!microphoneSpeechSupport) {
      setError('Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.')
      return
    }
    
    if (!getDisplayMediaAvailable) {
      setError('Seu navegador não suporta compartilhamento de tela. Use Chrome ou Edge.')
      return
    }
    
    console.log('Compatibilidade OK')
  }, [])

  // Configurar monitoramento de áudio da tela
  const setupScreenAudioMonitoring = async (mediaStream: MediaStream) => {
    try {
      if (!hasValidAudio(mediaStream)) {
        setScreenAudioError('Stream da tela não contém áudio válido')
        return false
      }

      // Criar monitor de nível de áudio
      const cleanupMonitor = createAudioLevelMonitor(mediaStream, (level) => {
        setScreenAudioLevel(level)
        
        // Simular transcrição baseada no nível de áudio
        if (level > 0.01 && Math.random() < 0.05) {
          const phrases = [
            'Áudio da tela detectado',
            'Conteúdo sendo compartilhado',
            'Sistema de áudio ativo',
            'Transmissão em andamento'
          ]
          const phrase = phrases[Math.floor(Math.random() * phrases.length)]
          setScreenTranscript(prev => {
            const newTranscript = prev + (prev ? ' ' : '') + phrase
            return newTranscript.length > 1000 ? newTranscript.slice(-1000) : newTranscript
          })
        }
      })
      
      screenAudioMonitorRef.current = cleanupMonitor
      setScreenListening(true)
      setScreenAudioError(null)
      
      console.log('Monitoramento de áudio da tela configurado')
      return true
    } catch (err) {
      console.error('Erro ao configurar monitoramento de áudio da tela:', err)
      setScreenAudioError('Erro ao configurar monitoramento de áudio da tela')
      return false
    }
  }

  // Parar monitoramento de áudio da tela
  const stopScreenAudioMonitoring = () => {
    if (screenAudioMonitorRef.current) {
      screenAudioMonitorRef.current()
      screenAudioMonitorRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    setScreenListening(false)
    setScreenAudioLevel(0)
    setScreenTranscript('')
    console.log('Monitoramento de áudio da tela parado')
  }

  // Iniciar compartilhamento de tela
  const startScreenSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Solicitar áudio da tela
      })
      
      setStream(mediaStream)
      setEnabled(true)
      setError(null)
      
      // Configurar monitoramento de áudio da tela
      await setupScreenAudioMonitoring(mediaStream)
      
      // Habilitar microfone automaticamente
      setMicrophoneEnabled(true)
      
      // Listener para quando o usuário para o compartilhamento
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('Compartilhamento de tela encerrado pelo usuário')
          stopScreenSharing()
        }
      }
      
      console.log('Compartilhamento de tela iniciado')
    } catch (err) {
      console.error('Erro ao iniciar compartilhamento de tela:', err)
      setError('Erro ao iniciar compartilhamento de tela. Verifique as permissões.')
    }
  }

  // Parar compartilhamento de tela
  const stopScreenSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setEnabled(false)
    setMicrophoneEnabled(false)
    stopScreenAudioMonitoring()
    setError(null)
    console.log('Compartilhamento de tela parado')
  }

  // Toggle microfone
  const toggleMicrophone = () => {
    setMicrophoneEnabled(!microphoneEnabled)
  }

  // Resetar transcrições
  const resetTranscriptions = () => {
    microphoneTranscription.reset()
    setScreenTranscript('')
  }

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopScreenAudioMonitoring()
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Determinar status combinado
  const getCombinedStatus = () => {
    const micStatus = microphoneEnabled && microphoneTranscription.listening
    const screenStatus = screenListening
    
    if (micStatus && screenStatus) {
      return '🔵 Microfone + 🔴 Tela'
    } else if (micStatus) {
      return '🔵 Microfone'
    } else if (screenStatus) {
      return '🔴 Tela'
    } else {
      return 'Inativo'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Compartilhamento de Tela com Transcrição</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={enabled ? stopScreenSharing : startScreenSharing}
            disabled={!!error}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              enabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
            }`}
          >
            {enabled ? 'Parar Compartilhamento' : 'Iniciar Compartilhamento'}
          </button>
          
          {enabled && (
            <button
              onClick={toggleMicrophone}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                microphoneEnabled
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {microphoneEnabled ? 'Desativar Microfone' : 'Ativar Microfone'}
            </button>
          )}
          
          {(microphoneTranscription.transcript || screenTranscript) && (
            <button
              onClick={resetTranscriptions}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium transition-colors"
            >
              Limpar Transcrições
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Status:</strong> {getCombinedStatus()}</p>
          {screenListening && (
            <p><strong>Nível de Áudio da Tela:</strong> {Math.round(screenAudioLevel * 100)}%</p>
          )}
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Microfone:</strong> Transcrição em tempo real usando Web Speech API</p>
          <p><strong>Tela:</strong> Monitoramento de áudio com simulação de transcrição</p>
          <p><strong>Observação:</strong> A transcrição real do áudio da tela requer integração com serviços externos</p>
        </div>
      </div>
      
      <DualTranscriptionDisplay
        microphoneTranscript={microphoneTranscription.transcript}
        screenTranscript={screenTranscript}
        isMicrophoneListening={microphoneTranscription.listening}
        isScreenListening={screenListening}
        screenAudioLevel={screenAudioLevel}
      />
    </div>
  )
} 