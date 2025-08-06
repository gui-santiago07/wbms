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

class ShiftsService {
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
  }

  /**
   * Listar todos os turnos
   */
  async getAllWorkshifts(): Promise<Workshift[]> {
    try {
      const response = await this.api.get<Workshift[]>('/workshifts');
      return response;
    } catch (error) {
      console.error('❌ Erro ao carregar todos os turnos:', error);
      throw error;
    }
  }

  /**
   * Listar turnos com filtros
   */
  async getWorkshiftsWithFilters(filters: WorkshiftFilters): Promise<Workshift[]> {
    try {
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
      const response = await this.api.get<Workshift[]>(endpoint);
      
      console.log('🔄 ShiftsService: Turnos carregados com filtros:', {
        filters,
        count: response.length,
        data: response
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao carregar turnos com filtros:', error);
      throw error;
    }
  }

  /**
   * Listar turnos por empresa
   */
  async getWorkshiftsByCompany(empresas: string[]): Promise<Workshift[]> {
    try {
      const params = new URLSearchParams();
      empresas.forEach(empresa => {
        params.append('empresas[]', empresa);
      });

      const endpoint = `/listar-turnos-completo?${params.toString()}`;
      const response = await this.api.get<Workshift[]>(endpoint);
      
      console.log('🔄 ShiftsService: Turnos carregados por empresa:', {
        empresas,
        count: response.length,
        data: response
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao carregar turnos por empresa:', error);
      throw error;
    }
  }

  /**
   * Listar turnos para formulários
   */
  async getWorkshiftsForForms(filters: WorkshiftFilters): Promise<Workshift[]> {
    try {
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
      const response = await this.api.get<Workshift[]>(endpoint);
      
      console.log('🔄 ShiftsService: Turnos carregados para formulários:', {
        filters,
        count: response.length,
        data: response
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao carregar turnos para formulários:', error);
      throw error;
    }
  }

  /**
   * Detectar turno atual baseado no horário
   */
  detectCurrentShift(workshifts: Workshift[]): Workshift | null {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return workshifts.find(shift => {
      const [startHour, startMin] = (shift.start_time || '08:00').split(':').map(Number);
      const [endHour, endMin] = (shift.end_time || '18:00').split(':').map(Number);
      
      const shiftStartMinutes = startHour * 60 + startMin;
      const shiftEndMinutes = endHour * 60 + endMin;
      
      // Lidar com turnos que passam da meia-noite
      if (shiftEndMinutes < shiftStartMinutes) {
        return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
      } else {
        return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
      }
    }) || null;
  }

  /**
   * Converter Workshift para formato do store
   */
  convertToStoreFormat(workshift: Workshift): {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    shiftNumberKey: number;
  } {
    return {
      id: workshift.id || workshift.shift_config_key,
      name: workshift.name,
      startTime: workshift.start_time || '08:00',
      endTime: workshift.end_time || '18:00',
      isActive: true, // Assumir ativo
      shiftNumberKey: parseInt(workshift.id || workshift.shift_config_key)
    };
  }

  /**
   * Carregar turnos para configuração inicial
   */
  async loadShiftsForInitialSetup(plantId?: string, sectorId?: string, lineId?: string): Promise<Workshift[]> {
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
      
      console.log('🔄 ShiftsService: Turnos carregados para configuração inicial:', {
        plantId,
        sectorId,
        lineId,
        count: workshifts.length,
        data: workshifts
      });
      
      return workshifts;
    } catch (error) {
      console.error('❌ Erro ao carregar turnos para configuração inicial:', error);
      throw error;
    }
  }
}

export default new ShiftsService(); 