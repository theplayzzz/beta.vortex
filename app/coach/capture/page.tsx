'use client'

import { useState } from 'react'
import { ScreenRecorder } from './components/ScreenRecorder'

export default function CapturePage() {
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
              Transcrição de Tela em Tempo Real
            </h1>
            <p className="text-lg" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
              Compartilhe sua tela e obtenha transcrições em tempo real do áudio
            </p>
          </header>

          <div className="rounded-lg shadow-lg p-6 border border-opacity-10 transition-all duration-300 hover:shadow-xl" 
               style={{ 
                 backgroundColor: 'var(--eerie-black, #171818)',
                 borderColor: 'var(--seasalt, #f9fbfc)'
               }}>
            <ScreenRecorder 
              isRecording={isRecording}
              onRecordingChange={setIsRecording}
            />
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm space-y-2" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
              <p>
                <strong style={{ color: 'var(--sgbus-green, #6be94c)' }}>Requisitos:</strong> Chrome ou Edge com conexão à internet
              </p>
              <p>
                <strong style={{ color: 'var(--sgbus-green, #6be94c)' }}>Privacidade:</strong> Áudio processado apenas no navegador
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 