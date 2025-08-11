import ApiClient from './api';

// Interfaces para as respostas da API Option7
interface UserPlantPermission {
  plant_key: number;
  plant_name: string;
  company?: string;
  company_key?: number;
}

interface UserSectorPermission {
  sector_key: number;
  sector: string;
  plant_key: number;
  company_key?: number;
}

interface UserLinePermission {
  client_line_key: number;
  line: string;
  sector_key: number;
  plant_key?: number;
  company_key?: number;
}

interface UserResponse {
  id: string | number;
  nome?: string;
  username: string;
  email?: string;
  tipo?: string;
  plantas?: UserPlantPermission[];
  setores?: UserSectorPermission[];
  linhas?: UserLinePermission[];
}

interface FactoryResponse {
  id: number;
  name: string;
  plant_name: string;
  plant_key: number;
}

interface SectorResponse {
  id: number;
  name: string;
  sector_key: number;
  sector: string;
}

interface LineResponse {
  id: number;
  client_line_key: number;
  company: string;
  plant: string;
  sector: string;
  line: string;
  name: string;
  internal_code: string;
  plant_key: number;
  sector_key: number;
  company_key: number;
  cost_center: string | null;
  description: string | null;
  equipment_model: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ProductResponse {
  id: number;
  nome: string;
  codigo: string;
  linha_id: number;
  setor_id: number;
  planta_id: number;
}

interface WorkshiftResponse {
  id: number;
  nome: string;
  codigo: string;
  linha_id: number;
  setor_id: number;
  planta_id: number;
}

interface EventReasonResponse {
  motivo: string;
  descricao_parada_key: number;
}

interface TimesheetResponse {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  plant: string;
  sector: string;
  line: string;
  shift: string;
  client_line_id: number;
  status: 'active' | 'finished' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface TimesheetListResponse {
  data: TimesheetResponse[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface JobResponse {
  id: number;
  shift_number_key: number;
  start_time: string;
  end_time: string;
  product_key: number;
  product: string;
  total_count: number;
  good_count: number;
  created_at: string;
  updated_at: string;
}

interface TimesheetEventResponse {
  id: number;
  shift_number_key: number;
  description_id: number;
  type: 'STOP' | 'SETUP' | 'PAUSE' | 'RUN';
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

interface ProxyUrlResponse {
  url: string;
  lineKey: number;
}

class Option7ApiService extends ApiClient {
  constructor() {
    super();
  }

  // ===== 1. AUTENTICAÇÃO E USUÁRIOS =====

  /**
   * Login de usuário
   * POST /user/login
   */
  async login(username: string, password: string): Promise<{ token: string; nome: string }> {
    try {
      // Usar x-www-form-urlencoded conforme documentação
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Usar o método login do ApiClient base
      const result = await super.login(username, password);
      return result;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  /**
   * Obter dados do usuário
   * GET /user
   */
  async getUser(token?: string): Promise<UserResponse> {
    try {
      const endpoint = token ? `/user?token=${token}` : '/user';
      const result = await this.get<UserResponse>(endpoint);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }

  // ===== 2. DADOS DE CONFIGURAÇÃO (FILTROS) =====

  /**
   * Obter plantas
   * GET /factories
   */
  async getFactories(): Promise<FactoryResponse[]> {
    try {
      const result = await this.get<FactoryResponse[]>('/factories');
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar plantas:', error);
      throw error;
    }
  }

  /**
   * Obter setores
   * GET /sectors
   */
  async getSectors(plantIds: number[]): Promise<SectorResponse[]> {
    try {
      // Construir query string manualmente para evitar codificação de caracteres especiais
      const queryParams = [`useIds=true`];
      plantIds.forEach(id => queryParams.push(`plantas[]=${id}`));
      const queryString = queryParams.join('&');
      
      const result = await this.get<SectorResponse[]>(`/sectors?${queryString}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar setores:', error);
      throw error;
    }
  }

  /**
   * Obter linhas
   * GET /lines
   */
  async getLines(plantIds: number[], sectorIds: number[]): Promise<LineResponse[]> {
    try {
      // Construir query string manualmente para evitar codificação de caracteres especiais
      const queryParams = [`useIds=true`];
      plantIds.forEach(id => queryParams.push(`plantas[]=${id}`));
      sectorIds.forEach(id => queryParams.push(`setores[]=${id}`));
      const queryString = queryParams.join('&');
      
      const result = await this.get<LineResponse[]>(`/lines?${queryString}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar linhas:', error);
      throw error;
    }
  }

  /**
   * Obter produtos
   * GET /products?linhas[]=269&linhas[]=270
   */
  async getProducts(plantIds: number[], sectorIds: number[], lineIds: number[]): Promise<ProductResponse[]> {
    try {
      // Construir query string manualmente para evitar codificação de caracteres especiais
      const queryParams = [`useIds=true`];
      plantIds.forEach(id => queryParams.push(`plantas[]=${id}`));
      sectorIds.forEach(id => queryParams.push(`setores[]=${id}`));
      lineIds.forEach(id => queryParams.push(`linhas[]=${id}`));
      const queryString = queryParams.join('&');
      
      const result = await this.get<ProductResponse[]>(`/products?${queryString}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Obter turnos (workshifts)
   * GET /workshifts
   */
  async getWorkshifts(plantIds?: number[], sectorIds?: number[], lineIds?: number[]): Promise<WorkshiftResponse[]> {
    try {
      // Construir query string manualmente para evitar codificação de caracteres especiais
      const queryParams = [`useIds=true`];
      
      if (plantIds && plantIds.length > 0) {
        plantIds.forEach(id => queryParams.push(`plantas[]=${id}`));
      }
      if (sectorIds && sectorIds.length > 0) {
        sectorIds.forEach(id => queryParams.push(`setores[]=${id}`));
      }
      if (lineIds && lineIds.length > 0) {
        lineIds.forEach(id => queryParams.push(`linhas[]=${id}`));
      }
      
      const queryString = queryParams.join('&');
      const result = await this.get<WorkshiftResponse[]>(`/workshifts?${queryString}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos:', error);
      throw error;
    }
  }

  /**
   * Obter motivos de eventos (paradas)
   * GET /event_reasons
   */
  async getEventReasons(type: string = 'stop'): Promise<EventReasonResponse[]> {
    try {
      const result = await this.get<EventReasonResponse[]>(`/event_reasons?type=${type}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar motivos de eventos:', error);
      throw error;
    }
  }

  // ===== 3. APONTAMENTOS (TIMESHEETS) =====

  /**
   * Criar apontamento
   * POST /timesheets
   */
  async createTimesheet(data: {
    date: string;
    start_time: string;
    end_time: string;
    plant: string;
    sector: string;
    line: string;
    shift: string;
    client_line_id: number;
  }): Promise<TimesheetResponse> {
    try {
      const result = await this.post<TimesheetResponse>('/timesheets', data);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar apontamento:', error);
      throw error;
    }
  }

  /**
   * Listar apontamentos
   * GET /timesheets
   */
  async getTimesheets(params?: {
    q?: string;
    unfinished?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<TimesheetListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.q) queryParams.append('q', params.q);
      if (params?.unfinished !== undefined) queryParams.append('unfinished', params.unfinished.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      
      const endpoint = queryParams.toString() ? `/timesheets?${queryParams.toString()}` : '/timesheets';
      const result = await this.get<TimesheetListResponse>(endpoint);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar apontamentos:', error);
      throw error;
    }
  }

  /**
   * Obter um apontamento específico
   * GET /timesheets/{id}
   */
  async getTimesheet(id: number): Promise<TimesheetResponse> {
    try {
      const result = await this.get<TimesheetResponse>(`/timesheets/${id}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar apontamento:', error);
      throw error;
    }
  }

  /**
   * Editar apontamento
   * PUT /timesheets/{id}
   */
  async updateTimesheet(id: number, data: Partial<TimesheetResponse>): Promise<TimesheetResponse> {
    try {
      const result = await this.put<TimesheetResponse>(`/timesheets/${id}`, data);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar apontamento:', error);
      throw error;
    }
  }

  /**
   * Finalizar e calcular apontamento
   * PATCH /timesheets_calculate/{id}
   */
  async calculateTimesheet(id: number): Promise<TimesheetResponse> {
    try {
      const result = await this.patch<TimesheetResponse>(`/timesheets_calculate/${id}`, {});
      return result;
    } catch (error) {
      console.error('❌ Erro ao finalizar apontamento:', error);
      throw error;
    }
  }

  /**
   * Deletar apontamento
   * DELETE /timesheets/{id}
   */
  async deleteTimesheet(id: number): Promise<void> {
    try {
      await this.delete(`/timesheets/${id}`);
    } catch (error) {
      console.error('❌ Erro ao deletar apontamento:', error);
      throw error;
    }
  }

  // ===== 4. JOBS (ORDENS DE PRODUÇÃO) =====

  /**
   * Criar job
   * POST /jobs
   */
  async createJob(data: {
    shift_number_key: number;
    start_time: string;
    end_time: string;
    product_key: number;
    product: string;
    total_count: number;
    good_count: number;
  }): Promise<JobResponse> {
    try {
      const result = await this.post<JobResponse>('/jobs', data);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar job:', error);
      throw error;
    }
  }

  /**
   * Obter um job específico
   * GET /jobs/{id}
   */
  async getJob(id: number): Promise<JobResponse> {
    try {
      const result = await this.get<JobResponse>(`/jobs/${id}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar job:', error);
      throw error;
    }
  }

  /**
   * Editar job
   * PUT /jobs/{id}
   */
  async updateJob(id: number, data: Partial<JobResponse>): Promise<JobResponse> {
    try {
      const result = await this.put<JobResponse>(`/jobs/${id}`, data);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar job:', error);
      throw error;
    }
  }

  /**
   * Deletar job
   * DELETE /jobs/{id}
   */
  async deleteJob(id: number): Promise<void> {
    try {
      await this.delete(`/jobs/${id}`);
    } catch (error) {
      console.error('❌ Erro ao deletar job:', error);
      throw error;
    }
  }

  // ===== 5. EVENTOS DO APONTAMENTO =====

  /**
   * Obter eventos de um apontamento
   * GET /timesheet_events/{shift_number_key}
   */
  async getTimesheetEvents(shiftNumberKey: number): Promise<TimesheetEventResponse[]> {
    try {
      const result = await this.get<TimesheetEventResponse[]>(`/timesheet_events/${shiftNumberKey}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }
  }

  /**
   * Editar evento
   * PUT /timesheet_events/{id}
   */
  async updateTimesheetEvent(id: number, data: Partial<TimesheetEventResponse>): Promise<TimesheetEventResponse> {
    try {
      const result = await this.put<TimesheetEventResponse>(`/timesheet_events/${id}`, data);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  }

  /**
   * Deletar evento
   * DELETE /timesheet_events/{id}
   */
  async deleteTimesheetEvent(id: number): Promise<void> {
    try {
      await this.delete(`/timesheet_events/${id}`);
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
  }

  // ===== 6. UTILITÁRIOS =====

  /**
   * Obter proxy RemoteIt
   * GET /proxyurl/{lineKey}
   */
  async getProxyUrl(lineKey: number): Promise<ProxyUrlResponse> {
    try {
      const result = await this.get<ProxyUrlResponse>(`/proxyurl/${lineKey}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar URL do proxy:', error);
      throw error;
    }
  }
}

export default Option7ApiService; 