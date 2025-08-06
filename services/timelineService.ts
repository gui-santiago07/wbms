import Option7ApiService from './option7ApiService';

// Tipos para os dados da timeline
export interface TimelineData {
  events: TimelineEvent[];
  products: TimelineProduct[];
  shifts: TimelineShift[];
  status: StatusStatistics;
}

export interface TimelineEvent {
  id: string;
  start: string;
  end: string;
  status: 'Run' | 'Standby' | 'Down' | 'Setup';
  description: string;
  duration: number;
}

export interface TimelineProduct {
  id: string;
  start: string;
  end: string;
  productName: string;
  quantity: number;
  duration: number;
}

export interface TimelineShift {
  id: string;
  start: string;
  end: string;
  shiftName: string;
  duration: number;
}

export interface StatusStatistics {
  [key: string]: {
    occurrences: number;
    totalTime: number;
    minTime: number;
    avgTime: number;
    maxTime: number;
  };
}

// Tipos para filtros
export interface TimelineFilters {
  startDate: string;
  endDate: string;
  plant: string;
  sector: string;
  lines: string[];
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

class TimelineService {
  private apiService: Option7ApiService;

  constructor() {
    this.apiService = new Option7ApiService();
  }

  /**
   * Buscar dados da timeline de produção
   * POST /api/timeline
   */
  async getTimelineData(filters: TimelineFilters): Promise<TimelineData> {
    try {
      
      // Simular chamada da API real
      // TODO: Implementar chamada real para POST /api/timeline
      const response = await this.simulateApiCall(filters);
      
      return response;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar dados da timeline:', error);
      throw new Error('Erro ao carregar dados da timeline');
    }
  }

  /**
   * Carregar opções de plantas
   * GET /api/factories
   */
  async getPlants(): Promise<FilterOption[]> {
    try {
      
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
      
      return plants;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar plantas:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Carregar setores por planta
   * GET /api/sectors
   */
  async getSectors(plantId: string): Promise<FilterOption[]> {
    try {
      
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
      
      return sectors;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar setores:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Carregar linhas por setor
   * GET /api/lines
   */
  async getLines(sectorId: string): Promise<FilterOption[]> {
    try {
      
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
      
      return lines;
    } catch (error) {
      console.error('❌ TimelineService: Erro ao buscar linhas:', error);
      // Retornar array vazio em vez de lançar erro para evitar loops
      return [];
    }
  }

  /**
   * Compartilhar timeline por e-mail
   * POST /api/timeline/sendTimeline
   */
  async shareTimeline(data: ShareTimelineData): Promise<void> {
    try {
      
      // TODO: Implementar chamada real para POST /api/timeline/sendTimeline
      await this.simulateShareCall(data);
      
    } catch (error) {
      console.error('❌ TimelineService: Erro ao compartilhar timeline:', error);
      throw new Error('Erro ao compartilhar timeline');
    }
  }

  // Método temporário para simular dados da timeline até implementar API real
  private async simulateApiCall(filters: TimelineFilters): Promise<TimelineData> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dados mockados baseados na imagem de referência (02-03 Aug)
    const baseDate = new Date('2024-08-02T00:00:00');
    
    return {
      events: [
        // Eventos do dia 02/08
        { id: '1', start: '2024-08-02T06:00:00', end: '2024-08-02T08:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '2', start: '2024-08-02T08:00:00', end: '2024-08-02T08:30:00', status: 'Setup', description: 'Setup Inicial', duration: 1800 },
        { id: '3', start: '2024-08-02T08:30:00', end: '2024-08-02T10:00:00', status: 'Run', description: 'Produção Normal', duration: 5400 },
        { id: '4', start: '2024-08-02T10:00:00', end: '2024-08-02T11:00:00', status: 'Down', description: 'Manutenção', duration: 3600 },
        { id: '5', start: '2024-08-02T11:00:00', end: '2024-08-02T12:00:00', status: 'Standby', description: 'Aguardando', duration: 3600 },
        { id: '6', start: '2024-08-02T12:00:00', end: '2024-08-02T14:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '7', start: '2024-08-02T14:00:00', end: '2024-08-02T15:00:00', status: 'Setup', description: 'Troca Produto', duration: 3600 },
        { id: '8', start: '2024-08-02T15:00:00', end: '2024-08-02T16:00:00', status: 'Run', description: 'Produção Normal', duration: 3600 },
        { id: '9', start: '2024-08-02T16:00:00', end: '2024-08-02T18:00:00', status: 'Down', description: 'Parada Técnica', duration: 7200 },
        { id: '10', start: '2024-08-02T18:00:00', end: '2024-08-02T20:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '11', start: '2024-08-02T20:00:00', end: '2024-08-02T22:00:00', status: 'Standby', description: 'Aguardando', duration: 7200 },
        { id: '12', start: '2024-08-02T22:00:00', end: '2024-08-03T00:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        
        // Eventos do dia 03/08
        { id: '13', start: '2024-08-03T00:00:00', end: '2024-08-03T02:00:00', status: 'Down', description: 'Manutenção', duration: 7200 },
        { id: '14', start: '2024-08-03T02:00:00', end: '2024-08-03T04:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '15', start: '2024-08-03T04:00:00', end: '2024-08-03T06:00:00', status: 'Setup', description: 'Setup Final', duration: 7200 },
        { id: '16', start: '2024-08-03T06:00:00', end: '2024-08-03T08:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '17', start: '2024-08-03T08:00:00', end: '2024-08-03T10:00:00', status: 'Standby', description: 'Aguardando', duration: 7200 },
        { id: '18', start: '2024-08-03T10:00:00', end: '2024-08-03T12:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '19', start: '2024-08-03T12:00:00', end: '2024-08-03T14:00:00', status: 'Down', description: 'Parada Técnica', duration: 7200 },
        { id: '20', start: '2024-08-03T14:00:00', end: '2024-08-03T16:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '21', start: '2024-08-03T16:00:00', end: '2024-08-03T18:00:00', status: 'Setup', description: 'Troca Produto', duration: 7200 },
        { id: '22', start: '2024-08-03T18:00:00', end: '2024-08-03T20:00:00', status: 'Run', description: 'Produção Normal', duration: 7200 },
        { id: '23', start: '2024-08-03T20:00:00', end: '2024-08-03T22:00:00', status: 'Standby', description: 'Aguardando', duration: 7200 },
        { id: '24', start: '2024-08-03T22:00:00', end: '2024-08-03T23:59:59', status: 'Run', description: 'Produção Normal', duration: 7199 }
      ],
      products: [
        // Produtos do dia 02/08
        { id: '1', start: '2024-08-02T06:00:00', end: '2024-08-02T10:00:00', productName: 'FQF 2100068', quantity: 150, duration: 14400 },
        { id: '2', start: '2024-08-02T10:30:00', end: '2024-08-02T14:00:00', productName: 'Anti FL 2100036', quantity: 200, duration: 12600 },
        { id: '3', start: '2024-08-02T15:00:00', end: '2024-08-02T18:00:00', productName: 'Anti FL 2100036', quantity: 180, duration: 10800 },
        { id: '4', start: '2024-08-02T20:00:00', end: '2024-08-02T22:00:00', productName: 'Anti. M 2100280', quantity: 120, duration: 7200 },
        { id: '5', start: '2024-08-02T22:00:00', end: '2024-08-03T02:00:00', productName: 'Anti. M 2100280', quantity: 160, duration: 14400 },
        
        // Produtos do dia 03/08
        { id: '6', start: '2024-08-03T02:00:00', end: '2024-08-03T06:00:00', productName: 'Anti FL 2100036', quantity: 220, duration: 14400 },
        { id: '7', start: '2024-08-03T08:00:00', end: '2024-08-03T12:00:00', productName: 'FQF 2100068', quantity: 140, duration: 14400 },
        { id: '8', start: '2024-08-03T14:00:00', end: '2024-08-03T18:00:00', productName: 'Anti. M 2100280', quantity: 190, duration: 14400 },
        { id: '9', start: '2024-08-03T20:00:00', end: '2024-08-03T23:59:59', productName: 'Anti FL 2100036', quantity: 170, duration: 14399 }
      ],
      shifts: [
        // Turnos do dia 02/08
        { id: '1', start: '2024-08-02T06:00:00', end: '2024-08-02T14:00:00', shiftName: 'Turno 1', duration: 28800 },
        { id: '2', start: '2024-08-02T14:00:00', end: '2024-08-02T22:00:00', shiftName: 'Turno 2', duration: 28800 },
        { id: '3', start: '2024-08-02T22:00:00', end: '2024-08-03T06:00:00', shiftName: 'Turno 3', duration: 28800 },
        
        // Turnos do dia 03/08
        { id: '4', start: '2024-08-03T06:00:00', end: '2024-08-03T14:00:00', shiftName: 'Turno 1', duration: 28800 },
        { id: '5', start: '2024-08-03T14:00:00', end: '2024-08-03T22:00:00', shiftName: 'Turno 2', duration: 28800 },
        { id: '6', start: '2024-08-03T22:00:00', end: '2024-08-03T23:59:59', shiftName: 'Turno 3', duration: 7199 }
      ],
      status: {
        'Run': {
          occurrences: 12,
          totalTime: 86400,
          minTime: 3600,
          avgTime: 7200,
          maxTime: 7200
        },
        'Setup': {
          occurrences: 4,
          totalTime: 19800,
          minTime: 1800,
          avgTime: 4950,
          maxTime: 7200
        },
        'Down': {
          occurrences: 4,
          totalTime: 28800,
          minTime: 3600,
          avgTime: 7200,
          maxTime: 7200
        },
        'Standby': {
          occurrences: 4,
          totalTime: 28800,
          minTime: 3600,
          avgTime: 7200,
          maxTime: 7200
        }
      }
    };
  }

  private async simulateShareCall(data: ShareTimelineData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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