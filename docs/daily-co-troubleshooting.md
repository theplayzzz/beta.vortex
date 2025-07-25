# 🛠️ Daily.co Híbrido - Troubleshooting

## 🚨 Problemas Identificados e Soluções

### **Bug #1: Runtime Error - addEventListener undefined**

#### **🔍 Problema:**
```
Runtime Error
Error: Cannot read properties of undefined (reading 'addEventListener')
```

#### **📍 Localização:**
- **Arquivo:** `app/coach/capture/lib/useDailyTranscription.ts`
- **Linha:** 494:28
- **Código:** `navigator.mediaDevices.addEventListener('devicechange', updateAvailableDevices)`

#### **🔍 Causa Raiz:**
`navigator.mediaDevices` pode ser `undefined` em contextos:
- **HTTP não-seguro** (apenas HTTPS ou localhost permite MediaDevices)
- **Browsers antigos** sem suporte
- **Configurações restritivas** do browser

#### **✅ Solução Aplicada:**
```typescript
// ANTES (problemático)
navigator.mediaDevices.addEventListener('devicechange', updateAvailableDevices);

// DEPOIS (seguro)
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
  navigator.mediaDevices.addEventListener('devicechange', updateAvailableDevices);
  
  return () => {
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', updateAvailableDevices);
    }
  };
}
```

---

### **Bug #2: Console Error - enumerateDevices undefined**

#### **🔍 Problema:**
```
Console Error
Error: Cannot read properties of undefined (reading 'enumerateDevices')
```

#### **📍 Localização:**
- **Arquivo:** `app/coach/capture/lib/useDailyTranscription.ts`
- **Linha:** 154:52  
- **Código:** `const devices = await navigator.mediaDevices.enumerateDevices()`

#### **🔍 Causa Raiz:**
Mesma causa do Bug #1 - `navigator.mediaDevices` undefined.

#### **✅ Solução Aplicada:**
```typescript
// ANTES (problemático)
const devices = await navigator.mediaDevices.enumerateDevices();

// DEPOIS (seguro)
if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  console.warn('⚠️ navigator.mediaDevices não disponível');
  return;
}

const devices = await navigator.mediaDevices.enumerateDevices();
```

---

### **Bug #3: getUserMedia Error**

#### **🔍 Problema Potencial:**
Mesmo padrão de erro com `getUserMedia` em contextos não-seguros.

#### **✅ Solução Preventiva:**
```typescript
// Verificação adicionada
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.error('❌ getUserMedia não disponível - verifique se está em HTTPS');
  setState(prev => ({
    ...prev,
    error: 'Acesso ao microfone não disponível (necessário HTTPS)',
    devicePermissions: { ...prev.devicePermissions, microphone: false }
  }));
  return false;
}
```

---

## 🛡️ Sistema de Diagnóstico Implementado

### **Função checkMediaDevicesSupport():**
```typescript
const checkMediaDevicesSupport = () => {
  const support = {
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
    enumerateDevices: !!(navigator.mediaDevices?.enumerateDevices),
    addEventListener: !!(navigator.mediaDevices?.addEventListener),
    isSecureContext: !!window.isSecureContext,
    protocol: window.location.protocol
  };
  
  console.log('📋 Diagnóstico MediaDevices:', support);
  return support;
};
```

### **Exemplo de Output:**
```javascript
📋 Diagnóstico MediaDevices: {
  mediaDevices: true,
  getUserMedia: true, 
  enumerateDevices: true,
  addEventListener: true,
  isSecureContext: true,
  protocol: "https:"
}
```

---

## 🔧 Verificações de Ambiente

### **✅ Ambiente Ideal:**
- ✅ **HTTPS** ou **localhost**
- ✅ **Browser moderno** (Chrome 60+, Firefox 55+, Safari 11+)
- ✅ **Permissões** de microfone habilitadas
- ✅ **Contexto seguro** (window.isSecureContext = true)

### **❌ Ambientes Problemáticos:**
- ❌ **HTTP** em domínio remoto
- ❌ **Browsers antigos** (IE, Chrome <60)
- ❌ **Modo incógnito** com permissões bloqueadas
- ❌ **Extensões** que bloqueiam MediaDevices

---

## 🚨 Mensagens de Erro Melhoradas

### **Para o Usuário:**

#### **Contexto Não-Seguro:**
```
⚠️ Acesso ao microfone não disponível (necessário HTTPS)
```

#### **Browser Não Suportado:**
```
⚠️ Seu browser não suporta gravação de áudio
```

#### **Permissões Negadas:**
```
⚠️ Permissão de microfone negada ou não disponível
```

### **Para o Desenvolvedor (Console):**
```javascript
❌ getUserMedia não disponível - verifique se está em HTTPS
⚠️ navigator.mediaDevices não disponível
📋 Diagnóstico MediaDevices: {...}
```

---

## 🎯 Estratégias de Fallback

### **1. Detecção Graceful:**
- Verificar `navigator.mediaDevices` antes de usar
- Verificar cada método individualmente
- Logs informativos no console

### **2. Interface Adaptativa:**
- Desabilitar controles quando API não disponível
- Mostrar mensagens explicativas
- Manter funcionalidade básica

### **3. Degradação Progressiva:**
- Transcrição ainda funciona via Daily.co
- Interface continua responsiva
- Usuário informado do problema

---

## 🧪 Como Testar

### **Teste Local (Deve Funcionar):**
```bash
# Acessar via localhost (contexto seguro)
http://localhost:3000/coach/capture/daily-co

# Console deve mostrar:
📋 Diagnóstico MediaDevices: { 
  mediaDevices: true, 
  isSecureContext: true, 
  protocol: "http:" 
}
```

### **Teste HTTP Remoto (Deve Falhar Gracefully):**
```bash
# Acessar via HTTP remoto (contexto inseguro) 
http://exemplo.com/coach/capture/daily-co

# Console deve mostrar:
⚠️ navigator.mediaDevices não disponível
❌ getUserMedia não disponível - verifique se está em HTTPS
```

### **Teste HTTPS (Deve Funcionar):**
```bash
# Acessar via HTTPS (contexto seguro)
https://exemplo.com/coach/capture/daily-co

# Console deve mostrar diagnóstico completo
```

---

## ✅ Status das Correções

| **Problema** | **Identificado** | **Corrigido** | **Testado** |
|-------------|:----------------:|:-------------:|:-----------:|
| addEventListener undefined | ✅ | ✅ | ⏳ |
| enumerateDevices undefined | ✅ | ✅ | ⏳ |
| getUserMedia undefined | ✅ | ✅ | ⏳ |
| Cleanup errors | ✅ | ✅ | ⏳ |
| Sistema diagnóstico | ✅ | ✅ | ⏳ |

## 🎉 Resultado

✅ **Bugs críticos corrigidos**  
✅ **Fallbacks implementados**  
✅ **Mensagens informativas**  
✅ **Sistema de diagnóstico**  
✅ **Interface robusta**  

**O sistema agora deve funcionar sem erros mesmo em ambientes problemáticos, informando adequadamente o usuário sobre limitações.**

---

*Troubleshooting Guide para Daily.co Híbrido  
Última atualização: 2025-07-22  
Status: Bugs corrigidos - Testes pendentes* 