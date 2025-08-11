// Configurações de ambiente
interface EnvironmentConfig {
  apiBaseUrl: string;
  pollingInterval: number;
  defaultShiftId: string;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    // 🚀 VOLTAR PARA PROXY SIMPLES
    apiBaseUrl: '/api',
    pollingInterval: 3000,
    defaultShiftId: 'turno_1'
  },
  staging: {
    apiBaseUrl: 'https://staging.option7.ai/api',
    pollingInterval: 5000,
    defaultShiftId: 'turno_1' 
  },
  production: {
    apiBaseUrl: 'https://staging.option7.ai/api',
    pollingInterval: 10000,
    defaultShiftId: 'turno_1'
  },
  vercel: {
    // 🚀 PROXY VERCEL ATIVADO
    apiBaseUrl: '/api',
    pollingInterval: 5000,
    defaultShiftId: 'turno_1'
  }
};

// Determinar ambiente atual
const getCurrentEnvironment = (): string => {
  // 🔧 1. Verificar query parameter ?env=staging na URL
  const urlParams = new URLSearchParams(window.location.search);
  const envParam = urlParams.get('env');
  if (envParam && environments[envParam]) {
    return envParam;
  }

  //teste

  // 🔧 2. Usar window.location.hostname para detectar ambiente
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  
  // 🔧 3. Detectar ambiente Vercel
  if (hostname.includes('vercel.app')) return 'vercel';
  
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
  console.log('🔧 Configuração de Ambiente:', {
    environment: getCurrentEnvironment(),
    apiBaseUrl: config.apiBaseUrl,
    pollingInterval: config.pollingInterval,
    detectedBy: new URLSearchParams(window.location.search).get('env') ? 'query parameter' : 'hostname detection'
  });
} 