// Configurações de ambiente
interface EnvironmentConfig {
  apiBaseUrl: string;
  pollingInterval: number;
  defaultShiftId: string;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    apiBaseUrl: 'http://localhost:8090/api',
    pollingInterval: 3000, // 3 segundos para desenvolvimento
    defaultShiftId: 'turno_1'
  },
  staging: {
    apiBaseUrl: 'https://staging.option7.ai/api',
    pollingInterval: 5000, // 5 segundos para staging
    defaultShiftId: 'turno_1' 
  },
  production: {
    apiBaseUrl: 'https://option7.ai/api',
    pollingInterval: 10000, // 10 segundos para produção
    defaultShiftId: 'turno_1'
  },
  vercel: {
    apiBaseUrl: '/api', // URL relativa que será interceptada pelo proxy do Vercel
    pollingInterval: 5000, // 5 segundos para Vercel
    defaultShiftId: 'turno_1'
  }
};

// Determinar ambiente atual
const getCurrentEnvironment = (): string => {
  // 🔧 1. Verificar query parameter ?env=staging na URL
  const urlParams = new URLSearchParams(window.location.search);
  const envParam = urlParams.get('env');
  if (envParam && environments[envParam]) {
    console.log('🌍 Ambiente definido por query parameter:', envParam);
    return envParam;
  }

  // 🔧 2. PARA FORÇAR STAGING LOCALMENTE, DESCOMENTE A LINHA ABAIXO:
  // return 'staging';
  
  // 🔧 3. Usar window.location.hostname para detectar ambiente (padrão)
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  
  // 🔧 4. SOLUÇÃO CORS: Usar configuração específica para Vercel
  if (hostname.includes('vercel.app')) {
    console.log('🌍 Vercel detectado - usando proxy configurado');
    return 'vercel';
  }
  
  if (hostname.includes('staging')) return 'staging';
  return 'production';
};

export const config: EnvironmentConfig = environments[getCurrentEnvironment()];

// Configurações específicas para desenvolvimento
export const isDevelopment = getCurrentEnvironment() === 'development';
export const isProduction = getCurrentEnvironment() === 'production';
export const isStaging = getCurrentEnvironment() === 'staging';
export const isVercel = getCurrentEnvironment() === 'vercel';

// Exportar ambiente atual para debug
export const currentEnvironment = getCurrentEnvironment();

// Log da configuração atual (apenas em desenvolvimento, staging e vercel)
if (isDevelopment || isStaging || isVercel) {
  console.log('🔧 Configuração do ambiente:', {
    environment: getCurrentEnvironment(),
    apiBaseUrl: config.apiBaseUrl,
    pollingInterval: config.pollingInterval,
    detectedBy: new URLSearchParams(window.location.search).get('env') ? 'query parameter' : 'hostname detection'
  });
} 