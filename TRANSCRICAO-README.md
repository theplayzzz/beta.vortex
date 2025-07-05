# 🎙️ Sistema de Transcrição em Tempo Real

Este projeto implementa um sistema de transcrição em tempo real de tela compartilhada usando Web Speech API.

## 🚀 Como Usar

### 1. Configurar HTTPS (Obrigatório)

As APIs de mídia do navegador (Screen Sharing e Speech Recognition) **requerem HTTPS** por segurança.

```bash
# Executar setup automático
./setup-https.sh

# OU configurar manualmente:
mkdir -p .ssl
openssl genrsa -out .ssl/localhost.key 2048
openssl req -new -x509 -key .ssl/localhost.key -out .ssl/localhost.crt -days 365 \
    -subj "/C=BR/ST=State/L=City/O=Organization/CN=localhost"
```

### 2. Executar com HTTPS

```bash
# Executar servidor HTTPS
npm run dev:https

# Acessar via localhost:
# https://localhost:3003/coach/capture

# Acessar via IP público:
# https://5.161.64.137:3003/coach/capture
```

### 3. Aceitar Certificado

⚠️ **Importante**: Seu navegador mostrará um aviso de segurança sobre o certificado autoassinado.

1. Clique em **"Avançado"** ou **"Advanced"**
2. Clique em **"Continuar para localhost (inseguro)"** ou **"Proceed to localhost (unsafe)"**
3. Isso é normal para certificados autoassinados em desenvolvimento

## 🛠️ Funcionalidades

### ✅ Implementadas
- **Compartilhamento de tela** com áudio
- **Preview em tempo real** da tela compartilhada
- **Transcrição em tempo real** com Web Speech API
- **Gravação de áudio** em formato WebM
- **Download de áudio** gravado
- **Interface responsiva** com design system
- **Verificação de compatibilidade** robusta
- **Gestão de recursos** e cleanup automático

### 🔄 Em Desenvolvimento (Próximas Etapas)
- Integração completa com Web Speech API
- Processamento avançado de frases
- Exportação de transcrições
- Histórico de sessões
- Configurações personalizáveis

## 🔧 Arquitetura

```
app/coach/capture/
├── page.tsx                    # Página principal
├── components/
│   ├── ScreenRecorder.tsx      # Componente principal
│   ├── TranscriptionDisplay.tsx # Exibição de transcrições
│   └── AudioControls.tsx       # Controles de interface
└── lib/
    └── useScreenTranscription.ts # Hook de transcrição
```

## 📋 Requisitos

- **Navegador**: Chrome 74+ ou Edge 79+
- **Protocolo**: HTTPS (obrigatório)
- **Conexão**: Internet (para Web Speech API)
- **Permissões**: Compartilhamento de tela

## 🐛 Solução de Problemas

### "Incompatibilidade Detectada"
- **Causa**: Executando em HTTP em vez de HTTPS
- **Solução**: Use `npm run dev:https` em vez de `npm run dev`

### "Permissão Negada"
- **Causa**: Usuário negou permissão para compartilhar tela
- **Solução**: Recarregue a página e aceite as permissões

### "Certificado Inválido"
- **Causa**: Certificado autoassinado não aceito
- **Solução**: Aceite o certificado conforme instruções acima

## 🔒 Segurança

- **Áudio processado localmente**: Não enviamos dados para servidores externos
- **Web Speech API**: Processamento nativo do navegador
- **Certificados locais**: Apenas para desenvolvimento

## 📊 Status do Projeto

**Progresso**: 3/7 etapas concluídas (43%)

- ✅ **Etapa 1**: Análise e estruturação
- ✅ **Etapa 2**: Implementação base
- ✅ **Etapa 3**: Screen Sharing + HTTPS
- 🔄 **Etapa 4**: Integração Web Speech API
- ⏳ **Etapa 5**: Processamento avançado
- ⏳ **Etapa 6**: Exportação e histórico
- ⏳ **Etapa 7**: Testes e otimizações

## 🤝 Contribuindo

Este sistema foi desenvolvido como parte do projeto Precedent. Para contribuir:

1. Mantenha o padrão de design estabelecido
2. Teste em Chrome e Edge
3. Documente mudanças importantes
4. Respeite as regras de segurança

---

**Desenvolvido com** ❤️ **usando Next.js 15, TypeScript, e Web APIs nativas** 