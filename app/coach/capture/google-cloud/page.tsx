import GoogleCloudTranscriptionDisplay from '../components/GoogleCloudTranscriptionDisplay';

export default function GoogleCloudTranscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎤 Google Cloud Speech-to-Text
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema avançado de transcrição em tempo real que combina áudio do microfone 
            e tela compartilhada usando a API do Google Cloud Speech-to-Text.
          </p>
        </div>
        
        <GoogleCloudTranscriptionDisplay />
        
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Antes de Começar
            </h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>Configure as credenciais do Google Cloud (veja docs/GOOGLE_CLOUD_SETUP.md)</li>
              <li>Inicie o servidor WebSocket: <code className="bg-yellow-200 px-1 rounded">npm run speech-server</code></li>
                             <li>Aguarde a conexão aparecer como &quot;Conectado ao servidor&quot;</li>
               <li>Clique em &quot;Iniciar Transcrição&quot; e permita acesso ao microfone e compartilhamento de tela</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 