'use client'

import { useState, useRef, useEffect } from 'react'
import { TranscriptionDisplay } from './TranscriptionDisplay'
import { AudioControls } from './AudioControls'
import { useScreenTranscription } from '../lib/useScreenTranscription'

export interface ScreenRecorderProps {
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
}

export function ScreenRecorder({ 
  isRecording, 
  onRecordingChange 
}: ScreenRecorderProps) {
  const [enabled, setEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [isClient, setIsClient] = useState(false)
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)
  const [isCompatibilityChecking, setIsCompatibilityChecking] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const {
    transcript,
    listening,
    reset,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    error
  } = useScreenTranscription({
    recogLang: 'pt-BR',
    enabled,
    phraseSepTime: 750,
  })

  // Verificar compatibilidade apenas no cliente com timeout
  useEffect(() => {
    setIsClient(true)
    
    const checkCompatibility = () => {
      console.log('Verificando compatibilidade...')
      console.log('browserSupportsSpeechRecognition:', browserSupportsSpeechRecognition)
      console.log('getDisplayMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia))
      
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        console.log('Não está no cliente')
        setCompatibilityError("Carregando...")
        return
      }

      // Verificar getDisplayMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.log('getDisplayMedia não disponível')
        setCompatibilityError("Seu navegador não suporta compartilhamento de tela. Use Chrome ou Edge moderno.")
        setIsCompatibilityChecking(false)
        return
      }

      // Verificar Web Speech API (apenas se já foi inicializada)
      if (browserSupportsSpeechRecognition === false) {
        console.log('Speech recognition não disponível')
        setCompatibilityError("Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.")
        setIsCompatibilityChecking(false)
        return
      }

      // Tudo OK
      console.log('Compatibilidade OK')
      setCompatibilityError(null)
      setIsCompatibilityChecking(false)
    }

    // Verificar imediatamente
    checkCompatibility()

    // Verificar novamente após um pequeno delay (para dar tempo ao Speech Recognition inicializar)
    const timeoutId = setTimeout(() => {
      checkCompatibility()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [browserSupportsSpeechRecognition])

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stream])

  const handleStart = async () => {
    try {
      // Capturar tela compartilhada com áudio
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })
      
      setStream(mediaStream)
      
      // Configurar video element para preview
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      // Configurar MediaRecorder para áudio
      const audioTracks = mediaStream.getAudioTracks()
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks)
        
        // Configurar AudioContext para processamento de áudio
        audioContextRef.current = new AudioContext()
        sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream)
        
        // Criar MediaRecorder
        const recorder = new MediaRecorder(audioStream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        })
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks(prev => [...prev, event.data])
          }
        }
        
        recorder.start(1000) // Gravar em chunks de 1 segundo
        setMediaRecorder(recorder)
      }
      
      setEnabled(true)
      onRecordingChange(true)
      
      // Listener para quando o usuário parar o compartilhamento
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStop()
      })
      
    } catch (error) {
      console.error('Erro ao capturar tela:', error)
      setCompatibilityError("Erro ao acessar compartilhamento de tela. Permissão negada ou recurso não disponível.")
    }
  }

  const handleStop = () => {
    // Parar transcrição
    setEnabled(false)
    
    // Parar MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    // Parar todas as tracks do stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    // Fechar AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Limpar video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    onRecordingChange(false)
  }

  const handleReset = () => {
    reset()
    setRecordedChunks([])
  }

  const handleDownload = () => {
    if (recordedChunks.length === 0) return
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `screen-audio-${new Date().toISOString()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Mostrar loading enquanto verifica compatibilidade
  if (!isClient || isCompatibilityChecking) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
             style={{ borderColor: 'var(--sgbus-green, #6be94c)' }}></div>
        <p style={{ color: 'var(--seasalt, #f9fbfc)' }}>Verificando compatibilidade...</p>
      </div>
    )
  }

  // Mostrar erro de compatibilidade
  if (compatibilityError) {
    return (
      <div className="rounded-lg p-6 border border-yellow-500 border-opacity-30" 
           style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-500">Incompatibilidade Detectada</h3>
            <p className="text-sm" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
              {compatibilityError}
            </p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
          <p><strong>Requisitos:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Google Chrome versão 74+ ou Microsoft Edge versão 79+</li>
            <li>Conexão com a internet (para reconhecimento de fala)</li>
            <li>Permissão para compartilhar tela</li>
          </ul>
        </div>
      </div>
    )
  }

  // Determinar status da captura
  const getShareStatus = () => {
    if (!enabled) return "⚪ Sistema Pronto"
    if (listening) return "🔴 Captura Ativa (Transcrevendo)"
    return "🔴 Captura Ativa (Aguardando áudio)"
  }

  return (
    <div className="space-y-6">
      {/* Status da captura */}
      <div className="text-center">
        <div 
          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: enabled ? 'rgba(107, 233, 76, 0.1)' : 'rgba(207, 198, 254, 0.1)',
            color: enabled ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)',
            border: `1px solid ${enabled ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)'}`
          }}
        >
          {getShareStatus()}
        </div>
      </div>

      {/* Preview da tela compartilhada */}
      {stream && (
        <div className="rounded-lg overflow-hidden border border-opacity-20" 
             style={{ borderColor: 'var(--seasalt, #f9fbfc)' }}>
          <video 
            ref={videoRef}
            className="w-full h-64 object-contain"
            style={{ backgroundColor: 'var(--night, #0e0f0f)' }}
            muted
            autoPlay
            playsInline
          />
        </div>
      )}

      {/* Controles */}
      <AudioControls
        isEnabled={enabled}
        isListening={listening}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        hasRecording={recordedChunks.length > 0}
        onDownload={handleDownload}
      />

      {/* Display da transcrição */}
      <TranscriptionDisplay
        transcript={transcript}
        isListening={listening}
      />

      {/* Erro da transcrição */}
      {error && (
        <div className="rounded-lg p-4 border border-red-500 border-opacity-30" 
             style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-red-500">Erro na Transcrição</h4>
              <p className="text-sm" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 