import ApiClient from './api';
import { Job, ApiProduct, ApiShift, ProductFilter } from '../types';

class JobsService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Lista todos os turnos disponíveis
   */
  async getShifts(): Promise<ApiShift[]> {
    try {
      const response = await this.apiClient.get<ApiShift[]>('/workshifts');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar turnos:', error);
      throw new Error(`Falha ao carregar turnos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista jobs de um turno específico
   */
  async getJobsByShift(shiftNumberKey: string): Promise<Job[]> {
    try {
      const response = await this.apiClient.get<Job[]>(`/jobs?shift_number_key=${shiftNumberKey}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar jobs do turno:', error);
      throw new Error(`Falha ao carregar jobs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista produtos disponíveis
   */
  async getProducts(): Promise<ApiProduct[]> {
    try {
      const response = await this.apiClient.get<ApiProduct[]>('/products');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw new Error(`Falha ao carregar produtos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista produtos filtrados por planta, setor e linha
   */
  async getFilteredProducts(filter: ProductFilter): Promise<ApiProduct[]> {
    try {
      const response = await this.apiClient.post<ApiProduct[]>('/products', filter);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos filtrados:', error);
      throw new Error(`Falha ao carregar produtos filtrados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca produtos relacionados a um job específico
   */
  async getProductsForJob(job: Job): Promise<ApiProduct[]> {
    const filter: ProductFilter = {
      plantas: [job.plant],
      setores: job.sector ? [job.sector] : [],
      linhas: job.asset_id ? [job.asset_id] : [],
      useIds: true
    };
    
    return this.getFilteredProducts(filter);
  }

  /**
   * Cria um novo job
   */
  async createJob(jobData: {
    shift_number_key: string;
    part_id: string;
    start_time: string;
    end_time: string;
    good_count: number;
    total_count: number;
    reject_count: number;
  }): Promise<Job> {
    try {
      const response = await this.apiClient.post<Job>('/jobs', jobData);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar job:', error);
      throw new Error(`Falha ao criar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualiza um job existente
   */
  async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job> {
    try {
      const response = await this.apiClient.patch<Job>(`/jobs/${jobId}`, jobData);
      return response;
    } catch (error) {
      console.error('❌ Erro ao atualizar job:', error);
      throw new Error(`Falha ao atualizar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Finaliza um job
   */
  async finishJob(jobId: string, endTime: string): Promise<Job> {
    try {
      const response = await this.apiClient.patch<Job>(`/jobs/${jobId}`, {
        end_time: endTime,
        is_finished: true
      });
      return response;
    } catch (error) {
      console.error('❌ Erro ao finalizar job:', error);
      throw new Error(`Falha ao finalizar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca jobs ativos (não finalizados)
   */
  async getActiveJobs(): Promise<Job[]> {
    try {
      const response = await this.apiClient.get<Job[]>('/jobs?is_finished=false');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar jobs ativos:', error);
      throw new Error(`Falha ao carregar jobs ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca jobs por período
   */
  async getJobsByPeriod(startDate: string, endDate: string): Promise<Job[]> {
    try {
      const response = await this.apiClient.get<Job[]>(`/jobs?start_date=${startDate}&end_date=${endDate}`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar jobs por período:', error);
      throw new Error(`Falha ao carregar jobs por período: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca estatísticas de jobs
   */
  async getJobStatistics(shiftNumberKey?: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    totalProduction: number;
    totalRejects: number;
    averageOEE: number;
  }> {
    try {
      const endpoint = shiftNumberKey 
        ? `/jobs/statistics?shift_number_key=${shiftNumberKey}`
        : '/jobs/statistics';
      
      const response = await this.apiClient.get<{
        totalJobs: number;
        completedJobs: number;
        activeJobs: number;
        totalProduction: number;
        totalRejects: number;
        averageOEE: number;
      }>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de jobs:', error);
      throw new Error(`Falha ao carregar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export default JobsService; 