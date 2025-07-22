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
    apiBaseUrl: 'https://staging-api.empresa.com/api',
    pollingInterval: 5000, // 5 segundos para staging
    defaultShiftId: 'turno_1'
  },
  production: {
    apiBaseUrl: 'https://api.empresa.com/api',
    pollingInterval: 10000, // 10 segundos para produção
    defaultShiftId: 'turno_1'
  }
};

// Determinar ambiente atual
const getCurrentEnvironment = (): string => {
  // Usar window.location.hostname para detectar ambiente
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  if (hostname.includes('staging')) return 'staging';
  return 'production';
};

export const config: EnvironmentConfig = environments[getCurrentEnvironment()];

// Configurações específicas para desenvolvimento
export const isDevelopment = getCurrentEnvironment() === 'development';
export const isProduction = getCurrentEnvironment() === 'production';

// Log da configuração atual (apenas em desenvolvimento)
if (isDevelopment) {
  console.log('🔧 Configuração do ambiente:', {
    environment: getCurrentEnvironment(),
    apiBaseUrl: config.apiBaseUrl,
    pollingInterval: config.pollingInterval
  });
} 