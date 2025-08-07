// Constantes de cores para o sistema
export const COLORS = {
  // Status de produção
  PRODUCING: '#22c55e',    // Verde - Produzindo
  STOPPED: '#ef4444',      // Vermelho - Parado
  SETUP: '#3b82f6',        // Azul - Setup
  STANDBY: '#f59e0b',      // Laranja - Standby
  ERROR: '#ef4444',        // Vermelho - Erro
  WAITING: '#6b7280',      // Cinza - Aguardando
  
  // Métricas OEE
  OEE: '#3b82f6',          // Azul - OEE
  AVAILABILITY: '#22c55e', // Verde - Disponibilidade
  PERFORMANCE: '#f59e0b',  // Laranja - Performance
  QUALITY: '#8b5cf6',      // Roxo - Qualidade
  
  // Gráficos
  GOOD_PARTS: '#22c55e',   // Verde - Peças boas
  REJECTS: '#ef4444',      // Vermelho - Rejeitos
  TIMELINE: '#3b82f6',     // Azul - Timeline
} as const;

// Constantes de produção
export const PRODUCTION = {
  ESTIMATED_RATE: 100,     // Peças por hora (taxa estimada)
  MIN_TARGET_MULTIPLIER: 1.2, // 20% a mais que o atual
  MIN_TARGET_VALUE: 100,   // Valor mínimo para target
  SECONDS_PER_HOUR: 3600,  // Segundos em uma hora
} as const;

// Constantes de tempo (em milissegundos)
export const TIMING = {
  POLLING_INTERVAL: 3000,  // 3 segundos (pode ser sobrescrito pelo config)
  SHIFT_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_DELAY: 1000,    // 1 segundo
  HOUR_IN_MS: 60 * 60 * 1000, // 1 hora
  DAY_IN_MS: 24 * 60 * 60 * 1000, // 1 dia
} as const;

// Constantes de OEE
export const OEE_THRESHOLDS = {
  EXCELLENT: 90,  // 90% ou mais - Verde
  GOOD: 70,       // 70-89% - Laranja
  POOR: 0,        // Menos de 70% - Vermelho
} as const;

// Constantes de status
export const STATUS = {
  PRODUCING: 'producing',
  STOPPED: 'stopped',
  SETUP: 'setup',
  STANDBY: 'standby',
  ERROR: 'error',
  OFFLINE: 'offline',
  WAITING: 'aguardando...',
} as const;

// Constantes de labels
export const LABELS = {
  PRODUCING: 'PRODUZINDO',
  STOPPED: 'PARADO',
  SETUP: 'SETUP',
  STANDBY: 'STANDBY',
  ERROR: 'ERRO',
  WAITING: 'AGUARDANDO...',
} as const;

// Constantes de ícones
export const ICONS = {
  PRODUCING: '▶️',
  STOPPED: '⏸️',
  SETUP: '🔧',
  STANDBY: '⏸️',
  ERROR: '⚠️',
  WAITING: '⏳',
} as const; 