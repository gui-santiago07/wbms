
import { ReactNode } from 'react';

export enum MachineStatus {
  RUNNING = 'RUNNING',
  DOWN = 'DOWN',
  PAUSED = 'PAUSED',
  SETUP = 'SETUP',
  STANDBY = 'STANDBY',
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  STOP_REASON = 'STOP_REASON',
  PAUSE_REASON = 'PAUSE_REASON',
  SETUP = 'SETUP',
  HELP = 'HELP',
  OEE = 'OEE',
  PRODUCTION_LINE_MODAL = 'PRODUCTION_LINE_MODAL',

  DOWNTIME = 'DOWNTIME', // Tela focada em paradas
}

export interface LiveMetrics {
  total: number;
  good: number;
  rejects: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  productionOrderProgress: number;
  possibleProduction: number;

  avgSpeed: number;
  instantSpeed: number;
}

export interface CurrentJob {
  orderId: string;
  orderQuantity: number;
  productId: string;
  productName: string;
}

export interface DowntimeEvent {
  id: string;
  operator: string;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  totalTime: string | null;
  reason: string;
}

export interface DowntimeReason {
  id: string;
  code: string;
  description: string;
}

export interface DowntimeReasonCategory {
  category: string;
  reasons: DowntimeReason[];
}

export interface ProductionOrder {
  id: string;
  name: string;
  product: string;
  quantity: number;
  dueDate: string;
}

// Tipos para API real
export interface Job {
  job_number_key: number;

  part_id: string;
  start_time: string;
  end_time: string;
  total_count: number;
  good_count: number;
  reject_count: number;
  asset_id: string;
  sector: string;
  plant: string;
}

export interface ApiProduct {
  product_key: string;
  product: string;
  internal_code: string;
  units_per_package: number;
  client_line_key: string;
}



export interface ProductFilter {
  plantas: string[];
  setores: string[];
  linhas: string[];
  useIds: boolean;
}



export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}





// Novos tipos para as funcionalidades WBMS
export interface TimeDistribution {
  produced: number; // porcentagem
  stopped: number; // porcentagem
  standby: number; // porcentagem
  setup: number; // porcentagem
  totalTime: string; // formato hh:mm:ss
}

export interface StopReason {
  id: string;
  code: string;
  description: string;
  category: string;
  totalTime: string; // tempo total parado
  occurrences: number; // quantidade de ocorrências
}

export interface ProductionStatus {
  status: 'PRODUZINDO' | 'PARADO' | 'SETUP' | 'STANDBY';
  icon: string;
  color: string;
  producingTime: string; // tempo produzindo hh:mm:ss
  producingPercentage: number; // porcentagem do tempo produzindo
  stoppedTime: string; // tempo parado hh:mm:ss
}

export interface ProductSelection {
  id: string;
  name: string;
  product_key: string;
  product: string;
  internal_code: string;
  units_per_package: number;
  isSelected: boolean;
  // Campos de compatibilidade
  code?: string;
  description?: string;
}

export interface SetupType {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
}

// Tipos para o sistema de controle de produção
export interface Timesheet {
  id: string;
  client_line_key: string;
  line_name: string;
  product_id: string;
  product_name: string;
  start_time: string;
  end_time: string | null;
  is_finished: boolean;
  total_count?: number;
  good_count?: number;
  reject_count?: number;
}

export interface ProductionLine {
  client_line_key: string;
  line: string;
  description?: string;
  is_active?: boolean;
}



export interface ApiProductionStatus {
  machine_status: 'RUNNING' | 'STOPPED' | 'SETUP' | 'PAUSED' | 'STANDBY';
  total_produced: number;
  good_produced: number;
  rejects: number;
  oee: {
    overall: number;
    availability: number;
    performance: number;
    quality: number;
  };
  current_speed: number;
  target_speed: number;
  uptime: string;
  downtime: string;
  last_updated: string;
}

export interface Product {
  id: string;
  name: string;
  product_key: string;
  product: string;
  internal_code: string;
  units_per_package: number;
  // Campos de compatibilidade com código existente
  code?: string;
  description?: string;
  sku?: string;
}

export interface ProductionControlState {
  currentTimesheet: Timesheet | null;
  availableLines: ProductionLine[];
  availableProducts: Product[];
  productionStatus: ApiProductionStatus | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
}

export interface StartProductionData {
  line_id: string;
  product_id: string;
  setup_description?: string;
}

export interface StopProductionData {
  reason: string;
  description?: string;
}
