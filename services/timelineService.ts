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
      console.log('📊 TimelineService: Buscando dados da timeline com filtros:', filters);
      
      // Simular chamada da API real
      // TODO: Implementar chamada real para POST /api/timeline
      const response = await this.simulateApiCall(filters);
      
      console.log('✅ TimelineService: Dados da timeline carregados:', response);
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
      console.log('📊 TimelineService: Buscando plantas...');
      
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
      
      console.log('✅ TimelineService: Plantas carregadas:', plants);
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
      console.log('📊 TimelineService: Buscando setores para planta:', plantId);
      
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
      
      console.log('✅ TimelineService: Setores carregados:', sectors);
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
      console.log('📊 TimelineService: Buscando linhas para setor:', sectorId);
      
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
      
      console.log('✅ TimelineService: Linhas carregadas:', lines);
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
      console.log('📊 TimelineService: Compartilhando timeline...');
      
      // TODO: Implementar chamada real para POST /api/timeline/sendTimeline
      await this.simulateShareCall(data);
      
      console.log('✅ TimelineService: Timeline compartilhada com sucesso');
    } catch (error) {
      console.error('❌ TimelineService: Erro ao compartilhar timeline:', error);
      throw new Error('Erro ao compartilhar timeline');
    }
  }

  // Método temporário para simular dados da timeline até implementar API real
  private async simulateApiCall(filters: TimelineFilters): Promise<TimelineData> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dados mockados para demonstração
    return {
      events: [
        {
          id: '1',
          start: '2024-01-20T08:00:00',
          end: '2024-01-20T10:30:00',
          status: 'Run',
          description: 'Produção Normal',
          duration: 9000
        },
        {
          id: '2',
          start: '2024-01-20T10:30:00',
          end: '2024-01-20T11:00:00',
          status: 'Setup',
          description: 'Troca de Produto',
          duration: 1800
        },
        {
          id: '3',
          start: '2024-01-20T11:00:00',
          end: '2024-01-20T12:00:00',
          status: 'Run',
          description: 'Produção Normal',
          duration: 3600
        },
        {
          id: '4',
          start: '2024-01-20T12:00:00',
          end: '2024-01-20T13:00:00',
          status: 'Down',
          description: 'Manutenção',
          duration: 3600
        },
        {
          id: '5',
          start: '2024-01-20T13:00:00',
          end: '2024-01-20T14:00:00',
          status: 'Standby',
          description: 'Aguardando Material',
          duration: 3600
        }
      ],
      products: [
        {
          id: '1',
          start: '2024-01-20T08:00:00',
          end: '2024-01-20T10:30:00',
          productName: 'Produto A - Lote 001',
          quantity: 150,
          duration: 9000
        },
        {
          id: '2',
          start: '2024-01-20T11:00:00',
          end: '2024-01-20T12:00:00',
          productName: 'Produto B - Lote 002',
          quantity: 100,
          duration: 3600
        },
        {
          id: '3',
          start: '2024-01-20T14:00:00',
          end: '2024-01-20T16:00:00',
          productName: 'Produto C - Lote 003',
          quantity: 200,
          duration: 7200
        }
      ],
      shifts: [
        {
          id: '1',
          start: '2024-01-20T08:00:00',
          end: '2024-01-20T16:00:00',
          shiftName: 'Turno 1 - Manhã',
          duration: 28800
        }
      ],
      status: {
        'Run': {
          occurrences: 2,
          totalTime: 12600,
          minTime: 3600,
          avgTime: 6300,
          maxTime: 9000
        },
        'Setup': {
          occurrences: 1,
          totalTime: 1800,
          minTime: 1800,
          avgTime: 1800,
          maxTime: 1800
        },
        'Down': {
          occurrences: 1,
          totalTime: 3600,
          minTime: 3600,
          avgTime: 3600,
          maxTime: 3600
        },
        'Standby': {
          occurrences: 1,
          totalTime: 3600,
          minTime: 3600,
          avgTime: 3600,
          maxTime: 3600
        }
      }
    };
  }

  private async simulateShareCall(data: ShareTimelineData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 TimelineService: Simulando envio de e-mail para:', data.email);
    console.log('📊 TimelineService: Dados do gráfico:', data.chartImage.substring(0, 100) + '...');
    console.log('🔍 TimelineService: Filtros aplicados:', data.filters);
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