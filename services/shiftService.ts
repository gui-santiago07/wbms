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

class ShiftService extends ApiClient {
  constructor() {
    super();
  }

  // Buscar lista de turnos - usando endpoint correto da API Option7
  async getShifts(page: number = 1, itemsPerPage: number = 10): Promise<ShiftResponse[]> {
    console.log('🔍 Buscando turnos...', { page, itemsPerPage });
    
    try {
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ShiftListResponse>(`/workshifts?page=${page}&itemsPerPage=${itemsPerPage}`);
      console.log('✅ Turnos carregados:', result.data);
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
      console.log('✅ Turno carregado:', result);
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
      console.log('✅ Turnos ativos carregados:', result.data);
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
      console.log('✅ Turno criado:', result);
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
      console.log('✅ Turno atualizado:', result);
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
      console.log('✅ Turno deletado:', shiftId);
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
        console.log('✅ Turno atual detectado:', activeShift.name);
        return activeShift;
      }

      console.log('⚠️ Nenhum turno ativo encontrado para o horário atual');
      return null;
    } catch (error) {
      console.error('❌ Erro ao detectar turno atual:', error);
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