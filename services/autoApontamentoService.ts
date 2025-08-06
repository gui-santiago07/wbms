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
  async getProductionData(clientLineKey: string): Promise<ProductionData> {
    try {
      // Buscar dados da linha
      const lineData = await this.getLineData(clientLineKey);
      
      if (!lineData.success || !lineData.data) {
        throw new Error('Dados da linha não disponíveis');
      }

      const { device, current_shift } = lineData.data;
      
      // Buscar detalhes do produto se houver produção ativa
      let productDetails: ProductDetails | undefined;
      let target = 0;
      
      if (current_shift.has_product) {
        try {
          // Tentar obter detalhes do produto (pode não estar disponível)
          // productDetails = await this.getProductDetails(current_shift.shift_number_key.toString());
          // target = productDetails.nominal_qty_max;
          target = 1000; // Valor padrão por enquanto
        } catch (error) {
          console.warn('⚠️ Não foi possível obter detalhes do produto, usando valores padrão');
          target = 1000; // Valor padrão
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