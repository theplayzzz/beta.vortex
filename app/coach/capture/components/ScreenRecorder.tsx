'use client'

import { useState, useEffect } from 'react'
import { useCombinedAudioTranscription } from '../lib/useCombinedAudioTranscription'
import { UnifiedTranscriptionDisplay } from './UnifiedTranscriptionDisplay'

export function ScreenRecorder() {
  const [enabled, setEnabled] = useState(false)
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [microphoneVolume, setMicrophoneVolume] = useState(1.0)
  const [screenAudioVolume, setScreenAudioVolume] = useState(1.0)
  
  // Hook para transcrição unificada
  const transcription = useCombinedAudioTranscription({
    enabled: enabled,
    microphoneEnabled: microphoneEnabled,
    screenAudioStream: screenStream,
    recogLang: 'pt-BR',
    interimResults: true,
  })

  // Verificar compatibilidade do navegador
  useEffect(() => {
    console.log('Verificando compatibilidade do sistema unificado...')
    
    const speechSupport = !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    )
    
    const getDisplayMediaAvailable = !!(
      navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
    )
    
    const getUserMediaAvailable = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    )
    
    console.log('speechSupport:', speechSupport)
    console.log('getDisplayMedia:', getDisplayMediaAvailable)
    console.log('getUserMedia:', getUserMediaAvailable)
    
    if (!speechSupport) {
      setError('Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.')
      return
    }
    
    if (!getDisplayMediaAvailable) {
      setError('Seu navegador não suporta compartilhamento de tela. Use Chrome ou Edge.')
      return
    }
    
    if (!getUserMediaAvailable) {
      setError('Seu navegador não suporta acesso ao microfone. Use Chrome ou Edge.')
      return
    }
    
    console.log('Sistema unificado compatível')
  }, [])

  // Iniciar compartilhamento de tela
  const startScreenSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Importante: solicitar áudio da tela
      })
      
      setScreenStream(mediaStream)
      setEnabled(true)
      setError(null)
      
      // Habilitar microfone automaticamente para sistema completo
      setMicrophoneEnabled(true)
      
      // Listener para quando o usuário para o compartilhamento
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('Compartilhamento de tela encerrado pelo usuário')
          stopScreenSharing()
        }
      }
      
      console.log('Sistema unificado iniciado')
    } catch (err) {
      console.error('Erro ao iniciar compartilhamento de tela:', err)
      setError('Erro ao iniciar compartilhamento de tela. Verifique as permissões.')
    }
  }

  // Parar compartilhamento de tela
  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    
    setEnabled(false)
    setMicrophoneEnabled(false)
    setError(null)
    console.log('Sistema unificado parado')
  }

  // Toggle microfone
  const toggleMicrophone = () => {
    setMicrophoneEnabled(!microphoneEnabled)
  }

  // Resetar transcrições
  const resetTranscription = () => {
    transcription.reset()
  }

  // Ajustar volume do microfone
  const handleMicrophoneVolumeChange = (volume: number) => {
    setMicrophoneVolume(volume)
    transcription.setMicrophoneVolume(volume)
  }

  // Ajustar volume da tela
  const handleScreenAudioVolumeChange = (volume: number) => {
    setScreenAudioVolume(volume)
    transcription.setScreenAudioVolume(volume)
  }

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [screenStream])

  // Determinar status do sistema
  const getSystemStatus = () => {
    if (!enabled) return 'Sistema Pronto'
    
    const sources = []
    if (microphoneEnabled && transcription.microphoneLevel > 0) sources.push('🎤 Mic')
    if (screenStream && transcription.screenAudioLevel > 0) sources.push('🖥️ Tela')
    
    if (sources.length === 0) return '⚡ Sistema Ativo'
    return `⚡ ${sources.join(' + ')}`
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sistema de Transcrição Unificado</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={enabled ? stopScreenSharing : startScreenSharing}
            disabled={!!error}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              enabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400'
            }`}
          >
            {enabled ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
                </svg>
                Parar Sistema
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
                Iniciar Sistema
              </>
            )}
          </button>
          
          {enabled && (
            <button
              onClick={toggleMicrophone}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center ${
                microphoneEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {microphoneEnabled ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                  </svg>
                  Microfone ON
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Microfone OFF
                </>
              )}
            </button>
          )}
          
          {transcription.transcript && (
            <button
              onClick={resetTranscription}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
              Limpar
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
          <p><strong>Status:</strong> {getSystemStatus()}</p>
          <p><strong>Sistema:</strong> Combina microfone + áudio da tela em uma única transcrição</p>
          {enabled && (
            <div className="mt-2 space-y-1">
              <p>• <strong>Microfone:</strong> {microphoneEnabled ? 'Ativo' : 'Inativo'} 
                {transcription.microphoneLevel > 0 && ` (${Math.round(transcription.microphoneLevel * 100)}%)`}
              </p>
              <p>• <strong>Tela:</strong> {screenStream ? 'Ativo' : 'Inativo'} 
                {transcription.screenAudioLevel > 0 && ` (${Math.round(transcription.screenAudioLevel * 100)}%)`}
              </p>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 space-y-1 bg-blue-50 rounded-lg p-3">
          <p><strong>🔧 Sistema Unificado:</strong></p>
          <p>✅ Captura áudio do microfone via getUserMedia()</p>
          <p>✅ Captura áudio da tela via getDisplayMedia()</p>
          <p>✅ Combina ambos usando Web Audio API</p>
          <p>✅ Processa stream unificado com Web Speech API</p>
          <p>✅ Retorna transcrição única de ambas as fontes</p>
        </div>
      </div>
      
      <UnifiedTranscriptionDisplay
        transcript={transcription.transcript}
        listening={transcription.listening}
        microphoneLevel={transcription.microphoneLevel}
        screenAudioLevel={transcription.screenAudioLevel}
        microphoneVolume={microphoneVolume}
        screenAudioVolume={screenAudioVolume}
        onMicrophoneVolumeChange={handleMicrophoneVolumeChange}
        onScreenAudioVolumeChange={handleScreenAudioVolumeChange}
        error={transcription.error}
      />
    </div>
  )
} 