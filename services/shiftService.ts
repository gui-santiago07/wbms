import ApiClient from './api';
import { Shift } from '../types';

// Interfaces para as respostas da API de turnos
interface ShiftResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ShiftListResponse {
  data: ShiftResponse[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

class ShiftService extends ApiClient {
  constructor() {
    super();
  }

  // Buscar lista de turnos - usando endpoint correto da API Option7
  async getShifts(page: number = 1, itemsPerPage: number = 10): Promise<ShiftResponse[]> {
    console.log('🔍 Buscando turnos...', { page, itemsPerPage });
    
    // 🚫 TEMPORARIAMENTE DESATIVADO - Rota /timesheets com erro
    console.log('⚠️ Rota /timesheets temporariamente desativada - retornando dados mock');
    
    // Retornar dados mock para desenvolvimento
    const mockShifts: ShiftResponse[] = [
      {
        id: '1',
        name: 'TURNO 1',
        startTime: '08:00',
        endTime: '16:00',
        isActive: true
      },
      {
        id: '2', 
        name: 'TURNO 2',
        startTime: '16:00',
        endTime: '00:00',
        isActive: false
      },
      {
        id: '3',
        name: 'TURNO 3',
        startTime: '00:00',
        endTime: '08:00',
        isActive: false
      }
    ];
    
    console.log('✅ Turnos mock carregados:', mockShifts);
    return mockShifts;
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // ✅ Usar endpoint correto da API Option7
      const result = await this.get<ShiftListResponse>(`/timesheets?page=${page}&itemsPerPage=${itemsPerPage}`);
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
    */
  }

  // Buscar turnos ativos
  async getActiveShifts(): Promise<ShiftResponse[]> {
    console.log('🔍 Buscando turnos ativos...');
    
    try {
      const allShifts = await this.getShifts(1, 50); // Buscar mais para filtrar
      const activeShifts = allShifts.filter(shift => shift.isActive);
      console.log('✅ Turnos ativos encontrados:', activeShifts.length);
      return activeShifts;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos ativos:', error);
      throw new Error(`Falha ao carregar turnos ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar turno específico por ID
  async getShiftById(shiftId: string): Promise<ShiftResponse> {
    console.log('🔍 Buscando turno específico:', shiftId);
    
    try {
      const result = await this.get<ShiftResponse>(`/timesheets/${shiftId}`);
      console.log('✅ Turno específico carregado:', result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar turno ${shiftId}:`, error);
      throw new Error(`Falha ao carregar turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Verificar se há turnos ativos
  async hasActiveShifts(): Promise<boolean> {
    try {
      const activeShifts = await this.getActiveShifts();
      return activeShifts.length > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar turnos ativos:', error);
      return false;
    }
  }

  // Obter primeiro turno ativo
  async getFirstActiveShift(): Promise<ShiftResponse | null> {
    try {
      const activeShifts = await this.getActiveShifts();
      return activeShifts.length > 0 ? activeShifts[0] : null;
    } catch (error) {
      console.error('❌ Erro ao obter primeiro turno ativo:', error);
      return null;
    }
  }

  // Converter ShiftResponse para Shift (formato da aplicação)
  convertToShift(shiftData: ShiftResponse): Shift {
    return {
      id: shiftData.id,
      name: shiftData.name,
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      isActive: shiftData.isActive,
    };
  }

  // Converter lista de ShiftResponse para Shift[]
  convertToShifts(shiftsData: ShiftResponse[]): Shift[] {
    return shiftsData.map(shift => this.convertToShift(shift));
  }
}

export default ShiftService; 