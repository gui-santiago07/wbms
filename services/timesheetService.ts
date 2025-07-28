import ApiClient from './api';

// Tipos para a resposta da API de timesheets
export interface TimesheetEvent {
  timeline_key: number;
  company: string;
  plant: string;
  sector: string;
  client_line_key: number;
  asset_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  state: number;
  state_text: string;
  line_component: string | null;
  stop_category_1: string | null;
  stop_category_2: string | null;
  reason_text: string;
  reason_description: string | null;
  shift_id: string;
  part_id: string;
  part_number_key: number | null;
  shift_number_key: number;
  job_number_key: number | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  event_description_key: number | null;
  equipment: string | null;
}

export interface TimesheetData {
  shift_number_key: number;
  company: string;
  plant: string;
  sector: string;
  client_line_key: number;
  asset_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  shift_id: string;
  part_id: string;
  total_count: number;
  good_count: number;
  reject_count: number;
  cruising_speed: number;
  average_speed: number;
  run_time: number;
  down_time: number;
  setup_time: number;
  standby_time: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  perfect_cycle_speed: number;
  maximum_capacity: number;
  possible_production: number | null;
  cycle_speed: number;
  quality_time_loss: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  programmed_setup_time: number | null;
  speed_loss_quantity_sum: number | null;
  speed_loss_hour: number;
  var1: string | null;
  var2: string | null;
  var3: string | null;
  var4: string | null;
  var5: string | null;
  var6: string | null;
  var7: string | null;
  var8: string | null;
  var9: string | null;
  var10: string | null;
  incomplete_data: boolean | null;
  pending_calculation: boolean | null;
  events: TimesheetEvent[];
}

export interface TimesheetResponse {
  current_page: number;
  data: {
    [key: string]: TimesheetData;
  };
}

// Tipos para a timeline de produção
export interface TimelineEvent {
  id: string;
  time: string;
  status: string;
  duration: number;
  reason: string;
  color: string;
  count?: number;
}

class TimesheetService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Busca dados de timesheet para popular a timeline de produção
   * @param page Página dos dados (padrão: 4)
   * @param perPage Itens por página (padrão: 15)
   * @param unfinished Se deve incluir dados não finalizados (padrão: false)
   */
  async fetchTimesheetData(
    page: number = 4,
    perPage: number = 15,
    unfinished: boolean = false
  ): Promise<TimesheetResponse> {
    try {
      const params = new URLSearchParams({
        unfinished: unfinished.toString(),
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await this.apiClient.get<TimesheetResponse>(`/api/timesheets?${params}`);
      
      console.log('📊 Timesheet data fetched:', {
        currentPage: response.current_page,
        dataKeys: Object.keys(response.data),
        totalEvents: Object.values(response.data).reduce((sum, item) => sum + item.events.length, 0)
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de timesheet:', error);
      throw error;
    }
  }

  /**
   * Converte eventos de timesheet para formato da timeline
   */
  convertToTimelineEvents(timesheetData: TimesheetData): TimelineEvent[] {
    if (!timesheetData.events || timesheetData.events.length === 0) {
      return [];
    }

    return timesheetData.events.map((event, index) => {
      const startTime = new Date(event.start_time);
      const timeString = startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Mapear estado para status e cor
      const { status, color } = this.mapStateToStatus(event.state, event.state_text, event.reason_text);

      return {
        id: `event-${event.timeline_key}`,
        time: timeString,
        status,
        duration: event.duration,
        reason: event.reason_text || 'Sem motivo',
        color,
        count: event.state === 4 ? Math.floor(event.duration / 60) : undefined // Apenas para produção (state 4 = run_enum)
      };
    });
  }

  /**
   * Mapeia o estado do evento para status e cor da timeline
   */
  private mapStateToStatus(state: number, stateText: string, reasonText: string): { status: string; color: string } {
    switch (state) {
      case 1: // down_enum
        return { status: 'DOWN', color: '#ef4444' }; // red-500
      case 2: // setup_enum
        return { status: 'SETUP', color: '#f59e0b' }; // amber-500
      case 3: // standby_enum
        if (reasonText?.includes('Refeicao') || reasonText?.includes('Refeição')) {
          return { status: 'BREAK', color: '#8b5cf6' }; // violet-500
        }
        return { status: 'STANDBY', color: '#6b7280' }; // gray-500
      case 4: // run_enum
        return { status: 'PROD', color: '#22c55e' }; // green-500
      default:
        return { status: 'UNKNOWN', color: '#9ca3af' }; // gray-400
    }
  }

  /**
   * Busca dados de timeline formatados para o componente
   */
  async fetchTimelineData(): Promise<TimelineEvent[]> {
    try {
      const response = await this.fetchTimesheetData();
      
      // Pegar o primeiro item de dados disponível
      const firstDataKey = Object.keys(response.data)[0];
      if (!firstDataKey) {
        console.warn('⚠️ Nenhum dado de timesheet encontrado');
        return [];
      }

      const timesheetData = response.data[firstDataKey];
      const timelineEvents = this.convertToTimelineEvents(timesheetData);

      console.log('📈 Timeline events converted:', {
        totalEvents: timelineEvents.length,
        events: timelineEvents.slice(0, 3) // Log dos primeiros 3 eventos
      });

      return timelineEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de timeline:', error);
      return [];
    }
  }

  /**
   * Calcula métricas da timeline
   */
  calculateTimelineMetrics(events: TimelineEvent[]) {
    const productionEvents = events.filter(event => event.status === 'PROD');
    const downEvents = events.filter(event => event.status === 'DOWN');
    const setupEvents = events.filter(event => event.status === 'SETUP');

    const totalProductionTime = productionEvents.reduce((sum, event) => sum + event.duration, 0);
    const totalDownTime = downEvents.reduce((sum, event) => sum + event.duration, 0);
    const totalSetupTime = setupEvents.reduce((sum, event) => sum + event.duration, 0);

    return {
      totalProductionTime,
      totalDownTime,
      totalSetupTime,
      productionEvents: productionEvents.length,
      downEvents: downEvents.length,
      setupEvents: setupEvents.length
    };
  }
}

export default TimesheetService; 