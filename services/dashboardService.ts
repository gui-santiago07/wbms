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
  // Novos campos conforme contrato
  productionOrderProgress?: number;
  possibleProduction?: number;
  timeLabels?: string[];
  trendColor?: string;
}

interface EventResponse {
  success: boolean;
  message: string;
  eventId: string;
}

import { config } from '../config/environment';

// Novas interfaces para o contrato de dados
interface ProductionTimelineResponse {
  productionTimeline: Array<{
    time: string; // HH:mm
    status: string; // PROD, REJ, STOP
    count: number;
    color: string; // green, #FF5733, etc.
  }>;
}

interface TimeDistributionResponse {
  timeDistribution: {
    produced: number;
    stopped: number;
    standby: number;
    setup: number;
    totalTime: number; // segundos
  };
}

interface TopStopReasonsResponse {
  topStopReasons: Array<{
    id: string | number;
    code: string;
    description: string;
    category: string;
    totalTime: number; // segundos
    occurrences: number;
  }>;
}

interface DowntimeHistoryResponse {
  downtimeHistory: Array<{
    id: string | number;
    reason: string;
    category: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    duration: number; // segundos
  }>;
}

interface OeeHistoryResponse {
  oeeHistory: {
    points: Array<{ x: any; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  };
}

// Interface para o endpoint composto do dashboard
interface DashboardCompositeResponse {
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
    timeInShift: number;
    totalShiftTime: number;
    avgSpeed: number;
    instantSpeed: number;
  };
  currentJob: {
    orderId: string;
    orderQuantity: number;
    productId: string;
    productName: string;
  };
  currentProductionLine: {
    id: string | number;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
  };
  currentShift: {
    id: string | number;
    name: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    isActive: boolean;
  };
  oeeHistory: OeeHistoryResponse['oeeHistory'];
  productionTimeline: ProductionTimelineResponse['productionTimeline'];
  timeDistribution: TimeDistributionResponse['timeDistribution'];
  topStopReasons: TopStopReasonsResponse['topStopReasons'];
  productionStatus: {
    status: 'PRODUZINDO' | 'PARADO' | 'SETUP' | 'STANDBY';
    icon: string;
    color: string;
    producingTime: string; // hh:mm:ss
    producingPercentage: number;
    stoppedTime: string; // hh:mm:ss
  };
}

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
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ShiftDetailsResponse>(`/timesheets/${targetShiftId}`);
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
      // ✅ Usar endpoint correto da API Option7 - buscar jobs do timesheet
      const result = await this.get<ShiftStatusResponse>(`/timesheets/${targetShiftId}/jobs`);
      console.log('✅ Status do turno carregado:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar status do turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao carregar status em tempo real: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Registrar evento (atualizado para incluir RUN)
  async registerEvent(currentShift: Shift | null, eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST', description?: string): Promise<EventResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('🎯 Registrando evento:', { currentShift: currentShift?.name, targetShiftId, eventType, description });
    
    try {
      // ✅ Usar API Mobile recomendada: POST /api/shifts/{shiftId}/events
      const eventData: any = {
        eventType: eventType
      };
      
      // Adicionar descrição se fornecida
      if (description) {
        eventData.description = description;
      }
      
      const result = await this.post<EventResponse>(`/shifts/${targetShiftId}/events`, eventData);
      console.log('✅ Evento registrado com sucesso via API Mobile:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao registrar evento ${eventType} no turno ${targetShiftId}:`, error);
      
      // Fallback para API geral se a Mobile falhar
      try {
        console.log('🔄 Tentando fallback para API geral...');
        const fallbackResult = await this.post<EventResponse>(`/timesheet_events`, { 
          shift_number_key: targetShiftId,
          tipo: eventType,
          descricao_text: description || `${eventType} registrado`,
          timeline_start_time: new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
          timeline_end_time: new Date().toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:mm:ss
        });
        console.log('✅ Evento registrado com sucesso via API geral (fallback):', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error(`❌ Erro no fallback também:`, fallbackError);
        throw new Error(`Falha ao registrar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  }

  // Método específico para registrar paradas com motivo detalhado
  async registerStopEvent(currentShift: Shift | null, reason: string, reasonId?: string): Promise<EventResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    const eventDescription = reasonId ? `${reason} (ID: ${reasonId})` : reason;
    
    console.log('🛑 Registrando parada com motivo:', { 
      currentShift: currentShift?.name, 
      targetShiftId, 
      reason, 
      reasonId,
      eventDescription 
    });
    
    try {
      // ✅ Usar API Mobile recomendada: POST /api/shifts/{shiftId}/events
      const eventData = {
        eventType: 'DOWN',
        description: eventDescription
      };
      
      const result = await this.post<EventResponse>(`/shifts/${targetShiftId}/events`, eventData);
      console.log('✅ Parada registrada com sucesso via API Mobile:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao registrar parada no turno ${targetShiftId}:`, error);
      
      // Fallback para API geral se a Mobile falhar
      try {
        console.log('🔄 Tentando fallback para API geral...');
        const fallbackResult = await this.post<EventResponse>(`/timesheet_events`, { 
          shift_number_key: targetShiftId,
          tipo: 'STOP',
          descricao_text: eventDescription,
          timeline_start_time: new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
          timeline_end_time: new Date().toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:mm:ss
        });
        console.log('✅ Parada registrada com sucesso via API geral (fallback):', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error(`❌ Erro no fallback também:`, fallbackError);
        throw new Error(`Falha ao registrar parada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
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
      good: status.production.good,
      rejects: status.production.rejects,
      oee: oeeValue,
      availability: status.oee.availability,
      performance: status.oee.performance,
      quality: status.oee.quality,
      productionOrderProgress: status.productionOrderProgress || status.production.actual,
      possibleProduction: status.possibleProduction || status.production.target,
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
      client_line_key: details.line.id,
      line: details.line.name,
      description: details.line.name,
      is_active: true,
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
    console.log('📊 Service: Buscando histórico OEE para turno:', targetShiftId, 'período:', period);
    
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar eventos do timesheet
      const result = await this.get<OeeHistoryResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Histórico OEE carregado:', result.oeeHistory);
      return result.oeeHistory;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar histórico OEE:', error);
      // Retornar dados vazios em caso de erro
      return {
        points: [],
        timeLabels: [],
        trend: '0.0%',
        trendColor: 'text-gray-400'
      };
    }
  }

  // Novo método para obter timeline de produção
  async getProductionTimeline(currentShift: Shift | null): Promise<ProductionTimelineResponse['productionTimeline']> {
    try {
      const targetShiftId = this.getShiftId(currentShift);
      console.log('📊 Service: Buscando timeline de produção para turno:', targetShiftId);
      
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ProductionTimelineResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Timeline de produção carregada:', result.productionTimeline);
      return result.productionTimeline;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar timeline de produção:', error);
      return [];
    }
  }

  // Novo método para obter distribuição de tempo
  async getTimeDistribution(currentShift: Shift | null): Promise<TimeDistributionResponse['timeDistribution']> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando distribuição de tempo para turno:', targetShiftId);
    
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar detalhes do timesheet
      const result = await this.get<TimeDistributionResponse>(`/timesheets/${targetShiftId}`);
      console.log('✅ Service: Distribuição de tempo carregada:', result.timeDistribution);
      return result.timeDistribution;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar distribuição de tempo:', error);
      return {
        produced: 0,
        stopped: 0,
        standby: 0,
        setup: 0,
        totalTime: 0
      };
    }
  }

  // Novo método para obter principais motivos de parada
  async getTopStopReasons(currentShift: Shift | null): Promise<TopStopReasonsResponse['topStopReasons']> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando principais motivos de parada para turno:', targetShiftId);
    
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar eventos do timesheet
      const result = await this.get<TopStopReasonsResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Principais motivos de parada carregados:', result.topStopReasons);
      return result.topStopReasons;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar principais motivos de parada:', error);
      return [];
    }
  }

  // Novo método para obter histórico de paradas
  async getDowntimeHistory(currentShift: Shift | null): Promise<DowntimeHistoryResponse['downtimeHistory']> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando histórico de paradas para turno:', targetShiftId);
    
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar eventos do timesheet
      const result = await this.get<DowntimeHistoryResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Histórico de paradas carregado:', result.downtimeHistory);
      return result.downtimeHistory;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar histórico de paradas:', error);
      return [];
    }
  }

  // Método principal para obter dados compostos do dashboard (BFF - Backend for Frontend)
  async getDashboardComposite(currentShift: Shift | null): Promise<DashboardCompositeResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando dados compostos do dashboard para turno:', targetShiftId);
    
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar dados do timesheet
      const result = await this.get<DashboardCompositeResponse>(`/timesheets/${targetShiftId}`);
      console.log('✅ Service: Dados compostos do dashboard carregados:', result);
      return result;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar dados compostos do dashboard:', error);
      throw error;
    }
  }

  // Método para obter lista de dispositivos
  async getDevices(): Promise<Array<{
    id: string | number;
    name: string;
    code: string;
    productionLineId: string | number;
    isActive: boolean;
  }>> {
    try {
      console.log('📊 Service: Buscando lista de dispositivos');
      
      // ✅ Usar endpoint correto da API Option7 - buscar linhas de produção
      const result = await this.get<Array<{
        id: string | number;
        name: string;
        code: string;
        productionLineId: string | number;
        isActive: boolean;
      }>>('/lines?useIds=true');
      console.log('✅ Service: Lista de dispositivos carregada:', result);
      return result;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar lista de dispositivos:', error);
      return [];
    }
  }
}

export default DashboardService; 