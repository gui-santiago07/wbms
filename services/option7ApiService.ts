import ApiClient from './api';

// Interfaces para as respostas da API Option7
interface UserResponse {
  id: string;
  nome: string;
  username: string;
  email: string;
}

interface FactoryResponse {
  id: number;
  nome: string;
  codigo: string;
}

interface SectorResponse {
  id: number;
  nome: string;
  codigo: string;
  planta_id: number;
}

interface LineResponse {
  id: number;
  nome: string;
  codigo: string;
  setor_id: number;
  planta_id: number;
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
    console.log('🔐 Fazendo login...', { username });
    
    try {
      // Usar x-www-form-urlencoded conforme documentação
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${this.baseUrl}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login falhou: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Login realizado com sucesso');
      return data;
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
    console.log('👤 Buscando dados do usuário...');
    
    try {
      const endpoint = token ? `/user?token=${token}` : '/user';
      const result = await this.get<UserResponse>(endpoint);
      console.log('✅ Dados do usuário carregados');
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
    console.log('🏭 Buscando plantas...');
    
    try {
      const result = await this.get<FactoryResponse[]>('/factories');
      console.log('✅ Plantas carregadas:', result.length);
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
    console.log('🏢 Buscando setores...', { plantIds });
    
    try {
      const params = new URLSearchParams();
      params.append('useIds', 'true');
      plantIds.forEach(id => params.append('plantas[]', id.toString()));
      
      const result = await this.get<SectorResponse[]>(`/sectors?${params.toString()}`);
      console.log('✅ Setores carregados:', result.length);
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
    console.log('📏 Buscando linhas...', { plantIds, sectorIds });
    
    try {
      const params = new URLSearchParams();
      params.append('useIds', 'true');
      plantIds.forEach(id => params.append('plantas[]', id.toString()));
      sectorIds.forEach(id => params.append('setores[]', id.toString()));
      
      const result = await this.get<LineResponse[]>(`/lines?${params.toString()}`);
      console.log('✅ Linhas carregadas:', result.length);
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
    console.log('📦 Buscando produtos...', { plantIds, sectorIds, lineIds });
    
    try {
      const params = new URLSearchParams();
      params.append('useIds', 'true');
      plantIds.forEach(id => params.append('plantas[]', id.toString()));
      sectorIds.forEach(id => params.append('setores[]', id.toString()));
      lineIds.forEach(id => params.append('linhas[]', id.toString()));
      
      const result = await this.get<ProductResponse[]>(`/products?linhas[]=269&linhas[]=270?${params.toString()}`);
      console.log('✅ Produtos carregados:', result.length);
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
  async getWorkshifts(plantIds: number[], sectorIds: number[], lineIds: number[]): Promise<WorkshiftResponse[]> {
    console.log('⏰ Buscando turnos...', { plantIds, sectorIds, lineIds });
    
    try {
      const params = new URLSearchParams();
      params.append('useIds', 'true');
      plantIds.forEach(id => params.append('plantas[]', id.toString()));
      sectorIds.forEach(id => params.append('setores[]', id.toString()));
      lineIds.forEach(id => params.append('linhas[]', id.toString()));
      
      const result = await this.get<WorkshiftResponse[]>(`/workshifts?${params.toString()}`);
      console.log('✅ Turnos carregados:', result.length);
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
    console.log('🛑 Buscando motivos de eventos...', { type });
    
    try {
      const result = await this.get<EventReasonResponse[]>(`/event_reasons?type=${type}`);
      console.log('✅ Motivos de eventos carregados:', result.length);
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
    console.log('📝 Criando apontamento...', data);
    
    try {
      const result = await this.post<TimesheetResponse>('/timesheets', data);
      console.log('✅ Apontamento criado:', result.id);
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
    console.log('📋 Buscando apontamentos...', params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.q) queryParams.append('q', params.q);
      if (params?.unfinished !== undefined) queryParams.append('unfinished', params.unfinished.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      
      const endpoint = queryParams.toString() ? `/timesheets?${queryParams.toString()}` : '/timesheets';
      const result = await this.get<TimesheetListResponse>(endpoint);
      console.log('✅ Apontamentos carregados:', result.data.length);
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
    console.log('📋 Buscando apontamento específico...', { id });
    
    try {
      const result = await this.get<TimesheetResponse>(`/timesheets/${id}`);
      console.log('✅ Apontamento carregado:', result.id);
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
    console.log('✏️ Editando apontamento...', { id, data });
    
    try {
      const result = await this.put<TimesheetResponse>(`/timesheets/${id}`, data);
      console.log('✅ Apontamento atualizado:', result.id);
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
    console.log('🧮 Finalizando e calculando apontamento...', { id });
    
    try {
      const result = await this.patch<TimesheetResponse>(`/timesheets_calculate/${id}`, {});
      console.log('✅ Apontamento finalizado e calculado:', result.id);
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
    console.log('🗑️ Deletando apontamento...', { id });
    
    try {
      await this.delete(`/timesheets/${id}`);
      console.log('✅ Apontamento deletado:', id);
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
    console.log('📦 Criando job...', data);
    
    try {
      const result = await this.post<JobResponse>('/jobs', data);
      console.log('✅ Job criado:', result.id);
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
    console.log('📦 Buscando job específico...', { id });
    
    try {
      const result = await this.get<JobResponse>(`/jobs/${id}`);
      console.log('✅ Job carregado:', result.id);
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
    console.log('✏️ Editando job...', { id, data });
    
    try {
      const result = await this.put<JobResponse>(`/jobs/${id}`, data);
      console.log('✅ Job atualizado:', result.id);
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
    console.log('🗑️ Deletando job...', { id });
    
    try {
      await this.delete(`/jobs/${id}`);
      console.log('✅ Job deletado:', id);
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
    console.log('📊 Buscando eventos do apontamento...', { shiftNumberKey });
    
    try {
      const result = await this.get<TimesheetEventResponse[]>(`/timesheet_events/${shiftNumberKey}`);
      console.log('✅ Eventos carregados:', result.length);
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
    console.log('✏️ Editando evento...', { id, data });
    
    try {
      const result = await this.put<TimesheetEventResponse>(`/timesheet_events/${id}`, data);
      console.log('✅ Evento atualizado:', result.id);
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
    console.log('🗑️ Deletando evento...', { id });
    
    try {
      await this.delete(`/timesheet_events/${id}`);
      console.log('✅ Evento deletado:', id);
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
    console.log('🔗 Buscando URL do proxy...', { lineKey });
    
    try {
      const result = await this.get<ProxyUrlResponse>(`/proxyurl/${lineKey}`);
      console.log('✅ URL do proxy carregada');
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar URL do proxy:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  // Método PUT genérico (não implementado no ApiClient base)
  private async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log('🚀 PUT Request:', url, data);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição PUT: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ PUT Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ PUT Error:', error);
      throw error;
    }
  }

  // Método PATCH genérico (não implementado no ApiClient base)
  private async patch<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log('🚀 PATCH Request:', url, data);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição PATCH: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ PATCH Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ PATCH Error:', error);
      throw error;
    }
  }

  // Método DELETE genérico (não implementado no ApiClient base)
  private async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log('🚀 DELETE Request:', url);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição DELETE: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('✅ DELETE Response: Success');
    } catch (error) {
      console.error('❌ DELETE Error:', error);
      throw error;
    }
  }
}

export default Option7ApiService; 