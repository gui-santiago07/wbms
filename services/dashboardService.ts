// Serviço de Dashboard consumido pela useProductionStore
// Implementação mínima com retornos seguros e compatíveis com o estado da store

type ShiftLike = {
  id?: string | number;
  name?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  shiftNumberKey?: string | number;
} | null;

type OeeHistory = {
  points: Array<{ x: number; y: number }>;
  timeLabels: string[];
  trend: string;
  trendColor: string;
};

type TimeDistributionDTO = {
  produced: number;
  stopped: number;
  standby: number;
  setup: number;
  totalTime: number; // em segundos
};

type TopStopReasonDTO = {
  id: number | string;
  code: string;
  description: string;
  category: string;
  totalTime: number; // em segundos
  occurrences: number;
};

type DowntimeHistoryDTO = Array<{
  id: number | string;
  startTime: string;
  endTime?: string | null;
  duration?: number; // em segundos
  reason: string;
}>;

type DashboardComposite = {
  oeeHistory: OeeHistory;
  timeDistribution: TimeDistributionDTO;
  topStopReasons: TopStopReasonDTO[];
  productionStatus: {
    status: 'PRODUZINDO' | 'PARADO' | 'SETUP' | 'STANDBY';
    icon: string;
    color: string;
    producingTime: string;
    producingPercentage: number;
    stoppedTime: string;
  };
};

export default class DashboardService {
  constructor() {}

  async initializeDashboardData(shift: ShiftLike): Promise<{
    liveMetrics: {
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
    };
    currentJob: any | null;
    productionLine: { client_line_key: string; line: string };
    shift: Required<NonNullable<ShiftLike>>;
  }>
  {
    const resolvedShift: Required<NonNullable<ShiftLike>> = {
      id: (shift?.id ?? '1').toString(),
      name: shift?.name ?? 'Turno',
      startTime: shift?.startTime ?? '00:00',
      endTime: shift?.endTime ?? '23:59',
      isActive: shift?.isActive ?? true,
      shiftNumberKey: shift?.shiftNumberKey ?? (shift?.id ?? '1')
    };

    return {
      liveMetrics: {
        total: 0,
        good: 0,
        rejects: 0,
        oee: 0,
        availability: 0,
        performance: 0,
        quality: 100,
        productionOrderProgress: 0,
        possibleProduction: 0,
        avgSpeed: 0,
        instantSpeed: 0
      },
      currentJob: null,
      productionLine: { client_line_key: '', line: 'Linha' },
      shift: resolvedShift
    };
  }

  async getOeeHistory(_shift: ShiftLike, period: string): Promise<OeeHistory> {
    const pointsCountMap: Record<string, number> = { '1h': 12, '4h': 24, '8h': 32, '24h': 48, '7d': 14 };
    const n = pointsCountMap[period] ?? 12;
    const points: Array<{ x: number; y: number }> = Array.from({ length: n }, (_, i) => ({ x: i * (200 / Math.max(1, (n - 1))), y: Math.max(0, Math.min(100, 50 + Math.sin(i / 3) * 15)) }));
    const timeLabels: string[] = Array.from({ length: Math.min(6, n) }, (_, i) => `${i * Math.floor(n / Math.max(1, (Math.min(6, n) - 1)))}m`);
    const trendVal = (Math.random() * 4 - 2).toFixed(1);
    const trend = `${trendVal}%`;
    const trendColor = parseFloat(trendVal) >= 0 ? 'text-green-400' : 'text-red-400';
    return { points, timeLabels, trend, trendColor };
  }

  async getTimeDistribution(_shift: ShiftLike): Promise<TimeDistributionDTO> {
    return { produced: 0, stopped: 0, standby: 0, setup: 0, totalTime: 0 };
  }

  async getTopStopReasons(_shift: ShiftLike): Promise<TopStopReasonDTO[]> {
    return [];
  }

  async getProductionTimeline(_shift: ShiftLike): Promise<null> {
    return null;
  }

  async getDowntimeHistory(_shift: ShiftLike): Promise<DowntimeHistoryDTO> {
    return [];
  }

  async getDashboardComposite(shift: ShiftLike): Promise<DashboardComposite> {
    const oeeHistory = await this.getOeeHistory(shift, '1h');
    const timeDistribution = await this.getTimeDistribution(shift);
    const topStopReasons = await this.getTopStopReasons(shift);
    const productionStatus = {
      status: 'PARADO' as const,
      icon: '⏸️',
      color: '#f59e0b',
      producingTime: '00:00:00',
      producingPercentage: 0,
      stoppedTime: '00:00:00'
    };
    return { oeeHistory, timeDistribution, topStopReasons, productionStatus };
  }

  async registerEvent(_shift: ShiftLike, _eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST'): Promise<void> {
    return;
  }

  async registerStopEvent(_shift: ShiftLike, _reason: string, _reasonId?: string): Promise<void> {
    return;
  }
}

