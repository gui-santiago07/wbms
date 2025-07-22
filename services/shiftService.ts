import ApiClient from './api';
import { Shift } from '../types';

// Interfaces para as respostas da API de turnos (baseado na documentação)
interface ApontamentoResponse {
  id: number;
  shift_id: string;
  line_id: number;
  line_name: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'finished' | 'paused';
  total_count: number;
  good_count: number;
  reject_count: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_product?: {
    id: number;
    name: string;
    sku: string;
  };
  current_job?: {
    id: number;
    job_id: string;
    quantity: number;
  };
}

interface ApontamentoListResponse {
  data: ApontamentoResponse[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

class ShiftService extends ApiClient {
  constructor() {
    super();
  }

  // Buscar lista de apontamentos (turnos) - endpoint correto da documentação
  async getApontamentos(page: number = 1, itemsPerPage: number = 10): Promise<ApontamentoResponse[]> {
    console.log('🔍 Buscando apontamentos (turnos)...', { page, itemsPerPage });
    
    try {
      const result = await this.get<ApontamentoListResponse>(`/apontamento-lista?page=${page}&itemsPerPage=${itemsPerPage}`);
      console.log('✅ Apontamentos carregados:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Erro ao buscar apontamentos:', error);
      throw new Error(`Falha ao carregar apontamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar turnos ativos (status = 'active')
  async getActiveShifts(): Promise<ApontamentoResponse[]> {
    console.log('🔍 Buscando turnos ativos...');
    
    try {
      const allApontamentos = await this.getApontamentos(1, 50); // Buscar mais para filtrar
      const activeShifts = allApontamentos.filter(ap => ap.status === 'active');
      console.log('✅ Turnos ativos encontrados:', activeShifts.length);
      return activeShifts;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos ativos:', error);
      throw new Error(`Falha ao carregar turnos ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar turno específico por ID
  async getShiftById(shiftId: number): Promise<ApontamentoResponse> {
    console.log('🔍 Buscando turno específico:', shiftId);
    
    try {
      const result = await this.get<ApontamentoResponse>(`/apontamento-lista/${shiftId}`);
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
  async getFirstActiveShift(): Promise<ApontamentoResponse | null> {
    try {
      const activeShifts = await this.getActiveShifts();
      return activeShifts.length > 0 ? activeShifts[0] : null;
    } catch (error) {
      console.error('❌ Erro ao obter primeiro turno ativo:', error);
      return null;
    }
  }

  // Converter ApontamentoResponse para Shift (formato da aplicação)
  convertToShift(apontamento: ApontamentoResponse): Shift {
    return {
      id: `shift-${apontamento.id}`,
      name: apontamento.shift_id,
      startTime: new Date(apontamento.start_time).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: apontamento.end_time 
        ? new Date(apontamento.end_time).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '--:--',
      isActive: apontamento.status === 'active',
      // Dados adicionais do turno real
      shiftNumberKey: apontamento.id,
      assetId: apontamento.line_name,
      partId: apontamento.current_product?.sku || '',
      totalCount: apontamento.total_count,
      goodCount: apontamento.good_count,
      rejectCount: 0, // Zerar rejeitos
      oee: apontamento.oee,
      availability: apontamento.availability,
      performance: apontamento.performance,
      quality: apontamento.quality,
    };
  }

  // Converter lista de ApontamentoResponse para Shift[]
  convertToShifts(apontamentos: ApontamentoResponse[]): Shift[] {
    return apontamentos.map(apontamento => this.convertToShift(apontamento));
  }
}

export default ShiftService; 