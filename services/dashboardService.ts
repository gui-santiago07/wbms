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
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheets com erro
    console.log('⚠️ Rota /timesheets temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockDetails: ShiftDetailsResponse = {
      shift: {
        id: '1',
        name: 'TURNO 1',
        startTime: '08:00',
        endTime: '16:00'
      },
      operator: {
        id: '1',
        name: 'João Silva',
        role: 'Operador'
      },
      product: {
        id: 'PROD001',
        name: 'Produto A',
        sku: 'SKU001'
      },
      productionOrder: {
        id: 'OP001',
        totalQuantity: 1000,
        shiftTarget: 800,
        name: 'Ordem de Produção 001',
        dueDate: '2024-01-15'
      },
      line: {
        id: '1',
        name: 'Linha 1',
        code: 'L1'
      }
    };
    
    console.log('✅ Detalhes do turno mock carregados:', mockDetails);
    return mockDetails;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ShiftDetailsResponse>(`/timesheets/${targetShiftId}`);
      console.log('✅ Detalhes do turno carregados:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao carregar detalhes do turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    */
  }

  // Buscar status em tempo real
  async getShiftStatus(currentShift: Shift | null, historyRange: string = '4h'): Promise<ShiftStatusResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Buscando status do turno:', { currentShift: currentShift?.name, targetShiftId, historyRange });
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheets com erro
    console.log('⚠️ Rota /timesheets temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockStatus: ShiftStatusResponse = {
      machineStatus: 'RUNNING',
      production: {
        actual: 750,
        target: 800,
        good: 750,
        rejects: 0
      },
      oee: {
        main: 85.5,
        overall: 85.5,
        availability: 92.0,
        performance: 93.0,
        quality: 100.0
      },
      timeMetrics: {
        timeInShift: 6.5,
        totalShiftTime: 8.0,
        avgSpeed: 115.4,
        instantSpeed: 120.0
      },
      historicalPerformance: {
        dataPoints: [
          { timestamp: '08:00', oee: 82.0, production: 100 },
          { timestamp: '10:00', oee: 85.0, production: 250 },
          { timestamp: '12:00', oee: 88.0, production: 400 },
          { timestamp: '14:00', oee: 87.0, production: 550 },
          { timestamp: '16:00', oee: 85.5, production: 750 }
        ]
      },
      productionOrderProgress: 750,
      possibleProduction: 800,
      timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
      trendColor: 'text-green-500'
    };
    
    console.log('✅ Status do turno mock carregado:', mockStatus);
    return mockStatus;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar jobs do timesheet
      const result = await this.get<ShiftStatusResponse>(`/timesheets/${targetShiftId}/jobs`);
      console.log('✅ Status do turno carregado:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar status do turno ${targetShiftId}:`, error);
      throw new Error(`Falha ao carregar status em tempo real: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    */
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
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheet_events com erro
    console.log('⚠️ Rota /timesheet_events temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockHistory = {
      points: [
        { x: 20, y: 82 },
        { x: 40, y: 85 },
        { x: 60, y: 88 },
        { x: 80, y: 87 },
        { x: 100, y: 85.5 }
      ],
      timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
      trend: '+3.5%',
      trendColor: 'text-green-500'
    };
    
    console.log('✅ Service: Histórico OEE mock carregado:', mockHistory);
    return mockHistory;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
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
    */
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
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheets com erro
    console.log('⚠️ Rota /timesheets temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockTimeDistribution: TimeDistributionResponse['timeDistribution'] = {
      produced: 65.5,    // 65.5% do tempo produzindo
      stopped: 18.2,     // 18.2% do tempo parado
      standby: 12.1,     // 12.1% do tempo em standby
      setup: 4.2,        // 4.2% do tempo em setup
      totalTime: 28800   // 8 horas em segundos
    };
    
    console.log('✅ Service: Distribuição de tempo mock carregada:', mockTimeDistribution);
    return mockTimeDistribution;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
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
    */
  }

  // Novo método para obter principais motivos de parada
  async getTopStopReasons(currentShift: Shift | null): Promise<TopStopReasonsResponse['topStopReasons']> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando principais motivos de parada para turno:', targetShiftId);
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheet_events com erro
    console.log('⚠️ Rota /timesheet_events temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockTopStopReasons: TopStopReasonsResponse['topStopReasons'] = [
      {
        id: '1',
        code: 'P001',
        description: 'Troca de Produto',
        category: 'Setup',
        totalTime: 1800, // 30 minutos
        occurrences: 3
      },
      {
        id: '2',
        code: 'P002',
        description: 'Manutenção Preventiva',
        category: 'Manutenção',
        totalTime: 1200, // 20 minutos
        occurrences: 1
      },
      {
        id: '3',
        code: 'P003',
        description: 'Falta de Material',
        category: 'Logística',
        totalTime: 900, // 15 minutos
        occurrences: 2
      },
      {
        id: '4',
        code: 'P004',
        description: 'Ajuste de Máquina',
        category: 'Técnico',
        totalTime: 600, // 10 minutos
        occurrences: 4
      },
      {
        id: '5',
        code: 'P005',
        description: 'Pausa para Almoço',
        category: 'Operacional',
        totalTime: 3600, // 1 hora
        occurrences: 1
      }
    ];
    
    console.log('✅ Service: Principais motivos de parada mock carregados:', mockTopStopReasons);
    return mockTopStopReasons;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar eventos do timesheet
      const result = await this.get<TopStopReasonsResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Principais motivos de parada carregados:', result.topStopReasons);
      return result.topStopReasons;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar principais motivos de parada:', error);
      return [];
    }
    */
  }

  // Novo método para obter histórico de paradas
  async getDowntimeHistory(currentShift: Shift | null): Promise<DowntimeHistoryResponse['downtimeHistory']> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando histórico de paradas para turno:', targetShiftId);
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheet_events com erro
    console.log('⚠️ Rota /timesheet_events temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockDowntimeHistory: DowntimeHistoryResponse['downtimeHistory'] = [
      {
        id: '1',
        reason: 'Troca de Produto',
        category: 'Setup',
        startTime: '2024-01-15T08:30:00Z',
        endTime: '2024-01-15T09:00:00Z',
        duration: 1800
      },
      {
        id: '2',
        reason: 'Manutenção Preventiva',
        category: 'Manutenção',
        startTime: '2024-01-15T10:15:00Z',
        endTime: '2024-01-15T10:35:00Z',
        duration: 1200
      },
      {
        id: '3',
        reason: 'Falta de Material',
        category: 'Logística',
        startTime: '2024-01-15T11:45:00Z',
        endTime: '2024-01-15T12:00:00Z',
        duration: 900
      }
    ];
    
    console.log('✅ Service: Histórico de paradas mock carregado:', mockDowntimeHistory);
    return mockDowntimeHistory;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar eventos do timesheet
      const result = await this.get<DowntimeHistoryResponse>(`/timesheet_events/${targetShiftId}`);
      console.log('✅ Service: Histórico de paradas carregado:', result.downtimeHistory);
      return result.downtimeHistory;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar histórico de paradas:', error);
      return [];
    }
    */
  }

  // Método principal para obter dados compostos do dashboard (BFF - Backend for Frontend)
  async getDashboardComposite(currentShift: Shift | null): Promise<DashboardCompositeResponse> {
    const targetShiftId = this.getShiftId(currentShift);
    console.log('📊 Service: Buscando dados compostos do dashboard para turno:', targetShiftId);
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheets com erro
    console.log('⚠️ Rota /timesheets temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockCompositeData: DashboardCompositeResponse = {
      liveMetrics: {
        total: 750,
        good: 720,
        rejects: 30,
        oee: 85.5,
        availability: 81.8,
        performance: 93.0,
        quality: 96.0,
        productionOrderProgress: 750,
        possibleProduction: 800,
        timeInShift: 23400, // 6.5 horas em segundos
        totalShiftTime: 28800, // 8 horas em segundos
        avgSpeed: 115.4,
        instantSpeed: 120.0
      },
      currentJob: {
        orderId: 'OP001',
        orderQuantity: 1000,
        productId: 'PROD001',
        productName: 'Produto A'
      },
      currentProductionLine: {
        id: '1',
        name: 'Linha 1',
        code: 'L1',
        description: 'Linha de Produção Principal',
        isActive: true
      },
      currentShift: {
        id: '1',
        name: 'TURNO 1',
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T16:00:00Z',
        isActive: true
      },
      oeeHistory: {
        points: [
          { x: 20, y: 82 },
          { x: 40, y: 85 },
          { x: 60, y: 88 },
          { x: 80, y: 87 },
          { x: 100, y: 85.5 }
        ],
        timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
        trend: '+3.5%',
        trendColor: 'text-green-500'
      },
      productionTimeline: [
        { time: '08:00', status: 'PROD', count: 100, color: '#22c55e' },
        { time: '09:00', status: 'STOP', count: 0, color: '#ef4444' },
        { time: '10:00', status: 'PROD', count: 150, color: '#22c55e' },
        { time: '11:00', status: 'PROD', count: 200, color: '#22c55e' },
        { time: '12:00', status: 'STOP', count: 0, color: '#ef4444' },
        { time: '13:00', status: 'PROD', count: 180, color: '#22c55e' },
        { time: '14:00', status: 'PROD', count: 120, color: '#22c55e' }
      ],
      timeDistribution: {
        produced: 65.5,
        stopped: 18.2,
        standby: 12.1,
        setup: 4.2,
        totalTime: 28800
      },
      topStopReasons: [
        {
          id: '1',
          code: 'P001',
          description: 'Troca de Produto',
          category: 'Setup',
          totalTime: 1800,
          occurrences: 3
        },
        {
          id: '2',
          code: 'P002',
          description: 'Manutenção Preventiva',
          category: 'Manutenção',
          totalTime: 1200,
          occurrences: 1
        },
        {
          id: '3',
          code: 'P003',
          description: 'Falta de Material',
          category: 'Logística',
          totalTime: 900,
          occurrences: 2
        }
      ],
      productionStatus: {
        status: 'PRODUZINDO',
        icon: '▶️',
        color: '#22c55e',
        producingTime: '06:30:00',
        producingPercentage: 81.8,
        stoppedTime: '01:30:00'
      }
    };
    
    console.log('✅ Service: Dados compostos do dashboard mock carregados:', mockCompositeData);
    return mockCompositeData;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7 - buscar dados do timesheet
      const result = await this.get<DashboardCompositeResponse>(`/timesheets/${targetShiftId}`);
      console.log('✅ Service: Dados compostos do dashboard carregados:', result);
      return result;
    } catch (error) {
      console.error('❌ Service: Erro ao buscar dados compostos do dashboard:', error);
      throw error;
    }
    */
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