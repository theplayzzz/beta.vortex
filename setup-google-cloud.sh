#!/bin/bash

echo "🔧 Script de Configuração Google Cloud Speech-to-Text"
echo "=================================================="

# Verificar se arquivo de credenciais existe
if [ ! -f "./config/speech-service-key.json" ]; then
    echo "❌ Arquivo de credenciais não encontrado!"
    echo "📝 Siga os passos:"
    echo "   1. Acesse: https://console.cloud.google.com/"
    echo "   2. Crie um projeto ou selecione um existente"
    echo "   3. Habilite a API Speech-to-Text"
    echo "   4. Crie uma Service Account"
    echo "   5. Baixe o arquivo JSON de credenciais"
    echo "   6. Copie o arquivo para: ./config/speech-service-key.json"
    echo ""
    echo "📋 Exemplo da estrutura esperada:"
    cat ./config/speech-service-key.json.example
    echo ""
    exit 1
fi

# Verificar se .env.local tem as variáveis
if ! grep -q "GOOGLE_APPLICATION_CREDENTIALS" .env.local; then
    echo "❌ Variáveis do Google Cloud não encontradas no .env.local"
    echo "✅ Adicionando variáveis necessárias..."
    
    echo "" >> .env.local
    echo "# Google Cloud Speech-to-Text Configuration" >> .env.local
    echo "GOOGLE_APPLICATION_CREDENTIALS=./config/speech-service-key.json" >> .env.local
    echo "GOOGLE_CLOUD_PROJECT_ID=your-project-id" >> .env.local
    echo "WEBSOCKET_PORT=8080" >> .env.local
    echo "NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080" >> .env.local
    echo "NODE_ENV=development" >> .env.local
fi

# Extrair project_id do arquivo de credenciais
PROJECT_ID=$(cat ./config/speech-service-key.json | grep -o '"project_id"[^,]*' | cut -d'"' -f4)

if [ ! -z "$PROJECT_ID" ] && [ "$PROJECT_ID" != "your-project-id" ]; then
    echo "🎯 Projeto detectado: $PROJECT_ID"
    # Atualizar .env.local com o project_id correto
    sed -i "s/GOOGLE_CLOUD_PROJECT_ID=.*/GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID/" .env.local
    echo "✅ Project ID atualizado no .env.local"
fi

echo "✅ Configuração concluída!"
echo ""
echo "🚀 Para aplicar as mudanças:"
echo "   1. Reinicie o servidor WebSocket: npm run speech-server"
echo "   2. Atualize a página do navegador"
echo ""
echo "🌐 Acesse: http://localhost:3003/coach/capture/google-cloud" 