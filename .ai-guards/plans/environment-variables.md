# Variáveis de Ambiente - Vortex Vault

## Variáveis Obrigatórias

### Database
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
DIRECT_URL="postgresql://username:password@localhost:5432/database_name"
```

### Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

### OpenAI
```bash
OPENAI_API_KEY="sk-..."
```

### App Configuration
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Variáveis Opcionais (Para Otimizações)

### TanStack Query Configuration
```bash
NEXT_PUBLIC_QUERY_STALE_TIME="300000"  # 5 minutes
NEXT_PUBLIC_QUERY_CACHE_TIME="600000"  # 10 minutes
```

### Redis (Para cache avançado - Fase 5)
```bash
REDIS_URL="redis://localhost:6379"
```

## Configuração para Desenvolvimento

1. Copie o arquivo `.env` existente como referência
2. Configure as variáveis conforme seu ambiente
3. Para TanStack Query, as variáveis opcionais serão usadas nas próximas fases

## Configuração para Produção

- Use variáveis de ambiente seguras
- Configure `DIRECT_URL` para connection pooling
- Considere usar Redis para cache em produção 