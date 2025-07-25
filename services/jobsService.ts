import ApiClient from './api';
import { Job, ApiProduct, ApiShift, ProductFilter } from '../types';

// Dados mock para desenvolvimento/fallback
const MOCK_SHIFTS: ApiShift[] = [
  {
    shift_number_key: 'SHIFT001',
    shift_name: 'Turno Manhã',
    start_time: '06:00:00',
    end_time: '14:00:00',
    is_active: true
  },
  {
    shift_number_key: 'SHIFT002', 
    shift_name: 'Turno Tarde',
    start_time: '14:00:00',
    end_time: '22:00:00',
    is_active: false
  },
  {
    shift_number_key: 'SHIFT003',
    shift_name: 'Turno Noite', 
    start_time: '22:00:00',
    end_time: '06:00:00',
    is_active: false
  }
];

const MOCK_JOBS: Job[] = [
  {
    job_number_key: 1001,
    shift_number_key: 'SHIFT001',
    part_id: 'PROD001',
    start_time: '2024-01-15 06:00:00',
    end_time: '2024-01-15 14:00:00',
    total_count: 1000,
    good_count: 980,
    reject_count: 20,
    asset_id: 'LINE001',
    sector: 'SETOR_A',
    plant: 'PLANTA_1'
  },
  {
    job_number_key: 1002,
    shift_number_key: 'SHIFT001',
    part_id: 'PROD002',
    start_time: '2024-01-15 06:00:00',
    end_time: '2024-01-15 14:00:00',
    total_count: 500,
    good_count: 485,
    reject_count: 15,
    asset_id: 'LINE001',
    sector: 'SETOR_A',
    plant: 'PLANTA_1'
  },
  {
    job_number_key: 1003,
    shift_number_key: 'SHIFT001',
    part_id: 'PROD003',
    start_time: '2024-01-15 06:00:00',
    end_time: '2024-01-15 14:00:00',
    total_count: 750,
    good_count: 720,
    reject_count: 30,
    asset_id: 'LINE002',
    sector: 'SETOR_B',
    plant: 'PLANTA_1'
  }
];

const MOCK_PRODUCTS: ApiProduct[] = [
  {
    product_key: 'PROD001',
    product: 'Componente Eletrônico A',
    internal_code: 'SKU001',
    units_per_package: 50,
    client_line_key: 'LINE001'
  },
  {
    product_key: 'PROD002', 
    product: 'Resistor 220Ω',
    internal_code: 'SKU002',
    units_per_package: 100,
    client_line_key: 'LINE001'
  },
  {
    product_key: 'PROD003',
    product: 'Capacitor 100μF',
    internal_code: 'SKU003', 
    units_per_package: 25,
    client_line_key: 'LINE002'
  }
];

class JobsService {
  private apiClient: ApiClient;
  private useMockData: boolean = false;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Lista todos os turnos disponíveis
   */
  async getShifts(): Promise<ApiShift[]> {
    try {
      const response = await this.apiClient.get<ApiShift[]>('/listar-turnos');
      this.useMockData = false;
      return response;
    } catch (error) {
      console.warn('🔄 API não disponível, usando dados mock para turnos');
      this.useMockData = true;
      return MOCK_SHIFTS;
    }
  }

  /**
   * Lista jobs por turno
   */
  async getJobsByShift(shiftNumberKey: string): Promise<Job[]> {
    try {
      if (this.useMockData) {
        console.log('📦 Usando dados mock para jobs do turno:', shiftNumberKey);
        return MOCK_JOBS.filter(job => job.shift_number_key === shiftNumberKey);
      }
      
      const response = await this.apiClient.get<Job[]>(`/jobs/${shiftNumberKey}`);
      return response;
    } catch (error) {
      console.warn('🔄 API não disponível, usando dados mock para jobs');
      return MOCK_JOBS.filter(job => job.shift_number_key === shiftNumberKey);
    }
  }

  /**
   * Lista produtos disponíveis
   */
  async getProducts(): Promise<ApiProduct[]> {
    try {
      if (this.useMockData) {
        console.log('📦 Usando dados mock para produtos');
        return MOCK_PRODUCTS;
      }
      
      const response = await this.apiClient.get<ApiProduct[]>('/products');
      return response;
    } catch (error) {
      console.warn('🔄 API não disponível, usando dados mock para produtos');
      return MOCK_PRODUCTS;
    }
  }

  /**
   * Lista produtos filtrados por planta, setor e linha
   */
  async getFilteredProducts(filter: ProductFilter): Promise<ApiProduct[]> {
    try {
      if (this.useMockData) {
        console.log('📦 Usando dados mock para produtos filtrados:', filter);
        // Simular filtro nos dados mock
        return MOCK_PRODUCTS.filter(product => {
          // Buscar job relacionado para aplicar filtros
          const relatedJob = MOCK_JOBS.find(job => job.part_id === product.product_key);
          if (!relatedJob) return false;
          
          const matchesPlant = filter.plantas.length === 0 || filter.plantas.includes(relatedJob.plant);
          const matchesSector = filter.setores.length === 0 || filter.setores.includes(relatedJob.sector);
          const matchesLine = filter.linhas.length === 0 || filter.linhas.includes(relatedJob.asset_id);
          
          return matchesPlant && matchesSector && matchesLine;
        });
      }
      
      const response = await this.apiClient.post<ApiProduct[]>('/products', filter);
      return response;
    } catch (error) {
      console.warn('🔄 API não disponível, usando dados mock para produtos filtrados');
      // Simular filtro nos dados mock
      return MOCK_PRODUCTS.filter(product => {
        const relatedJob = MOCK_JOBS.find(job => job.part_id === product.product_key);
        if (!relatedJob) return false;
        
        const matchesPlant = filter.plantas.length === 0 || filter.plantas.includes(relatedJob.plant);
        const matchesSector = filter.setores.length === 0 || filter.setores.includes(relatedJob.sector); 
        const matchesLine = filter.linhas.length === 0 || filter.linhas.includes(relatedJob.asset_id);
        
        return matchesPlant && matchesSector && matchesLine;
      });
    }
  }

  /**
   * Busca produtos relacionados a um job específico
   */
  async getProductsForJob(job: Job): Promise<ApiProduct[]> {
    const filter: ProductFilter = {
      plantas: [job.plant],
      setores: [job.sector],
      linhas: [job.asset_id],
      useIds: true
    };

    return this.getFilteredProducts(filter);
  }

  /**
   * Busca produto específico por part_id
   */
  async getProductByPartId(partId: string): Promise<ApiProduct | null> {
    try {
      const products = await this.getProducts();
      return products.find(p => p.product_key === partId) || null;
    } catch (error) {
      console.error('Erro ao buscar produto por part_id:', error);
      return null;
    }
  }

  /**
   * Converte Job da API para ProductionOrder usado na interface
   */
  convertJobToProductionOrder(job: Job, product?: ApiProduct): {
    id: string;
    name: string;
    product: string;
    quantity: number;
    dueDate: string;
  } {
    const startDate = new Date(job.start_time);
    const endDate = new Date(job.end_time);
    
    return {
      id: job.job_number_key.toString(),
      name: `Job ${job.job_number_key}`,
      product: product?.product || job.part_id,
      quantity: job.total_count,
      dueDate: endDate.toLocaleDateString('pt-BR')
    };
  }

  /**
   * Converte Job da API para CurrentJob usado na store
   */
  convertJobToCurrentJob(job: Job, product?: ApiProduct): {
    orderId: string;
    orderQuantity: number;
    productId: string;
    productName: string;
  } {
    return {
      orderId: job.job_number_key.toString(),
      orderQuantity: job.total_count,
      productId: job.part_id,
      productName: product?.product || job.part_id
    };
  }

  /**
   * Busca turno ativo atual
   */
  async getCurrentShift(): Promise<ApiShift | null> {
    try {
      const shifts = await this.getShifts();
      return shifts.find(shift => shift.is_active) || shifts[0] || null;
    } catch (error) {
      console.error('Erro ao buscar turno atual:', error);
      return null;
    }
  }

  /**
   * Busca jobs do turno atual
   */
  async getCurrentShiftJobs(): Promise<Job[]> {
    try {
      const currentShift = await this.getCurrentShift();
      if (!currentShift) {
        console.warn('⚠️ Nenhum turno ativo encontrado, usando dados mock');
        return MOCK_JOBS;
      }
      
      return this.getJobsByShift(currentShift.shift_number_key);
    } catch (error) {
      console.error('Erro ao buscar jobs do turno atual:', error);
      console.log('🔄 Usando dados mock como fallback');
      return MOCK_JOBS;
    }
  }

  /**
   * Verifica se está usando dados mock
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Força uso de dados mock (útil para desenvolvimento)
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
    if (useMock) {
      console.log('🧪 Modo de desenvolvimento: usando dados mock');
    }
  }
}

export default JobsService; 