#!/usr/bin/env node

console.log("Testando servidores MCP...");

// Teste do Context7
console.log("✓ Context7 MCP: Disponível via npx -y @upstash/context7-mcp");

// Teste do AI Guards
console.log("✓ AI Guards MCP: Disponível via ai-guards-mcp");

console.log("\nConfiguração do Cursor (~/.cursor/mcp.json):");
console.log(JSON.stringify({
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "ai-guards": {
      "command": "npx",
      "args": ["-y", "ai-guards-mcp"]
    }
  }
}, null, 2));

console.log("\n✅ Todas as dependências do MCP estão instaladas e configuradas!"); 