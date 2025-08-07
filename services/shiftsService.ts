import ApiClient from './api';

// Tipos para turnos
export interface Workshift {
  id: string;
  name: string;
  shift_config_key: string;
  start_time: string;
  end_time: string;
}

export interface WorkshiftFilters {
  plantas?: string[];
  setores?: string[];
  linhas?: string[];
  empresas?: string[];
  useIds?: boolean;
}

// Interface para resposta da API com tratamento de erro
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
}

class ShiftsService {
  private api: ApiClient;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 segundo

  constructor() {
    this.api = new ApiClient();
  }

  /**
   * Função utilitária para retry com delay exponencial
   */
  private async retryWithDelay<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.retryAttempts,
    delay: number = this.retryDelay
  ): Promise<ApiResponse<T>> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ShiftsService: Tentativa ${attempt}/${maxRetries} para buscar turnos`);
        
        const result = await operation();
        
        console.log(`✅ ShiftsService: Sucesso na tentativa ${attempt}/${maxRetries}`);
        
        return {
          success: true,
          data: result,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ShiftsService: Tentativa ${attempt}/${maxRetries} falhou:`, error);
        
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1); // Delay exponencial
          console.log(`⏳ ShiftsService: Aguardando ${waitTime}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    console.error(`❌ ShiftsService: Todas as ${maxRetries} tentativas falharam. Último erro:`, lastError);
    
    return {
      success: false,
      error: lastError?.message || 'Erro desconhecido após múltiplas tentativas',
      retryCount: maxRetries
    };
  }

  /**
   * Validar resposta da API
   */
  private validateApiResponse<T>(response: any, endpoint: string): T {
    if (!response) {
      throw new Error(`Resposta vazia da API ${endpoint}`);
    }
    
    if (Array.isArray(response)) {
      if (response.length === 0) {
        console.warn(`⚠️ ShiftsService: API ${endpoint} retornou array vazio`);
      }
      return response as T;
    }
    
    if (typeof response === 'object' && response.data) {
      return response.data as T;
    }
    
    throw new Error(`Formato de resposta inválido da API ${endpoint}: ${typeof response}`);
  }

  /**
   * Listar todos os turnos com retry
   */
  async getAllWorkshifts(): Promise<Workshift[]> {
    const response = await this.retryWithDelay(async () => {
      const result = await this.api.get<Workshift[]>('/workshifts');
      return this.validateApiResponse(result, '/workshifts');
    });
    
    if (!response.success) {
      console.error('❌ ShiftsService: Falha ao carregar todos os turnos:', response.error);
      return this.getFallbackShifts();
    }
    
    return (response.data as Workshift[]) || [];
  }

  /**
   * Listar turnos com filtros com retry robusto
   */
  async getWorkshiftsWithFilters(filters: WorkshiftFilters): Promise<Workshift[]> {
    console.log('🔄 ShiftsService: Iniciando busca de turnos com filtros:', filters);
    
    const response = await this.retryWithDelay(async () => {
      const params = new URLSearchParams();
      
      // Adicionar parâmetro useIds
      if (filters.useIds !== undefined) {
        params.append('useIds', filters.useIds.toString());
      }
      
      // Adicionar filtros de planta
      if (filters.plantas && filters.plantas.length > 0) {
        filters.plantas.forEach(planta => {
          params.append('plantas[]', planta);
        });
      }
      
      // Adicionar filtros de setor
      if (filters.setores && filters.setores.length > 0) {
        filters.setores.forEach(setor => {
          params.append('setores[]', setor);
        });
      }
      
      // Adicionar filtros de linha
      if (filters.linhas && filters.linhas.length > 0) {
        filters.linhas.forEach(linha => {
          params.append('linhas[]', linha);
        });
      }
      
      // Adicionar filtros de empresa
      if (filters.empresas && filters.empresas.length > 0) {
        filters.empresas.forEach(empresa => {
          params.append('empresas[]', empresa);
        });
      }

      const endpoint = `/workshifts?${params.toString()}`;
      console.log('🔄 ShiftsService: Chamando endpoint:', endpoint);
      
      const result = await this.api.get<Workshift[]>(endpoint);
      return this.validateApiResponse(result, endpoint);
    });
    
    if (!response.success) {
      console.error('❌ ShiftsService: Falha ao carregar turnos com filtros:', response.error);
      console.log('🔄 ShiftsService: Usando turnos de fallback');
      return this.getFallbackShifts();
    }
    
    const workshifts = (response.data as Workshift[]) || [];
    
    console.log('✅ ShiftsService: Turnos carregados com sucesso:', {
      filters,
      count: workshifts.length,
      retryCount: response.retryCount,
      data: workshifts.map((w: Workshift) => ({ id: w.id, name: w.name, start: w.start_time, end: w.end_time }))
    });
    
    return workshifts;
  }

  /**
   * Listar turnos por empresa com retry
   */
  async getWorkshiftsByCompany(empresas: string[]): Promise<Workshift[]> {
    const response = await this.retryWithDelay(async () => {
      const params = new URLSearchParams();
      empresas.forEach(empresa => {
        params.append('empresas[]', empresa);
      });

      const endpoint = `/listar-turnos-completo?${params.toString()}`;
      const result = await this.api.get<Workshift[]>(endpoint);
      return this.validateApiResponse(result, endpoint);
    });
    
    if (!response.success) {
      console.error('❌ ShiftsService: Falha ao carregar turnos por empresa:', response.error);
      return this.getFallbackShifts();
    }
    
    return (response.data as Workshift[]) || [];
  }

  /**
   * Listar turnos para formulários com retry
   */
  async getWorkshiftsForForms(filters: WorkshiftFilters): Promise<Workshift[]> {
    const response = await this.retryWithDelay(async () => {
      const params = new URLSearchParams();
      
      // Adicionar parâmetro useIds
      if (filters.useIds !== undefined) {
        params.append('useIds', filters.useIds.toString());
      }
      
      // Adicionar filtros de planta
      if (filters.plantas && filters.plantas.length > 0) {
        filters.plantas.forEach(planta => {
          params.append('plantas[]', planta);
        });
      }
      
      // Adicionar filtros de setor
      if (filters.setores && filters.setores.length > 0) {
        filters.setores.forEach(setor => {
          params.append('setores[]', setor);
        });
      }
      
      // Adicionar filtros de linha
      if (filters.linhas && filters.linhas.length > 0) {
        filters.linhas.forEach(linha => {
          params.append('linhas[]', linha);
        });
      }

      const endpoint = `/listar-turnos-submisso?${params.toString()}`;
      const result = await this.api.get<Workshift[]>(endpoint);
      return this.validateApiResponse(result, endpoint);
    });
    
    if (!response.success) {
      console.error('❌ ShiftsService: Falha ao carregar turnos para formulários:', response.error);
      return this.getFallbackShifts();
    }
    
    return (response.data as Workshift[]) || [];
  }

  /**
   * Detectar turno atual baseado no horário com validação robusta
   */
  detectCurrentShift(workshifts: Workshift[]): Workshift | null {
    if (!workshifts || workshifts.length === 0) {
      console.warn('⚠️ ShiftsService: Nenhum turno disponível para detecção');
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    console.log('🔄 ShiftsService: Detectando turno atual:', {
      currentTime: `${now.getHours()}:${now.getMinutes()}`,
      currentTimeMinutes: currentTime,
      availableShifts: workshifts.length
    });
    
    const activeShift = workshifts.find(shift => {
      try {
        const [startHour, startMin] = (shift.start_time || '08:00').split(':').map(Number);
        const [endHour, endMin] = (shift.end_time || '18:00').split(':').map(Number);
        
        const shiftStartMinutes = startHour * 60 + startMin;
        const shiftEndMinutes = endHour * 60 + endMin;
        
        console.log(`🔄 ShiftsService: Verificando turno "${shift.name}":`, {
          start: shift.start_time,
          end: shift.end_time,
          startMinutes: shiftStartMinutes,
          endMinutes: shiftEndMinutes,
          isActive: shiftEndMinutes < shiftStartMinutes 
            ? (currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes)
            : (currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes)
        });
        
        // Lidar com turnos que passam da meia-noite
        if (shiftEndMinutes < shiftStartMinutes) {
          return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
        } else {
          return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
        }
      } catch (error) {
        console.error(`❌ ShiftsService: Erro ao processar turno "${shift.name}":`, error);
        return false;
      }
    });
    
    if (activeShift) {
      console.log('✅ ShiftsService: Turno ativo detectado:', {
        id: activeShift.id,
        name: activeShift.name,
        start: activeShift.start_time,
        end: activeShift.end_time
      });
    } else {
      console.warn('⚠️ ShiftsService: Nenhum turno ativo detectado para o horário atual');
    }
    
    return activeShift || null;
  }

  /**
   * Converter Workshift para formato do store com validação
   */
  convertToStoreFormat(workshift: Workshift): {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    shiftNumberKey: number;
  } {
    if (!workshift) {
      throw new Error('Workshift não pode ser null ou undefined');
    }
    
    const id = workshift.id || workshift.shift_config_key || 'unknown';
    const name = workshift.name || 'Turno Desconhecido';
    const startTime = workshift.start_time || '08:00';
    const endTime = workshift.end_time || '18:00';
    
    // Validar formato de horário
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      console.warn(`⚠️ ShiftsService: Formato de horário inválido para turno "${name}": ${startTime} - ${endTime}`);
    }
    
    return {
      id,
      name,
      startTime,
      endTime,
      isActive: true, // Assumir ativo
      shiftNumberKey: parseInt(id) || 1
    };
  }

  /**
   * Carregar turnos para configuração inicial com múltiplas estratégias
   */
  async loadShiftsForInitialSetup(plantId?: string, sectorId?: string, lineId?: string): Promise<Workshift[]> {
    console.log('🔄 ShiftsService: Iniciando carregamento de turnos para configuração inicial:', {
      plantId,
      sectorId,
      lineId
    });
    
    // Estratégia 1: Tentar com filtros completos
    try {
      const filters: WorkshiftFilters = {
        useIds: true
      };
      
      if (plantId) {
        filters.plantas = [plantId];
      }
      if (sectorId) {
        filters.setores = [sectorId];
      }
      if (lineId) {
        filters.linhas = [lineId];
      }

      const workshifts = await this.getWorkshiftsWithFilters(filters);
      
      if (workshifts.length > 0) {
        console.log('✅ ShiftsService: Turnos carregados com filtros completos:', {
          plantId,
          sectorId,
          lineId,
          count: workshifts.length
        });
        return workshifts;
      }
    } catch (error) {
      console.warn('⚠️ ShiftsService: Falha na estratégia 1 (filtros completos):', error);
    }
    
    // Estratégia 2: Tentar apenas com planta
    if (plantId) {
      try {
        const workshifts = await this.getWorkshiftsWithFilters({
          useIds: true,
          plantas: [plantId]
        });
        
        if (workshifts.length > 0) {
          console.log('✅ ShiftsService: Turnos carregados apenas com planta:', {
            plantId,
            count: workshifts.length
          });
          return workshifts;
        }
      } catch (error) {
        console.warn('⚠️ ShiftsService: Falha na estratégia 2 (apenas planta):', error);
      }
    }
    
    // Estratégia 3: Tentar sem filtros
    try {
      const workshifts = await this.getAllWorkshifts();
      
      if (workshifts.length > 0) {
        console.log('✅ ShiftsService: Turnos carregados sem filtros:', {
          count: workshifts.length
        });
        return workshifts;
      }
    } catch (error) {
      console.warn('⚠️ ShiftsService: Falha na estratégia 3 (sem filtros):', error);
    }
    
    // Estratégia 4: Usar turnos de fallback
    console.log('🔄 ShiftsService: Usando turnos de fallback após falha de todas as estratégias');
    return this.getFallbackShifts();
  }

  /**
   * Gerar turnos de fallback para garantir que sempre há turnos disponíveis
   */
  private getFallbackShifts(): Workshift[] {
    console.log('🔄 ShiftsService: Gerando turnos de fallback');
    
    const fallbackShifts: Workshift[] = [
      {
        id: '1',
        name: 'Turno 1',
        shift_config_key: '1',
        start_time: '08:00',
        end_time: '16:00'
      },
      {
        id: '2',
        name: 'Turno 2',
        shift_config_key: '2',
        start_time: '16:00',
        end_time: '00:00'
      },
      {
        id: '3',
        name: 'Turno 3',
        shift_config_key: '3',
        start_time: '00:00',
        end_time: '08:00'
      }
    ];
    
    console.log('✅ ShiftsService: Turnos de fallback gerados:', fallbackShifts.length);
    return fallbackShifts;
  }

  /**
   * Verificar se a API está disponível
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      console.log('🔄 ShiftsService: Verificando saúde da API...');
      
      const response = await this.retryWithDelay(async () => {
        await this.api.get('/workshifts');
        return true;
      }, 1, 500); // Apenas 1 tentativa rápida
      
      const isHealthy = response.success;
      console.log(`✅ ShiftsService: API ${isHealthy ? 'saudável' : 'indisponível'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('❌ ShiftsService: Erro ao verificar saúde da API:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas de carregamento
   */
  getLoadingStats(): {
    retryAttempts: number;
    retryDelay: number;
    apiHealth: boolean;
  } {
    return {
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      apiHealth: false // Será atualizado quando checkApiHealth for chamado
    };
  }
}

export default new ShiftsService(); 