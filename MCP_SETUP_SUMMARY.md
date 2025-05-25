# Configuração MCP - Resumo

## Dependências Instaladas

### 1. Context7 MCP
- **Comando**: `npx -y @upstash/context7-mcp`
- **Status**: ✅ Instalado e funcionando
- **Descrição**: Servidor MCP para documentação de bibliotecas

### 2. AI Guards MCP
- **Comando**: `ai-guards-mcp`
- **Status**: ✅ Instalado e funcionando
- **Localização**: `/usr/local/bin/ai-guards-mcp` (link simbólico)
- **Arquivo original**: `/root/Vortex/precedent/dist/ai-guards/mcp/server.mjs`
- **Descrição**: Servidor MCP personalizado para planejamento de features

## Estrutura de Pastas AI Guards

- `ai-guards/`: Código fonte do CLI (ESSENCIAL - mantida)
- `ai-guards.json`: Arquivo de configuração do projeto
- `.ai-guards/`: ❌ REMOVIDA (pasta de dados gerada automaticamente pelo comando `init`)

## Configuração do Cursor

Arquivo: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "ai-guards": {
      "command": "ai-guards-mcp",
      "args": []
    }
  }
}
```

## Correções Realizadas

1. **Problema ES Modules**: Corrigido o `tsconfig.json` do ai-guards para usar `"module": "ES2020"` em vez de `"commonjs"`
2. **Compilação**: Recompilado o projeto com `npm run build:ai-guards`
3. **Link Global**: Criado link simbólico para `ai-guards-mcp` em `/usr/local/bin/`
4. **Limpeza**: Removida pasta `.ai-guards/` desnecessária (gerada automaticamente)

## Como Testar

```bash
# Testar Context7
timeout 5s npx -y @upstash/context7-mcp

# Testar AI Guards
timeout 5s ai-guards-mcp

# Verificar configuração
cat ~/.cursor/mcp.json
```

## Próximos Passos

1. Reiniciar o Cursor para carregar a nova configuração MCP
2. Verificar se os servidores aparecem na interface do Cursor
3. Testar as funcionalidades dos MCPs através do Cursor

## Dependências do Projeto

- `@modelcontextprotocol/sdk`: ^1.12.0 (instalado)
- Node.js com suporte a ES Modules
- TypeScript configurado para ES2020 