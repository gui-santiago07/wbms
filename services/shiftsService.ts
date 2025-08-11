import Option7ApiService from './option7ApiService';

// Tipagem mínima baseada no retorno da API Option7
interface WorkshiftResponse {
  id: number;
  // Alguns ambientes retornam 'name', outros 'nome'
  name?: string;
  nome?: string;
  codigo?: string;
  linha_id?: number;
  setor_id?: number;
  planta_id?: number;
  start_time?: string; // HH:mm:ss
  end_time?: string;   // HH:mm:ss
}

// Formato interno esperado pelo store
export interface LocalShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  // Compatibilidade com serviços que usam shiftNumberKey
  shiftNumberKey?: string | number;
}

class ShiftsService {
  private api: Option7ApiService;

  constructor() {
    this.api = new Option7ApiService();
  }

  // Carregar turnos considerando filtros por planta/setor/linha usando useIds=true
  async loadShiftsForInitialSetup(
    plantId?: string,
    sectorId?: string,
    lineId?: string
  ): Promise<WorkshiftResponse[]> {
    const plantIds = plantId ? [parseInt(plantId, 10)] : [];
    const sectorIds = sectorId ? [parseInt(sectorId, 10)] : [];
    const lineIds = lineId ? [parseInt(lineId, 10)] : [];

    return this.api.getWorkshifts(plantIds, sectorIds, lineIds);
  }

  // Detectar turno atual. Sem horários na API, usar o primeiro como padrão.
  detectCurrentShift(workshifts: WorkshiftResponse[]): WorkshiftResponse | null {
    if (!workshifts || workshifts.length === 0) return null;

    const toMinutes = (time?: string): number | null => {
      if (!time) return null;
      const [h, m, s] = time.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m + (Number.isNaN(s) ? 0 : Math.floor(s / 60));
    };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Encontrar o primeiro turno cujo intervalo contenha o horário atual
    for (const ws of workshifts) {
      const startMin = toMinutes(ws.start_time);
      const endMin = toMinutes(ws.end_time);
      if (startMin == null || endMin == null) continue;

      const crossesMidnight = endMin < startMin;
      const isActive = crossesMidnight
        ? currentMinutes >= startMin || currentMinutes < endMin
        : currentMinutes >= startMin && currentMinutes < endMin;

      if (isActive) return ws;
    }

    // Se nenhum contém o horário atual, devolver o mais próximo pelo start_time como fallback
    const withStartTimes = workshifts
      .map(ws => ({ ws, start: toMinutes(ws.start_time) }))
      .filter((x): x is { ws: WorkshiftResponse; start: number } => x.start != null);
    if (withStartTimes.length > 0) {
      withStartTimes.sort((a, b) => a.start - b.start);
      return withStartTimes[0].ws;
    }

    return workshifts[0];
  }

  // Converter do retorno da API para o formato interno esperado pelo store
  convertToStoreFormat(workshift: WorkshiftResponse): LocalShift {
    return {
      id: workshift.id.toString(),
      name: workshift.name || workshift.nome || workshift.codigo || `Turno ${workshift.id}`,
      // Mapear horários reais (cortar segundos para exibição/compatibilidade com store)
      startTime: (workshift.start_time || '00:00:00').slice(0, 5),
      endTime: (workshift.end_time || '23:59:59').slice(0, 5),
      isActive: true,
      // Opcionalmente usar o próprio id como chave do timesheet/shiftNumberKey
      shiftNumberKey: workshift.id
    };
  }
}

export default new ShiftsService();

