import GoogleCloudTranscriptionDisplay from '../components/GoogleCloudTranscriptionDisplay';

export default function GoogleCloudTranscriptionPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--seasalt)' }}>
            🎤 Transcrição de Áudio
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--periwinkle)' }}>
            Sistema de transcrição em tempo real
          </p>
        </div>
        
        <GoogleCloudTranscriptionDisplay />
      </div>
    </div>
  );
} 