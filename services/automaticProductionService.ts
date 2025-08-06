import ApiClient from './api';

// Tipos para os dados de produção automática
export interface ProductionShift {
  id: string;
  shift_id: string;
  start_time: string;
  end_time: string | null;
  total_count: number;
  good_count: number;
  reject_count: number;
  run_time: number; // em segundos
  down_time: number; // em segundos
  status: 'active' | 'finished';
}

export interface DeviceStatus {
  id: string;
  name: string;
  asset_id: string;
  line?: {
    line: string;
  };
  last_status: 'running' | 'stopped' | 'unknown';
  last_count: number;
  last_check: string;
  is_online: boolean;
}

export interface ProductionDataResponse {
  data: ProductionShift[];
}

export interface DevicesStatusResponse {
  data: DeviceStatus[];
}

class AutomaticProductionService {
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
  }

  /**
   * Buscar dados de produção por linha
   */
  async getProductionByLine(clientLineKey: string, date?: string): Promise<ProductionDataResponse> {
    try {
      const params = new URLSearchParams({ client_line_key: clientLineKey });
      if (date) params.append('date', date);
      
      const response = await this.api.get<ProductionDataResponse>(`/automatic-production/data?${params}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de produção por linha:', error);
      throw error;
    }
  }

  /**
   * Buscar dados de produção por dispositivo
   */
  async getProductionByDevice(deviceId: string, date?: string): Promise<ProductionDataResponse> {
    try {
      const params = new URLSearchParams({ device_id: deviceId });
      if (date) params.append('date', date);
      
      const response = await this.api.get<ProductionDataResponse>(`/automatic-production/data/device?${params}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de produção por dispositivo:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os dados de produção
   */
  async getAllProductionData(date?: string): Promise<ProductionDataResponse> {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await this.api.get<ProductionDataResponse>(`/automatic-production/data/all${params}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os dados de produção:', error);
      throw error;
    }
  }

  /**
   * Buscar status dos dispositivos
   */
  async getDevicesStatus(): Promise<DevicesStatusResponse> {
    try {
      const response = await this.api.get<DevicesStatusResponse>('/automatic-production/devices/status');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar status dos dispositivos:', error);
      throw error;
    }
  }

  /**
   * Finalizar turno
   */
  async finalizeShift(shiftNumberKey: string): Promise<any> {
    try {
      const response = await this.api.post('/automatic-production/shifts/finalize', {
        shift_number_key: shiftNumberKey
      });
      return response;
    } catch (error) {
      console.error('❌ Erro ao finalizar turno:', error);
      throw error;
    }
  }

  /**
   * Buscar dados de produção em tempo real para uma linha específica
   */
  async getLiveProductionData(clientLineKey: string): Promise<ProductionShift | null> {
    try {
      const response = await this.getProductionByLine(clientLineKey);
      
      
      if (!response || !response.data) {
        return null;
      }
      
      // Buscar o turno ativo (sem end_time)
      const activeShift = response.data.find(shift => !shift.end_time);
      
      if (activeShift) {
        return activeShift;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados de produção em tempo real:', error);
      // Retornar null em vez de fazer throw para evitar propagação de erro
      return null;
    }
  }

  /**
   * Converter dados de produção para LiveMetrics
   */
  convertToLiveMetrics(productionData: ProductionShift | null): {
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
  } {
    if (!productionData) {
      return {
        total: 0,
        good: 0,
        rejects: 0,
        oee: 0,
        availability: 0,
        performance: 0,
        quality: 100,
        productionOrderProgress: 0,
        possibleProduction: 0,
        timeInShift: 0,
        totalShiftTime: 0,
        avgSpeed: 0,
        instantSpeed: 0,
      };
    }

    const total = productionData.total_count;
    const good = productionData.good_count;
    const rejects = productionData.reject_count;
    const runTime = productionData.run_time;
    const downTime = productionData.down_time;
    const totalTime = runTime + downTime;

    // Calcular métricas OEE
    const availability = totalTime > 0 ? (runTime / totalTime) * 100 : 0;
    const quality = total > 0 ? (good / total) * 100 : 100;
    
    // Performance baseada em velocidade média (assumindo 100 peças/hora como padrão)
    const avgSpeed = runTime > 0 ? (total / (runTime / 3600)) : 0;
    const standardSpeed = 100; // peças por hora
    const performance = standardSpeed > 0 ? (avgSpeed / standardSpeed) * 100 : 0;
    
    // OEE = Availability × Performance × Quality
    const oee = (availability * performance * quality) / 10000;

    // Calcular progresso da ordem de produção (assumindo meta de 1000 peças)
    const possibleProduction = 1000; // Meta padrão
    const productionOrderProgress = Math.min(total, possibleProduction);

    // Calcular tempo no turno (assumindo turno de 8 horas)
    const totalShiftTime = 8 * 3600; // 8 horas em segundos
    const timeInShift = Math.min(runTime + downTime, totalShiftTime);

    return {
      total,
      good,
      rejects,
      oee: Math.round(oee * 10) / 10, // Arredondar para 1 casa decimal
      availability: Math.round(availability * 10) / 10,
      performance: Math.round(performance * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      productionOrderProgress,
      possibleProduction,
      timeInShift,
      totalShiftTime,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      instantSpeed: Math.round(avgSpeed * 10) / 10, // Usar velocidade média como instantânea
    };
  }

  /**
   * Buscar dados históricos de OEE
   */
  async getOeeHistory(clientLineKey: string, period: string = '1h'): Promise<{
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  }> {
    try {
      // Buscar dados dos últimos períodos
      const now = new Date();
      const periods = this.getPeriodDates(period);
      
      const dataPoints: Array<{ x: number; y: number }> = [];
      const timeLabels: string[] = [];
      
      for (let i = 0; i < periods.length; i++) {
        const date = periods[i];
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const response = await this.getProductionByLine(clientLineKey, dateStr);
          const shiftData = response.data[0]; // Usar primeiro turno do dia
          
          if (shiftData) {
            const metrics = this.convertToLiveMetrics(shiftData);
            dataPoints.push({
              x: i * (200 / (periods.length - 1)), // Distribuir pontos no gráfico
              y: metrics.oee
            });
          } else {
            dataPoints.push({
              x: i * (200 / (periods.length - 1)),
              y: 0
            });
          }
          
          timeLabels.push(date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }));
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar dados para ${dateStr}:`, error);
          dataPoints.push({
            x: i * (200 / (periods.length - 1)),
            y: 0
          });
          timeLabels.push(date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      }
      
      // Calcular tendência
      const trend = this.calculateTrend(dataPoints);
      
      return {
        points: dataPoints,
        timeLabels,
        trend: `${trend.value}%`,
        trendColor: trend.color
      };
    } catch (error) {
      console.error('❌ Erro ao buscar histórico OEE:', error);
      return {
        points: [],
        timeLabels: [],
        trend: '0.0%',
        trendColor: 'text-gray-400'
      };
    }
  }

  /**
   * Gerar datas para o período especificado
   */
  private getPeriodDates(period: string): Date[] {
    const now = new Date();
    const dates: Date[] = [];
    
    switch (period) {
      case '1h':
        // Últimas 6 horas, a cada hora
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - i);
          dates.push(date);
        }
        break;
      case '4h':
        // Últimas 4 horas, a cada 30 minutos
        for (let i = 7; i >= 0; i--) {
          const date = new Date(now);
          date.setMinutes(date.getMinutes() - (i * 30));
          dates.push(date);
        }
        break;
      case '8h':
        // Últimas 8 horas, a cada hora
        for (let i = 7; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - i);
          dates.push(date);
        }
        break;
      case '24h':
        // Últimas 24 horas, a cada 4 horas
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - (i * 4));
          dates.push(date);
        }
        break;
      case '7d':
        // Últimos 7 dias, um por dia
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          dates.push(date);
        }
        break;
      default:
        // Padrão: última hora
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - i);
          dates.push(date);
        }
    }
    
    return dates;
  }

  /**
   * Calcular tendência dos dados
   */
  private calculateTrend(points: Array<{ x: number; y: number }>): { value: number; color: string } {
    if (points.length < 2) {
      return { value: 0, color: 'text-gray-400' };
    }
    
    const firstValue = points[0].y;
    const lastValue = points[points.length - 1].y;
    const change = lastValue - firstValue;
    
    if (change > 0) {
      return { value: Math.abs(change), color: 'text-green-500' };
    } else if (change < 0) {
      return { value: Math.abs(change), color: 'text-red-500' };
    } else {
      return { value: 0, color: 'text-gray-400' };
    }
  }
}

export default new AutomaticProductionService(); 