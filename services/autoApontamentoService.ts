import ApiClient from './api';

// Interfaces baseadas na documentação da API
interface AutoApontamentoStatus {
  success: boolean;
  client_line_key: string;
  has_active_production: boolean;
  needs_setup: boolean;
}

interface AutoApontamentoDevice {
  line: {
    client_line_key: string;
    line_name: string;
    plant: string;
    sector: string;
  };
  device: {
    device_id: number;
    asset_id: string;
    status: string;
    current_count: number;
  };
  current_shift: {
    shift_number_key: number;
    shift_id: string;
    start_time: string;
    end_time: string;
    total_good_count: number;
    run_time: number;
    oee: number;
    has_product: boolean;
  };
}

interface AutoApontamentoAllResponse {
  success: boolean;
  summary: {
    total_devices: number;
    active_devices: number;
    processing_enabled: boolean;
  };
  devices: AutoApontamentoDevice[];
}

interface AutoApontamentoLineResponse {
  success: boolean;
  data: AutoApontamentoDevice;
}

// Nova interface para a resposta da API de auto-apontamento em tempo real
interface AutoApontamentoRealTimeResponse {
  success: boolean;
  timestamp: any[];
  data: {
    line: {
      client_line_key: string;
      line_name: string;
      plant: string;
      sector: string;
    };
    device: {
      device_id: number;
      asset_id: string;
      status: string;
      current_count: number;
      last_communication: any[];
      last_change: any[];
    };
    current_shift: {
      shift_number_key: number;
      shift_id: string;
      start_time: string;
      end_time: string;
      total_good_count: number;
      run_time: number;
      oee: number;
      has_product: boolean;
    };
  };
}

interface AutoApontamentoProduct {
  product_key: number;
  product: string;
}

interface AutoApontamentoProductsResponse {
  success: boolean;
  client_line_key: string;
  products: AutoApontamentoProduct[];
}

interface StartProductionRequest {
  product_key: string;
  shift_id: string;
}

interface StartProductionResponse {
  success: boolean;
  message: string;
  shift: {
    shift_number_key: number;
    shift_id: string;
    part_id: string;
    total_count: number;
  };
}

interface StopProductionResponse {
  success: boolean;
  message: string;
  shift: {
    shift_number_key: number;
    total_count: number;
    good_count: number;
    oee: number;
  };
}

interface StopProductionWithReasonRequest {
  reason: string;
  reasonId?: string;
}

interface StopProductionWithReasonResponse {
  success: boolean;
  message: string;
  shift?: {
    shift_number_key: number;
    total_count: number;
    good_count: number;
    oee: number;
  };
}

interface ProductDetails {
  product_key: number;
  company: string;
  plant: string;
  sector: string;
  line: string;
  product: string;
  internal_code: string;
  semi_finished: number;
  measurement_unit: string;
  nominal_qty_max: number;
  time_unit: string;
  measurement_per_package: number | null;
  units_per_package: number;
  ideal_weight: number | null;
  unit_weight: number | null;
  min_weight: number | null;
  max_weight: number | null;
  client_line_key: number;
  sector_key: number;
  plant_key: number;
  company_key: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  measurement_unit_secondary: string | null;
}

interface ProductionData {
  target: number;
  actual: number;
  completion: number;
  goodParts: number;
  goodPartsPercent: number;
  productDetails?: ProductDetails;
}

class AutoApontamentoService {
  private api: ApiClient;
  
  // Configurações de produção
  private readonly ESTIMATED_PRODUCTION_RATE = 100; // Peças por hora (configurável)
  private readonly MIN_TARGET_MULTIPLIER = 1.2; // 20% a mais que o atual
  private readonly MIN_TARGET_VALUE = 100; // Valor mínimo para target

  constructor() {
    this.api = new ApiClient();
  }

  /**
   * Consultar todos os dispositivos
   */
  async getAllDevices(): Promise<AutoApontamentoAllResponse> {
    try {
      const response = await this.api.get<AutoApontamentoAllResponse>('/wbms/auto-apontamento/all');
      return response;
    } catch (error) {
      console.error('❌ Erro ao consultar todos os dispositivos:', error);
      throw error;
    }
  }

  /**
   * Consultar linha específica
   */
  async getLineData(clientLineKey: string): Promise<AutoApontamentoLineResponse> {
    try {
      const response = await this.api.get<AutoApontamentoLineResponse>(`/wbms/auto-apontamento/${clientLineKey}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao consultar linha específica:', error);
      throw error;
    }
  }

  /**
   * Consultar dados em tempo real da linha
   */
  async getRealTimeData(clientLineKey: string): Promise<AutoApontamentoRealTimeResponse> {
    try {
      const response = await this.api.get<AutoApontamentoRealTimeResponse>(`/wbms/auto-apontamento/${clientLineKey}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao consultar dados em tempo real:', error);
      throw error;
    }
  }

  /**
   * Verificar status da linha
   */
  async getLineStatus(clientLineKey: string): Promise<AutoApontamentoStatus> {
    try {
      const response = await this.api.get<AutoApontamentoStatus>(`/wbms/auto-apontamento/${clientLineKey}/status`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao verificar status da linha:', error);
      throw error;
    }
  }

  /**
   * Listar produtos da linha
   */
  async getLineProducts(clientLineKey: string): Promise<AutoApontamentoProductsResponse> {
    try {
      const response = await this.api.get<AutoApontamentoProductsResponse>(`/wbms/auto-apontamento/${clientLineKey}/products`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao listar produtos da linha:', error);
      throw error;
    }
  }

  /**
   * Iniciar produção
   */
  async startProduction(clientLineKey: string, productKey: string, shiftId: string = 'TURNO_1'): Promise<StartProductionResponse> {
    try {
      const requestData: StartProductionRequest = {
        product_key: productKey,
        shift_id: shiftId
      };

      const response = await this.api.post<StartProductionResponse>(`/wbms/auto-apontamento/${clientLineKey}/start-production`, requestData);
      return response;
    } catch (error) {
      console.error('❌ Erro ao iniciar produção:', error);
      throw error;
    }
  }

  /**
   * Parar produção
   */
  async stopProduction(clientLineKey: string): Promise<StopProductionResponse> {
    try {
      const response = await this.api.post<StopProductionResponse>(`/wbms/auto-apontamento/${clientLineKey}/stop-production`, {});
      return response;
    } catch (error) {
      console.error('❌ Erro ao parar produção:', error);
      throw error;
    }
  }

  /**
   * Parar produção com motivo específico
   */
  async stopProductionWithReason(clientLineKey: string, reason: string, reasonId?: string): Promise<StopProductionWithReasonResponse> {
    try {
      const requestData: StopProductionWithReasonRequest = {
        reason,
        reasonId
      };

      const response = await this.api.post<StopProductionWithReasonResponse>(`/wbms/auto-apontamento/${clientLineKey}/stop-production`, requestData);
      return response;
    } catch (error) {
      console.error('❌ Erro ao parar produção com motivo:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes do produto
   */
  async getProductDetails(productId: string): Promise<ProductDetails> {
    try {
      const response = await this.api.get<ProductDetails>(`/pegar-produto-por-id?product_id=${productId}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter detalhes do produto:', error);
      throw error;
    }
  }

  /**
   * Obter dados de produção em tempo real
   */
  async getProductionData(clientLineKey: string, productId?: string): Promise<ProductionData> {
    try {
      // Buscar dados em tempo real da linha
      const realTimeData = await this.getRealTimeData(clientLineKey);
      
      if (!realTimeData.success || !realTimeData.data) {
        throw new Error('Dados da linha não disponíveis');
      }

      const { device, current_shift } = realTimeData.data;
      
      // Buscar detalhes do produto se houver produção ativa
      let productDetails: ProductDetails | undefined;
      let target = 0;
      
      if (current_shift.has_product && productId) {
        try {
          // Buscar detalhes do produto usando o productId fornecido
          productDetails = await this.getProductDetails(productId);
          target = productDetails.nominal_qty_max;
          
          console.log('✅ Target obtido do produto:', {
            productId,
            productName: productDetails.product,
            nominal_qty_max: productDetails.nominal_qty_max
          });
        } catch (error) {
          console.warn('⚠️ Não foi possível obter detalhes do produto, calculando target baseado no tempo de execução');
          const runTimeHours = current_shift.run_time / 3600;
          const estimatedRate = this.ESTIMATED_PRODUCTION_RATE;
          target = Math.round(runTimeHours * estimatedRate);
          if (target <= 0) {
            target = Math.max(current_shift.total_good_count * this.MIN_TARGET_MULTIPLIER, this.MIN_TARGET_VALUE);
          }
        }
      } else if (current_shift.has_product && !productId) {
        // Se há produto mas não temos o ID, usar cálculo baseado no tempo
        console.warn('⚠️ Produto ativo mas ID não fornecido, calculando target baseado no tempo de execução');
        const runTimeHours = current_shift.run_time / 3600;
        const estimatedRate = this.ESTIMATED_PRODUCTION_RATE;
        target = Math.round(runTimeHours * estimatedRate);
        if (target <= 0) {
          target = Math.max(current_shift.total_good_count * this.MIN_TARGET_MULTIPLIER, this.MIN_TARGET_VALUE);
        }
      }

      const actual = device.current_count;
      const completion = target > 0 ? Math.round((actual / target) * 100) : 0;
      const goodParts = current_shift.total_good_count;
      const goodPartsPercent = actual > 0 ? Math.round((goodParts / actual) * 100) : 100;

      const productionData: ProductionData = {
        target,
        actual,
        completion,
        goodParts,
        goodPartsPercent,
        productDetails
      };

      return productionData;
    } catch (error) {
      console.error('❌ Erro ao obter dados de produção:', error);
      // Retornar dados vazios em caso de erro
      return {
        target: 0,
        actual: 0,
        completion: 0,
        goodParts: 0,
        goodPartsPercent: 100
      };
    }
  }

  /**
   * Obter status do dispositivo em tempo real
   */
  async getDeviceStatus(clientLineKey: string): Promise<{ status: string; assetId: string; deviceId: number }> {
    try {
      const realTimeData = await this.getRealTimeData(clientLineKey);
      
      if (!realTimeData.success || !realTimeData.data) {
        throw new Error('Dados da linha não disponíveis');
      }

      const { device } = realTimeData.data;
      
      return {
        status: device.status,
        assetId: device.asset_id,
        deviceId: device.device_id
      };
    } catch (error) {
      console.error('❌ Erro ao obter status do dispositivo:', error);
      // Retornar status padrão em caso de erro
      return {
        status: 'stopped',
        assetId: '',
        deviceId: 0
      };
    }
  }

  /**
   * Verificar se linha precisa de setup
   */
  async checkSetupNeeded(clientLineKey: string): Promise<boolean> {
    try {
      const status = await this.getLineStatus(clientLineKey);
      return status.needs_setup;
    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de setup:', error);
      return true; // Em caso de erro, assumir que precisa de setup
    }
  }

  /**
   * Verificar se há produção ativa
   */
  async hasActiveProduction(clientLineKey: string): Promise<boolean> {
    try {
      const status = await this.getLineStatus(clientLineKey);
      return status.has_active_production;
    } catch (error) {
      console.error('❌ Erro ao verificar produção ativa:', error);
      return false; // Em caso de erro, assumir que não há produção ativa
    }
  }
}

export default new AutoApontamentoService(); 