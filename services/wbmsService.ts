import ApiClient from './api';
import { LiveMetrics, CurrentJob, ProductionLine } from '../types';

// Interfaces para as respostas da API WBMS externa
interface WbmsEquipmentResponse {
  iNome: string;
  equip: Array<{
    eSerie: string;
    eNome: string;
    eModelo: string;
    eParam: string[];
  }>;
}

interface WbmsLiveDataResponse {
  iNome: string;
  eSerie: string;
  eNome: string;
  eUltimaConexao: string;
  eNivelWifi: number;
  eValues: Array<{
    pNome: string;
    pUnidade: string;
    pValor: string;
    pLocAdd: string;
  }>;
}

interface WbmsHistDataResponse {
  // Estrutura para dados históricos (pode ser expandida conforme necessário)
  data: Array<{
    timestamp: string;
    contagem: number;
    throughput: number;
    cycleTime: number;
  }>;
}

class WbmsService {
  private baseUrl: string;
  private token: string = 'RbIWgKlu7IWvyEr3VHO37OGqze9DTaAE';

  constructor() {
    // Usar proxy local em desenvolvimento, URL externa em produção
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = isDevelopment 
      ? '/api/wbms' 
      : 'https://www.wbms.com.br/serv/apiWbms.php';
  }

  // Método privado para fazer requisições para a API WBMS
  private async makeWbmsRequest(params: Record<string, string>): Promise<any> {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let url: URL;
    if (isDevelopment) {
      // Em desenvolvimento, usar proxy local
      url = new URL(this.baseUrl, window.location.origin);
      url.searchParams.set('tkn', this.token);
    } else {
      // Em produção, usar URL externa diretamente
      url = new URL(this.baseUrl);
      url.searchParams.set('tkn', this.token);
    }
    
    // Adicionar parâmetros da requisição
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`WBMS API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ WBMS API Error:', error);
      throw error;
    }
  }

  // Obter lista de equipamentos
  async getEquipments(): Promise<WbmsEquipmentResponse> {
    try {
      const result = await this.makeWbmsRequest({ cmd: 'getEquip' });
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar equipamentos WBMS:', error);
      throw new Error(`Falha ao carregar equipamentos WBMS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Obter dados em tempo real para um equipamento específico
  async getLiveData(equipmentId: string): Promise<WbmsLiveDataResponse> {
    try {
      const result = await this.makeWbmsRequest({ 
        cmd: 'getLiveData',
        equ: equipmentId
      });
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados em tempo real WBMS:', error);
      throw new Error(`Falha ao carregar dados em tempo real WBMS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Obter dados históricos para um equipamento
  async getHistData(equipmentId: string, date: string, startTime: string, endTime: string): Promise<WbmsHistDataResponse> {
    try {
      const result = await this.makeWbmsRequest({ 
        cmd: 'getHistData',
        equ: equipmentId,
        dia: date,
        hini: startTime,
        hfim: endTime
      });
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados históricos WBMS:', error);
      throw new Error(`Falha ao carregar dados históricos WBMS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Método auxiliar para extrair valor de um parâmetro específico
  private getParameterValue(data: WbmsLiveDataResponse, paramName: string): string {
    const param = data.eValues.find(p => p.pNome === paramName);
    return param ? param.pValor : '0';
  }

  // Converter WbmsLiveDataResponse para LiveMetrics
  convertToLiveMetrics(data: WbmsLiveDataResponse): LiveMetrics {
    // Extrair valores dos parâmetros WBMS
    const contagem = parseInt(this.getParameterValue(data, 'Contagem')) || 0;
    const throughput = parseFloat(this.getParameterValue(data, 'Throughput')) || 0;
    const cycleTime = parseFloat(this.getParameterValue(data, 'CycleTime')) || 0;
    const cycleTimeAvg = parseFloat(this.getParameterValue(data, 'CycleTimeAvg')) || 0;
    const stoppedTime = parseInt(this.getParameterValue(data, 'StoppedTime')) || 0;
    const runningTime = parseInt(this.getParameterValue(data, 'RunningTime')) || 0;
    const stoppedStatus = parseInt(this.getParameterValue(data, 'StoppedStatus')) || 0;

    // Calcular métricas derivadas
    const totalTime = runningTime + stoppedTime;
    const availability = totalTime > 0 ? (runningTime / totalTime) * 100 : 0;
    const performance = cycleTimeAvg > 0 ? (cycleTime / cycleTimeAvg) * 100 : 0;
    const quality = 100; // Qualidade sempre 100% (sem rejeitos)
    const oee = (availability * performance * quality) / 10000;

    return {
      total: contagem,
      good: contagem, // Todas as peças são boas (sem rejeitos)
      rejects: 0, // Zerar rejeitos
      oee: oee,
      availability: availability,
      performance: performance,
      quality: quality,
      productionOrderProgress: contagem,
      possibleProduction: Math.floor(throughput), // Throughput como produção possível
      timeInShift: runningTime / 3600, // Converter segundos para horas
      totalShiftTime: totalTime / 3600, // Converter segundos para horas
      avgSpeed: throughput, // Throughput como velocidade média
      instantSpeed: throughput, // Usar throughput como velocidade instantânea
    };
  }

  // Converter WbmsLiveDataResponse para CurrentJob (dados limitados da API WBMS)
  convertToCurrentJob(data: WbmsLiveDataResponse): CurrentJob | null {
    // A API WBMS não fornece informações de job diretamente
    // Retornar null para usar dados do sistema principal
    return null;
  }

  // Converter WbmsLiveDataResponse para ProductionLine
  convertToProductionLine(data: WbmsLiveDataResponse): ProductionLine | null {
    return {
      id: `wbms-${data.eSerie}`,
      name: data.eNome,
      code: data.eSerie,
      description: `${data.eNome} - WBMS Equipment`,
      isActive: true,
    };
  }

  // Determinar status da máquina baseado nos dados WBMS
  getMachineStatus(data: WbmsLiveDataResponse): 'RUNNING' | 'DOWN' | 'PAUSED' | 'SETUP' {
    const stoppedStatus = parseInt(this.getParameterValue(data, 'StoppedStatus')) || 0;
    const runningTime = parseInt(this.getParameterValue(data, 'RunningTime')) || 0;
    const stoppedTime = parseInt(this.getParameterValue(data, 'StoppedTime')) || 0;

    if (stoppedStatus === 1) {
      return 'DOWN';
    } else if (runningTime > 0 && stoppedTime === 0) {
      return 'RUNNING';
    } else if (stoppedTime > 0) {
      return 'PAUSED';
    } else {
      return 'SETUP';
    }
  }

  // Obter equipamento padrão (para desenvolvimento)
  async getDefaultEquipment(): Promise<string> {
    try {
      const equipments = await this.getEquipments();
      if (equipments.equip && equipments.equip.length > 0) {
        return equipments.equip[0].eNome;
      }
      return 'Rivets_PH6601'; // Fallback
    } catch (error) {
      console.warn('⚠️ Erro ao buscar equipamentos, usando padrão:', error);
      return 'Rivets_PH6601'; // Fallback
    }
  }
}

export default WbmsService; 