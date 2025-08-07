import Option7ApiService from './option7ApiService';

// Tipos para os dados da timeline (nova estrutura da API)
export interface TimelineData {
  success: boolean;
  timestamp: any[];
  period: {
    start: string;
    end: string;
  };
  data: {
    [lineName: string]: LineTimelineData;
  };
}

export interface LineTimelineData {
  events: TimelineEvent[];
  products: TimelineProduct[];
  shifts: TimelineShift[];
  status: StatusStatistics;
}

export interface TimelineEvent {
  start_time: string;
  end_time: string;
  state_text: string;
  events_name: string;
}

export interface TimelineProduct {
  start_time: string;
  end_time: string;
  product_id: string;
  ideal_production: number;
  run_time: string;
  total_time: string;
  good_count: number;
  reject_count: number;
  total_count: number;
  perfect_cycle_speed: number;
  cycle_speed: number;
  occurrences: number;
  all_total_time: string;
  down_time: string;
  setup_time: string;
  standby_time: string;
}

export interface TimelineShift {
  start_time: string;
  end_time: string;
  shift_id: string;
  ideal_production: number;
  run_time: string;
  total_time: string;
  good_count: number;
  reject_count: number;
  total_count: number;
  perfect_cycle_speed: number;
  cycle_speed: number;
  occurrences: number;
  all_total_time: string;
  down_time: string;
  setup_time: string;
  standby_time: string;
}

export interface StatusStatistics {
  [key: string]: {
    duration: number;
    occurrences: number;
    min: number;
    max: number;
    reasons?: {
      [reason: string]: {
        duration: number;
        occurrences: number;
        min: number;
        max: number;
      };
    };
  };
}

// Tipos para filtros (nova estrutura)
export interface TimelineFilters {
  start_period: string;
  end_period: string;
  filtros: {
    linhas: string[];
  };
}

// Tipos para opções de filtro
export interface FilterOption {
  id: string;
  name: string;
}

// Tipos para compartilhamento
export interface ShareTimelineData {
  email: string;
  chartImage: string;
  filters: TimelineFilters;
}

// Tipos para dados de OEE calculados
export interface OeeData {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

class TimelineService {
  private apiService: Option7ApiService;

  constructor() {
    this.apiService = new Option7ApiService();
  }

  /**
   * Buscar dados da timeline de produção
   * POST /wbms/auto-apontamento/timeline
   */
  async getTimelineData(filters: TimelineFilters): Promise<TimelineData> {
    try {
      console.log('🔄 TimelineService: Buscando dados reais da timeline com filtros:', filters);
      
      // Chamada real para POST /wbms/auto-apontamento/timeline
      const response = await this.apiService.post<TimelineData>('/wbms/auto-apontamento/timeline', filters);
      
      if (!response || !response.success) {
        console.warn('⚠️ TimelineService: Resposta vazia ou inválida da API de timeline');
        return {
          success: false,
          timestamp: [],
          period: { start: '', end: '' },
          data: {}
        };
      }
      
      console.log('✅ TimelineService: Dados da timeline carregados com sucesso');
      return response;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar dados da timeline:', error);
      throw new Error('Erro ao carregar dados da timeline');
    }
  }

  /**
   * Calcular dados de OEE baseados nos dados da timeline
   */
  calculateOeeData(timelineData: TimelineData): OeeData {
    if (!timelineData.success || !timelineData.data) {
      return { oee: 0, availability: 0, performance: 0, quality: 0 };
    }

    let totalRunTime = 0;
    let totalDownTime = 0;
    let totalSetupTime = 0;
    let totalStandbyTime = 0;
    let totalGoodCount = 0;
    let totalIdealProduction = 0;
    let totalActualProduction = 0;

    // Calcular totais de todas as linhas
    Object.values(timelineData.data).forEach(lineData => {
      if (lineData.status) {
        // Tempos
        if (lineData.status.Run) {
          totalRunTime += lineData.status.Run.duration;
        }
        if (lineData.status.Down) {
          totalDownTime += lineData.status.Down.duration;
        }
        if (lineData.status.Setup) {
          totalSetupTime += lineData.status.Setup.duration;
        }
        if (lineData.status.Standby) {
          totalStandbyTime += lineData.status.Standby.duration;
        }
      }

      // Produção
      lineData.products?.forEach(product => {
        totalGoodCount += product.good_count;
        totalIdealProduction += product.ideal_production;
        totalActualProduction += product.total_count;
      });
    });

    const totalTime = totalRunTime + totalDownTime + totalSetupTime + totalStandbyTime;
    
    // Calcular métricas OEE
    const availability = totalTime > 0 ? (totalRunTime / totalTime) * 100 : 0;
    const performance = totalIdealProduction > 0 ? (totalActualProduction / totalIdealProduction) * 100 : 0;
    const quality = totalActualProduction > 0 ? (totalGoodCount / totalActualProduction) * 100 : 0;
    const oee = (availability * performance * quality) / 10000; // Dividir por 10000 porque as métricas já estão em porcentagem

    return {
      oee: Math.round(oee * 100) / 100, // Arredondar para 2 casas decimais
      availability: Math.round(availability * 100) / 100,
      performance: Math.round(performance * 100) / 100,
      quality: Math.round(quality * 100) / 100
    };
  }

  /**
   * Carregar opções de plantas
   * GET /factories
   */
  async getPlants(): Promise<FilterOption[]> {
    try {
      console.log('🔄 TimelineService: Carregando plantas...');
      
      // Usar API real existente
      const response = await this.apiService.getFactories();
      
      if (!response || !Array.isArray(response)) {
        console.warn('⚠️ TimelineService: Resposta inválida da API:', response);
        return [];
      }
      
      const plants = response.map(factory => ({
        id: factory.plant_key?.toString() || factory.id?.toString() || '',
        name: factory.name || factory.plant_name || ''
      })).filter(plant => plant.id && plant.name);
      
      console.log('✅ TimelineService: Plantas carregadas:', plants.length);
      return plants;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar plantas:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Carregar setores por planta
   * GET /sectors
   */
  async getSectors(plantId: string): Promise<FilterOption[]> {
    try {
      console.log('🔄 TimelineService: Carregando setores para planta:', plantId);
      
      // Converter string para number para compatibilidade com a API
      const plantIdNumber = parseInt(plantId);
      
      // Usar API real conforme guia atualizado
      const response = await this.apiService.getSectors([plantIdNumber]);
      
      if (!response || !Array.isArray(response)) {
        console.warn('⚠️ TimelineService: Resposta inválida da API de setores:', response);
        return [];
      }
      
      const sectors = response.map(sector => ({
        id: sector.sector_key?.toString() || sector.id?.toString() || '',
        name: sector.name || sector.sector || ''
      })).filter(sector => sector.id && sector.name);
      
      console.log('✅ TimelineService: Setores carregados:', sectors.length);
      return sectors;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar setores:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Carregar linhas por setor
   * GET /lines
   */
  async getLines(sectorId: string): Promise<FilterOption[]> {
    try {
      console.log('🔄 TimelineService: Carregando linhas para setor:', sectorId);
      
      // Converter string para number para compatibilidade com a API
      const sectorIdNumber = parseInt(sectorId);
      
      // Usar API real conforme guia atualizado
      const response = await this.apiService.getLines([], [sectorIdNumber]);
      
      if (!response || !Array.isArray(response)) {
        console.warn('⚠️ TimelineService: Resposta inválida da API de linhas:', response);
        return [];
      }
      
      const lines = response.map(line => ({
        id: line.client_line_key?.toString() || line.id?.toString() || '',
        name: line.line || line.name || ''
      })).filter(line => line.id && line.name);
      
      console.log('✅ TimelineService: Linhas carregadas:', lines.length);
      return lines;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar linhas:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Compartilhar timeline por e-mail
   * POST /timeline/sendTimeline
   */
  async shareTimeline(data: ShareTimelineData): Promise<void> {
    try {
      console.log('🔄 TimelineService: Compartilhando timeline para:', data.email);
      
      // Chamada real para POST /timeline/sendTimeline
      await this.apiService.post('/timeline/sendTimeline', data);
      
      console.log('✅ TimelineService: Timeline compartilhada com sucesso');
    } catch (error) {
      console.error('❌ TimelineService: Erro ao compartilhar timeline:', error);
      throw new Error('Erro ao compartilhar timeline');
    }
  }

  // Utilitários
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Run': return '#22c55e';
      case 'Standby': return '#f59e0b';
      case 'Down': return '#ef4444';
      case 'Setup': return '#3b82f6';
      default: return '#6b7280';
    }
  }
}

export default TimelineService; 