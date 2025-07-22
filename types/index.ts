
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
  SETUP = 'SETUP',
  HELP = 'HELP',
  OEE = 'OEE',
  PRODUCTION_LINE_MODAL = 'PRODUCTION_LINE_MODAL',
  SHIFT_MODAL = 'SHIFT_MODAL',
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
  timeInShift: number;
  totalShiftTime: number;
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

export interface Product {
    id: string;
    sku: string;
    description: string;
}

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface ProductionLine {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  // Campos adicionais para integração com API real
  shiftNumberKey?: number;
  assetId?: string;
  partId?: string;
  totalCount?: number;
  goodCount?: number;
  rejectCount?: number;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
}
