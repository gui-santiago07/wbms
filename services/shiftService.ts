import ApiClient from './api';
import { Shift } from '../types';

interface ShiftResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ShiftListResponse {
  data: ShiftResponse[];
  total: number;
  page: number;
  itemsPerPage: number;
}

// Nova interface para detalhes completos do turno
interface ShiftDetailsResponse {
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
  operator: {
    name: string;
    role: string;
  };
  line: {
    name: string;
  };
  productionOrder: {
    id: string;
    totalQuantity: number;
    shiftTarget: number;
  };
  product: {
    code: string;
    name: string;
  };
}

class ShiftService extends ApiClient {
  constructor() {
    super();
  }

  // Buscar lista de turnos - usando endpoint correto da API Option7
  async getShifts(page: number = 1, itemsPerPage: number = 10): Promise<ShiftResponse[]> {
    
    try {
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ShiftListResponse>(`/workshifts?page=${page}&itemsPerPage=${itemsPerPage}`);
      return result.data;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos:', error);
      
      // Log detalhado para debug
      if (error instanceof Response) {
        console.error('📊 Status:', error.status);
        console.error('📋 Status Text:', error.statusText);
        console.error('📄 Headers:', Object.fromEntries(error.headers.entries()));
        
        // Tentar ler o corpo da resposta para debug
        try {
          const responseText = await error.text();
          console.error('📄 Response Body (primeiros 500 chars):', responseText.substring(0, 500));
          
          // Verificar se é HTML
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.error('🚨 Resposta é HTML, não JSON! Possíveis causas:');
            console.error('   - Endpoint não existe (404)');
            console.error('   - Problema de autenticação (redirecionamento)');
            console.error('   - Servidor não está rodando');
            console.error('   - URL incorreta');
          }
        } catch (textError) {
          console.error('📄 Erro ao ler response body:', textError);
        }
      }
      
      throw new Error(`Falha ao carregar turnos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar turno específico por ID
  async getShiftById(shiftId: string): Promise<ShiftResponse> {
    try {
      const result = await this.get<ShiftResponse>(`/workshifts/${shiftId}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar turno:', error);
      throw new Error(`Falha ao carregar turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar turnos ativos
  async getActiveShifts(): Promise<ShiftResponse[]> {
    try {
      const result = await this.get<ShiftListResponse>('/workshifts?is_active=true');
      return result.data;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos ativos:', error);
      throw new Error(`Falha ao carregar turnos ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Criar novo turno
  async createShift(shiftData: {
    name: string;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }): Promise<ShiftResponse> {
    try {
      const result = await this.post<ShiftResponse>('/workshifts', shiftData);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar turno:', error);
      throw new Error(`Falha ao criar turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Atualizar turno
  async updateShift(shiftId: string, shiftData: Partial<ShiftResponse>): Promise<ShiftResponse> {
    try {
      const result = await this.patch<ShiftResponse>(`/workshifts/${shiftId}`, shiftData);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar turno:', error);
      throw new Error(`Falha ao atualizar turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Deletar turno
  async deleteShift(shiftId: string): Promise<void> {
    try {
      await this.delete(`/workshifts/${shiftId}`);
    } catch (error) {
      console.error('❌ Erro ao deletar turno:', error);
      throw new Error(`Falha ao deletar turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Detectar turno atual baseado no horário
  async detectCurrentShift(): Promise<ShiftResponse | null> {
    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const shifts = await this.getShifts(1, 100); // Buscar todos os turnos
      
      const activeShift = shifts.find(shift => {
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        
        const shiftStartMinutes = startHour * 60 + startMin;
        const shiftEndMinutes = endHour * 60 + endMin;
        
        // Lidar com turnos que passam da meia-noite
        if (shiftEndMinutes < shiftStartMinutes) {
          return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
        } else {
          return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
        }
      });

      if (activeShift) {
        return activeShift;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao detectar turno atual:', error);
      return null;
    }
  }

  // Buscar detalhes completos de um turno específico
  async getShiftDetails(shiftId: string): Promise<ShiftDetailsResponse> {
    
    try {
      // ✅ Usar endpoint correto da API Option7 para detalhes do turno
      const result = await this.get<ShiftDetailsResponse>(`/workshifts/${shiftId}/details`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do turno:', error);
      
      // Log detalhado para debug
      if (error instanceof Response) {
        console.error('📊 Status:', error.status);
        console.error('📋 Status Text:', error.statusText);
        console.error('📄 Headers:', Object.fromEntries(error.headers.entries()));
        
        // Tentar ler o corpo da resposta para debug
        try {
          const responseText = await error.text();
          console.error('📄 Response Body (primeiros 500 chars):', responseText.substring(0, 500));
          
          // Verificar se é HTML
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.error('🚨 Resposta é HTML, não JSON! Possíveis causas:');
            console.error('   - Endpoint não existe (404)');
            console.error('   - Problema de autenticação (redirecionamento)');
            console.error('   - Servidor não está rodando');
            console.error('   - URL incorreta');
          }
        } catch (textError) {
          console.error('📄 Erro ao ler response body:', textError);
        }
      }
      
      // Retornar null em caso de erro para evitar dados mockados
      return null;
    }
  }

  // Buscar turno ativo para uma linha específica
  async getActiveShift(lineId: string): Promise<ShiftResponse | null> {
    try {
      const result = await this.get<ShiftResponse>(`/workshifts/active?line=${lineId}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar turno ativo:', error);
      return null;
    }
  }

  // Converter ShiftResponse para Shift (formato interno)
  convertToShift(response: ShiftResponse): Shift {
    return {
      id: response.id,
      name: response.name,
      startTime: response.startTime,
      endTime: response.endTime,
      isActive: response.isActive
    };
  }
}

export default ShiftService; 