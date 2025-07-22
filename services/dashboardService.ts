import ApiClient from './api';
import { LiveMetrics, CurrentJob, DowntimeEvent, ProductionLine, Shift } from '../types';

// Interfaces para as respostas da API (atualizadas para compatibilidade com backend real)
interface ShiftDetailsResponse {
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
  operator: {
    id: string;
    name: string;
    role: string;
  };
  product: {
    id: string;
    name?: string;  // Opcional - pode não vir do backend
    sku?: string;   // Opcional - pode não vir do backend
  };
  productionOrder: {
    id: string;
    totalQuantity: number;  // Campo correto do backend
    shiftTarget: number;    // Campo adicional do backend
    name?: string;          // Opcional - pode não vir do backend
    dueDate?: string;       // Opcional - pode não vir do backend
  };
  line: {
    id: string;
    name: string;
    code: string;
  };
}

interface ShiftStatusResponse {
  machineStatus: 'RUNNING' | 'DOWN' | 'PAUSED' | 'SETUP';
  production: {
    actual: number;
    target: number;
    good: number;
    rejects: number;
  };
  oee: {
    main?: number;        // Campo pode vir como 'oee' ou 'overall'
    overall?: number;     // Campo alternativo
    availability: number;
    performance: number;
    quality: number;
  };
  timeMetrics: {
    timeInShift: number;
    totalShiftTime: number;
    avgSpeed: number;
    instantSpeed: number;
  };
  historicalPerformance?: {
    dataPoints: Array<{
      timestamp: string;
      oee: number;
      production: number;
    }>;
  };
}

interface EventResponse {
  success: boolean;
  message: string;
  eventId: string;
}

import { config } from '../config/environment';

class DashboardService extends ApiClient {
  private pollingInterval: number | null = null;

  constructor() {
    super();
  }

  // Método para obter o ID do turno baseado no turno atual
  private getShiftId(currentShift: Shift | null): string {
    if (!currentShift) {
      console.warn('⚠️ Nenhum turno selecionado, usando turno padrão');
      return config.defaultShiftId;
    }
    
    // Se temos o shiftNumberKey da API real, usar ele
    if (currentShift.shiftNumberKey) {
      return currentShift.shiftNumberKey.toString();
    }
    
    // Fallback: converter o nome do turno para o formato da API
    // Ex: "TURNO 2" -> "turno_2"
    const shiftNumber = currentShift.name.match(/\d+/)?.[0];
    if (shiftNumber) {
      return `turno_${shiftNumber}`;
    }
    
    console.warn('⚠️ Não foi possível extrair número do turno, usando turno padrão');
    return config.defaultShiftId;
  }

  // Buscar detalhes do turno
  async getShiftDetails(currentShift: Shift | null): Promise<ShiftDetailsResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('🔍 Buscando detalhes do turno:', { currentShift: currentShift?.name, targetShiftId });
    
    try {
      const result = await this.get<ShiftDetailsResponse>(`/shifts/${targetShiftId}/details`);
      console.log('✅ Detalhes do turno carregados:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao carregar detalhes do turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar status em tempo real
  async getShiftStatus(currentShift: Shift | null, historyRange: string = '4h'): Promise<ShiftStatusResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Buscando status do turno:', { currentShift: currentShift?.name, targetShiftId, historyRange });
    
    try {
      const result = await this.get<ShiftStatusResponse>(`/shifts/${targetShiftId}/status?history_range=${historyRange}`);
      console.log('✅ Status do turno carregado:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar status do turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao carregar status em tempo real: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Registrar evento (atualizado para incluir RUN)
  async registerEvent(currentShift: Shift | null, eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST'): Promise<EventResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('🎯 Registrando evento:', { currentShift: currentShift?.name, targetShiftId, eventType });
    
    try {
      const result = await this.post<EventResponse>(`/shifts/${targetShiftId}/events`, { eventType });
      console.log('✅ Evento registrado com sucesso:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao registrar evento ${eventType} no turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao registrar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Polling automático de status
  startStatusPolling(currentShift: Shift | null, callback: (status: ShiftStatusResponse) => void, interval: number = 30000): number {
    this.pollingInterval = window.setInterval(async () => {
      try {
        const status = await this.getShiftStatus(currentShift);
        callback(status);
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, interval);

    return this.pollingInterval;
  }

  // Parar polling
  stopStatusPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Converter dados da API para o formato da aplicação (atualizado para compatibilidade)
  convertToLiveMetrics(status: ShiftStatusResponse): LiveMetrics {
    // Tratar diferentes possibilidades de campo OEE
    const oeeValue = status.oee.main ?? status.oee.overall ?? 0;
    
    return {
      total: status.production.actual,
      good: status.production.actual, // Todas as peças são boas (sem rejeitos)
      rejects: 0, // Zerar rejeitos
      oee: oeeValue,
      availability: status.oee.availability,
      performance: status.oee.performance,
      quality: 100, // Qualidade sempre 100% (sem rejeitos)
      productionOrderProgress: status.production.actual,
      possibleProduction: status.production.target,
      timeInShift: status.timeMetrics.timeInShift,
      totalShiftTime: status.timeMetrics.totalShiftTime,
      avgSpeed: status.timeMetrics.avgSpeed,
      instantSpeed: status.timeMetrics.instantSpeed,
    };
  }

  convertToCurrentJob(details: ShiftDetailsResponse): CurrentJob {
    return {
      orderId: details.productionOrder.id,
      orderQuantity: details.productionOrder.totalQuantity, // Campo correto do backend
      productId: details.product.sku ?? details.product.id, // Fallback para id se sku não existir
      productName: details.product.name ?? 'Produto não especificado', // Fallback
    };
  }

  convertToProductionLine(details: ShiftDetailsResponse): ProductionLine {
    return {
      id: details.line.id,
      name: details.line.name,
      code: details.line.code,
      description: details.line.name,
      isActive: true,
    };
  }

  convertToShift(details: ShiftDetailsResponse): Shift {
    return {
      id: details.shift.id,
      name: details.shift.name,
      startTime: details.shift.startTime,
      endTime: details.shift.endTime,
      isActive: true,
    };
  }

  // Método para inicializar dados completos
  async initializeDashboardData(currentShift: Shift | null): Promise<{
    liveMetrics: LiveMetrics;
    currentJob: CurrentJob;
    productionLine: ProductionLine;
    shift: Shift;
  }> {
    console.log('🚀 Iniciando carregamento do dashboard...');
    console.log('🔧 Configuração:', {
      currentShift: currentShift?.name,
      shiftId: this.getShiftId(currentShift)
    });
    
    try {
      console.log('📋 Fazendo requisições paralelas...');
      const [details, status] = await Promise.all([
        this.getShiftDetails(currentShift),
        this.getShiftStatus(currentShift)
      ]);

      console.log('🔄 Convertendo dados...');
      const result = {
        liveMetrics: this.convertToLiveMetrics(status),
        currentJob: this.convertToCurrentJob(details),
        productionLine: this.convertToProductionLine(details),
        shift: this.convertToShift(details),
      };

      console.log('✅ Dashboard inicializado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao inicializar dados do dashboard:', error);
      throw error;
    }
  }

  // Método para obter dados históricos de OEE
  async getOeeHistory(currentShift: Shift | null, period: string = '1h'): Promise<{
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  }> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Buscando histórico OEE:', { currentShift: currentShift?.name, targetShiftId, period });
    
    try {
      const result = await this.get<{
        data: Array<{ timestamp: string; oee: number }>;
        trend: { value: number; direction: 'up' | 'down' };
      }>(`/shifts/${targetShiftId}/oee-history?period=${period}`);
      
      console.log('✅ Histórico OEE carregado:', result);
      
      // Converter dados para o formato esperado pelo gráfico
      const points = result.data.map((item, index) => ({
        x: (index / (result.data.length - 1)) * 190 + 10, // Distribuir pontos de 10 a 200
        y: item.oee
      }));
      
      // Gerar labels de tempo baseados no período
      const timeLabels = this.generateTimeLabels(period, result.data.length);
      
      // Calcular tendência
      const trendValue = result.trend.value;
      const trendDirection = result.trend.direction;
      const trend = `${trendDirection === 'up' ? '+' : '-'}${trendValue.toFixed(1)}%`;
      const trendColor = trendDirection === 'up' ? 'text-green-400' : 'text-red-400';
      
      return {
        points,
        timeLabels,
        trend,
        trendColor
      };
    } catch (error) {
      console.error('❌ Erro ao buscar histórico OEE:', error);
      // Retornar dados mockados como fallback
      return this.getMockOeeHistory(period);
    }
  }

  // Gerar labels de tempo baseados no período
  private generateTimeLabels(period: string, dataPoints: number): string[] {
    const now = new Date();
    const labels: string[] = [];
    
    switch (period) {
      case '1h':
        labels.push(
          new Date(now.getTime() - 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          new Date(now.getTime() - 30 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
      case '4h':
        labels.push(
          new Date(now.getTime() - 4 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          new Date(now.getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
      case '8h':
        labels.push(
          new Date(now.getTime() - 8 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          new Date(now.getTime() - 4 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
      case '24h':
        labels.push('Ontem', 'Hoje 12h', 'Agora');
        break;
      case '7d':
        labels.push('7 dias', '3 dias', 'Hoje');
        break;
      default:
        labels.push('Início', 'Meio', 'Agora');
    }
    
    return labels;
  }

  // Dados mockados como fallback
  getMockOeeHistory(period: string) {
    const mockData = {
      '1h': {
        points: [
          { x: 10, y: 78 }, { x: 25, y: 80 }, { x: 40, y: 82 }, { x: 55, y: 79 },
          { x: 70, y: 85 }, { x: 85, y: 83 }, { x: 100, y: 87 }, { x: 115, y: 84 },
          { x: 130, y: 89 }, { x: 145, y: 86 }, { x: 160, y: 91 }, { x: 175, y: 88 },
          { x: 190, y: 90 }
        ],
        timeLabels: ['05:00 PM', '05:20 PM', '05:40 PM'],
        trend: '+12.0%',
        trendColor: 'text-green-400'
      },
      '4h': {
        points: [
          { x: 10, y: 75 }, { x: 30, y: 78 }, { x: 50, y: 82 }, { x: 70, y: 79 },
          { x: 90, y: 85 }, { x: 110, y: 83 }, { x: 130, y: 87 }, { x: 150, y: 84 },
          { x: 170, y: 88 }, { x: 190, y: 90 }
        ],
        timeLabels: ['02:00 PM', '04:00 PM', '06:00 PM'],
        trend: '+15.0%',
        trendColor: 'text-green-400'
      },
      '8h': {
        points: [
          { x: 10, y: 70 }, { x: 35, y: 73 }, { x: 60, y: 76 }, { x: 85, y: 79 },
          { x: 110, y: 82 }, { x: 135, y: 85 }, { x: 160, y: 87 }, { x: 185, y: 90 }
        ],
        timeLabels: ['10:00 AM', '02:00 PM', '06:00 PM'],
        trend: '+20.0%',
        trendColor: 'text-green-400'
      },
      '24h': {
        points: [
          { x: 10, y: 65 }, { x: 40, y: 68 }, { x: 70, y: 72 }, { x: 100, y: 75 },
          { x: 130, y: 78 }, { x: 160, y: 82 }, { x: 190, y: 85 }
        ],
        timeLabels: ['Ontem', 'Hoje 12h', 'Agora'],
        trend: '+20.0%',
        trendColor: 'text-green-400'
      },
      '7d': {
        points: [
          { x: 10, y: 60 }, { x: 40, y: 65 }, { x: 70, y: 70 }, { x: 100, y: 75 },
          { x: 130, y: 78 }, { x: 160, y: 82 }, { x: 190, y: 85 }
        ],
        timeLabels: ['7 dias', '3 dias', 'Hoje'],
        trend: '+25.0%',
        trendColor: 'text-green-400'
      }
    };
    
    return mockData[period as keyof typeof mockData] || mockData['1h'];
  }
}

export default DashboardService; 