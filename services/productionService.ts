import ApiClient from './api';
import { 
  Timesheet, 
  ProductionLine, 
  Product, 
  ProductionStatus, 
  ShiftEvent,
  StartProductionData,
  StopProductionData 
} from '../types';

class ProductionService {
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
  }

  /**
   * 1. Verificar Produção Ativa
   * Busca turnos que não foram finalizados
   */
  async checkActiveProduction(): Promise<Timesheet[]> {
    try {
      const response = await this.api.get<Timesheet[]>('/timesheets?unfinished=true');
      return response;
    } catch (error) {
      console.error('❌ Erro ao verificar produção ativa:', error);
      throw error;
    }
  }

  /**
   * 2. Listar Linhas Disponíveis
   * Busca todas as linhas de produção disponíveis
   */
  async getAvailableLines(setores?: string[]): Promise<ProductionLine[]> {
    try {
      let endpoint = '/lines';
      if (setores && setores.length > 0) {
        const setoresParam = setores.map(s => `setores[]=${s}`).join('&');
        endpoint += `?${setoresParam}&useIds=true`;
      }
      
      const response = await this.api.get<ProductionLine[]>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar linhas disponíveis:', error);
      throw error;
    }
  }

  /**
   * 3. Iniciar Setup
   * Cria um novo turno e registra evento de setup
   */
  async startSetup(data: StartProductionData): Promise<{ timesheet: Timesheet; event: ShiftEvent }> {
    try {
      // 1. Criar turno
      const timesheetData = {
        client_line_key: data.line_id,
        product_id: data.product_id,
        start_time: new Date().toISOString()
      };

      const timesheet = await this.api.post<Timesheet>('/timesheets', timesheetData);

      // 2. Registrar evento de setup
      const eventData = {
        event_type: 'SETUP',
        description: data.setup_description || 'Setup iniciado'
      };

      const event = await this.api.post<ShiftEvent>(`/shifts/${timesheet.id}/events`, eventData);

      return { timesheet, event };
    } catch (error) {
      console.error('❌ Erro ao iniciar setup:', error);
      throw error;
    }
  }

  /**
   * 4. Iniciar Produção
   * Registra evento de início de produção
   */
  async startProduction(timesheetId: string, description?: string): Promise<ShiftEvent> {
    try {
      const eventData = {
        event_type: 'RUN',
        description: description || 'Produção iniciada'
      };

      const event = await this.api.post<ShiftEvent>(`/shifts/${timesheetId}/events`, eventData);
      return event;
    } catch (error) {
      console.error('❌ Erro ao iniciar produção:', error);
      throw error;
    }
  }

  /**
   * 5. Monitorar Produção
   * Busca status atual da produção
   */
  async getProductionStatus(timesheetId: string, historyRange: string = '4h'): Promise<ProductionStatus> {
    try {
      const response = await this.api.get<ProductionStatus>(`/shifts/${timesheetId}/status?history_range=${historyRange}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar status da produção:', error);
      throw error;
    }
  }

  /**
   * 6. Parar Produção
   * Registra evento de parada e finaliza o turno
   */
  async stopProduction(timesheetId: string, data: StopProductionData): Promise<{ event: ShiftEvent; timesheet: Timesheet }> {
    try {
      // 1. Registrar evento de parada
      const eventData = {
        event_type: 'STOP',
        description: `${data.reason}${data.description ? ` - ${data.description}` : ''}`
      };

      const event = await this.api.post<ShiftEvent>(`/shifts/${timesheetId}/events`, eventData);

      // 2. Finalizar o turno
      const timesheet = await this.api.patch<Timesheet>(`/timesheets/${timesheetId}`, {
        end_time: new Date().toISOString(),
        is_finished: true
      });

      return { event, timesheet };
    } catch (error) {
      console.error('❌ Erro ao parar produção:', error);
      throw error;
    }
  }

  /**
   * Buscar produtos disponíveis
   */
  async getAvailableProducts(): Promise<Product[]> {
    try {
      const response = await this.api.get<any[]>('/products?linhas[]=269&linhas[]=270');
      
      // Mapear dados da API para o formato interno
      const products: Product[] = response.map(item => ({
        id: item.id,
        name: item.name,
        product_key: item.product_key,
        product: item.product,
        internal_code: item.internal_code,
        units_per_package: item.units_per_package,
        // Campos de compatibilidade
        code: item.internal_code,
        description: item.name,
        sku: item.internal_code
      }));
      
      return products;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Pausar produção
   */
  async pauseProduction(timesheetId: string, reason?: string): Promise<ShiftEvent> {
    try {
      const eventData = {
        event_type: 'PAUSE',
        description: reason || 'Produção pausada'
      };

      const event = await this.api.post<ShiftEvent>(`/shifts/${timesheetId}/events`, eventData);
      return event;
    } catch (error) {
      console.error('❌ Erro ao pausar produção:', error);
      throw error;
    }
  }

  /**
   * Retomar produção
   */
  async resumeProduction(timesheetId: string): Promise<ShiftEvent> {
    try {
      const eventData = {
        event_type: 'RESUME',
        description: 'Produção retomada'
      };

      const event = await this.api.post<ShiftEvent>(`/shifts/${timesheetId}/events`, eventData);
      return event;
    } catch (error) {
      console.error('❌ Erro ao retomar produção:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico de eventos de um turno
   */
  async getShiftEvents(timesheetId: string): Promise<ShiftEvent[]> {
    try {
      const response = await this.api.get<ShiftEvent[]>(`/shifts/${timesheetId}/events`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos do turno:', error);
      throw error;
    }
  }
}

export default new ProductionService(); 