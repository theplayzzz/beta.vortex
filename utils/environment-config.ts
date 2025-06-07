/**
 * Utilitários para Configuração Específica por Ambiente
 * Phase 6: Environment-Specific Configuration
 */

export type Environment = 'development' | 'preview' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  baseUrl: string;
  webhookUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isPreview: boolean;
  domain: string;
  protocol: 'http' | 'https';
}

/**
 * Detecta o ambiente atual baseado nas variáveis de ambiente
 */
export function getEnvironment(): Environment {
  // Vercel específico
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV as Environment;
  }
  
  // Node env fallback
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
}

/**
 * Gera URL base baseada no ambiente
 */
export function getBaseUrl(): string {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      // Em produção, usar domain custom se configurado, senão VERCEL_URL
      if (process.env.NEXT_PUBLIC_PRODUCTION_URL) {
        return process.env.NEXT_PUBLIC_PRODUCTION_URL;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      return 'https://your-domain.com'; // Fallback

    case 'preview':
      // Preview deployments sempre usam VERCEL_URL
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      return 'https://preview-deployment.vercel.app'; // Fallback

    case 'development':
    default:
      // Desenvolvimento local
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
  }
}

/**
 * Gera URL do webhook baseada no ambiente
 */
export function getWebhookUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/webhooks/clerk`;
}

/**
 * Retorna configuração completa do ambiente
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = getEnvironment();
  const baseUrl = getBaseUrl();
  const webhookUrl = getWebhookUrl();
  
  const urlObj = new URL(baseUrl);
  
  return {
    environment,
    baseUrl,
    webhookUrl,
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isPreview: environment === 'preview',
    domain: urlObj.hostname,
    protocol: urlObj.protocol.replace(':', '') as 'http' | 'https'
  };
}

/**
 * Valida se todas as variáveis de ambiente necessárias estão configuradas
 */
export function validateEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET'
  ];

  const optional = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_PRODUCTION_URL'
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Verificar variáveis obrigatórias
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Verificar variáveis opcionais mas recomendadas
  optional.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Utilitários específicos para Webhook do Clerk
 */
export const clerkWebhookConfig = {
  /**
   * Gera configuração do webhook para diferentes ambientes
   */
  getWebhookConfig(env: Environment = getEnvironment()) {
    const baseUrl = getBaseUrl();
    
    return {
      url: `${baseUrl}/api/webhooks/clerk`,
      events: [
        'user.created',
        'user.updated', 
        'user.deleted',
        'session.created',
        'session.ended'
      ],
      headers: {
        'X-Environment': env,
        'X-Source': 'approval-system'
      }
    };
  },

  /**
   * Valida se webhook está configurado corretamente
   */
  validateWebhookConfig(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      issues.push('CLERK_WEBHOOK_SECRET não configurado');
    }
    
    if (!process.env.CLERK_SECRET_KEY) {
      issues.push('CLERK_SECRET_KEY não configurado');
    }

    const baseUrl = getBaseUrl();
    if (baseUrl.includes('localhost') && getEnvironment() !== 'development') {
      issues.push('URL localhost detectada em ambiente não-development');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

/**
 * Logging estruturado por ambiente
 */
export const environmentLogger = {
  log(message: string, data?: any) {
    const config = getEnvironmentConfig();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      environment: config.environment,
      message,
      ...(data && { data })
    };

    if (config.isDevelopment) {
      console.log('🔧 [DEV]', message, data || '');
    } else {
      console.log(JSON.stringify(logEntry));
    }
  },

  error(message: string, error?: Error) {
    const config = getEnvironmentConfig();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      environment: config.environment,
      level: 'error',
      message,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };

    if (config.isDevelopment) {
      console.error('❌ [DEV]', message, error || '');
    } else {
      console.error(JSON.stringify(logEntry));
    }
  },

  warn(message: string, data?: any) {
    const config = getEnvironmentConfig();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      environment: config.environment,
      level: 'warning',
      message,
      ...(data && { data })
    };

    if (config.isDevelopment) {
      console.warn('⚠️ [DEV]', message, data || '');
    } else {
      console.warn(JSON.stringify(logEntry));
    }
  }
};

/**
 * Utilitário para configuração do Vercel
 */
export const vercelConfig = {
  /**
   * Gera comandos para configurar variáveis de ambiente no Vercel
   */
  generateVercelEnvCommands(): string[] {
    const envVars = [
      'CLERK_WEBHOOK_SECRET',
      'CLERK_SECRET_KEY', 
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXTAUTH_SECRET',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
    ];

    const commands: string[] = [];

    envVars.forEach(varName => {
      ['production', 'preview', 'development'].forEach(env => {
        commands.push(`vercel env add ${varName} ${env}`);
      });
    });

    return commands;
  },

  /**
   * Gera arquivo de configuração para Vercel
   */
  generateVercelJson() {
    return {
      functions: {
        'app/api/webhooks/clerk/route.ts': {
          maxDuration: 30
        },
        'app/api/admin/users/[userId]/moderate/route.ts': {
          maxDuration: 30
        }
      },
      headers: [
        {
          source: '/api/health/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate'
            }
          ]
        }
      ],
      redirects: [
        {
          source: '/admin',
          destination: '/admin/moderate',
          permanent: false
        }
      ]
    };
  }
}; 