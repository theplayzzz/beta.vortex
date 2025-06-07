#!/bin/bash

# Script para Configuração de Variáveis de Ambiente no Vercel
# Phase 6: Environment-Specific Configuration

echo "🚀 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - VERCEL"
echo "================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI não encontrado. Instale com: npm i -g vercel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI encontrado${NC}"

# Verificar se está logado no Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você não está logado no Vercel. Execute: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logado no Vercel como: $(vercel whoami)${NC}"

# Variáveis de ambiente necessárias
declare -A env_vars=(
    ["CLERK_WEBHOOK_SECRET"]="Chave secreta para validação de webhooks do Clerk"
    ["CLERK_SECRET_KEY"]="Chave secreta do Clerk para APIs server-side"
    ["DATABASE_URL"]="URL de conexão com PostgreSQL/Supabase"
    ["DIRECT_URL"]="URL direta para conexão com banco (sem pooling)"
    ["NEXTAUTH_SECRET"]="Chave secreta para NextAuth.js"
    ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]="Chave pública do Clerk"
    ["NEXT_PUBLIC_PRODUCTION_URL"]="URL personalizada para produção (opcional)"
)

# Ambientes do Vercel
environments=("production" "preview" "development")

echo -e "\n${BLUE}📋 Variáveis que serão configuradas:${NC}"
for var in "${!env_vars[@]}"; do
    echo -e "  • ${var}: ${env_vars[$var]}"
done

echo -e "\n${BLUE}🌍 Ambientes: ${environments[*]}${NC}"

# Perguntar confirmação
echo -e "\n${YELLOW}⚠️  Este script irá configurar as variáveis em TODOS os ambientes.${NC}"
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

# Função para adicionar variável de ambiente
add_env_var() {
    local var_name=$1
    local environment=$2
    local description=$3
    
    echo -e "\n${BLUE}🔧 Configurando ${var_name} para ${environment}...${NC}"
    echo -e "   Descrição: ${description}"
    
    # Verificar se a variável já existe no arquivo .env.local
    if [ -f ".env.local" ] && grep -q "^${var_name}=" .env.local; then
        local_value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2-)
        echo -e "   ${YELLOW}Valor encontrado em .env.local${NC}"
        read -p "   Usar valor do .env.local? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            echo "   Digite o valor para ${var_name}:"
            read -s user_value
            echo "$user_value" | vercel env add "$var_name" "$environment"
        else
            echo "$local_value" | vercel env add "$var_name" "$environment"
        fi
    else
        echo "   Digite o valor para ${var_name}:"
        read -s user_value
        echo "$user_value" | vercel env add "$var_name" "$environment"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ ${var_name} configurado para ${environment}${NC}"
    else
        echo -e "   ${RED}❌ Erro ao configurar ${var_name} para ${environment}${NC}"
    fi
}

# Configurar variáveis para cada ambiente
for environment in "${environments[@]}"; do
    echo -e "\n${GREEN}🌍 === CONFIGURANDO AMBIENTE: ${environment^^} ===${NC}"
    
    for var_name in "${!env_vars[@]}"; do
        add_env_var "$var_name" "$environment" "${env_vars[$var_name]}"
    done
done

echo -e "\n${GREEN}🎉 CONFIGURAÇÃO CONCLUÍDA!${NC}"
echo -e "\n${BLUE}📋 Próximos passos:${NC}"
echo "1. Verificar configurações: vercel env ls"
echo "2. Fazer deploy: vercel --prod"
echo "3. Testar health check: curl https://your-domain.com/health"
echo "4. Configurar webhook no Clerk com a URL de produção"

echo -e "\n${YELLOW}📝 URLs importantes:${NC}"
echo "   • Health Check: https://your-domain.com/health"
echo "   • Admin Dashboard: https://your-domain.com/admin/moderate"
echo "   • Webhook Endpoint: https://your-domain.com/api/webhooks/clerk"

echo -e "\n${BLUE}🔗 Links úteis:${NC}"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
echo "   • Clerk Dashboard: https://dashboard.clerk.com"
echo "   • Supabase Dashboard: https://app.supabase.com" 