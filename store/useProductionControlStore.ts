import { create } from 'zustand';
import { 
  ProductionControlState, 
  Timesheet, 
  ProductionLine, 
  Product, 
  ProductionStatus,
  StartProductionData,
  StopProductionData 
} from '../types';
import productionService from '../services/productionService';
import { pollingManager } from '../services/api';

interface ProductionControlActions {
  // Ações de verificação
  checkActiveProduction: () => Promise<void>;
  
  // Ações de carregamento
  loadAvailableLines: (setores?: string[]) => Promise<void>;
  loadAvailableProducts: () => Promise<void>;
  
  // Ações de controle
  startSetup: (data: StartProductionData) => Promise<void>;
  startProduction: (description?: string) => Promise<void>;
  stopProduction: (data: StopProductionData) => Promise<void>;
  pauseProduction: (reason?: string) => Promise<void>;
  resumeProduction: () => Promise<void>;
  
  // Ações de monitoramento
  startPolling: () => void;
  stopPolling: () => void;
  updateProductionStatus: () => Promise<void>;
  
  // Ações de estado
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

interface ProductionControlStore extends ProductionControlState, ProductionControlActions {}

const initialState: ProductionControlState = {
  currentTimesheet: null,
  availableLines: [],
  availableProducts: [],
  productionStatus: null,
  isLoading: false,
  error: null,
  isPolling: false,
};

export const useProductionControlStore = create<ProductionControlStore>((set, get) => ({
  ...initialState,

  // Verificar produção ativa
  checkActiveProduction: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const activeProduction = await productionService.checkActiveProduction();
      
      if (activeProduction.length > 0) {
        const currentTimesheet = activeProduction[0]; // Pega o primeiro turno ativo
        set({ 
          currentTimesheet,
          isLoading: false 
        });
        
        // Inicia polling automaticamente se há produção ativa
        get().startPolling();
      } else {
        set({ 
          currentTimesheet: null,
          productionStatus: null,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao verificar produção ativa',
        isLoading: false 
      });
    }
  },

  // Carregar linhas disponíveis
  loadAvailableLines: async (setores?: string[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const lines = await productionService.getAvailableLines(setores);
      set({ availableLines: lines, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar linhas disponíveis',
        isLoading: false 
      });
    }
  },

  // Carregar produtos disponíveis
  loadAvailableProducts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const products = await productionService.getAvailableProducts();
      set({ availableProducts: products, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar produtos disponíveis',
        isLoading: false 
      });
    }
  },

  // Iniciar setup
  startSetup: async (data: StartProductionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { timesheet } = await productionService.startSetup(data);
      set({ 
        currentTimesheet: timesheet,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao iniciar setup',
        isLoading: false 
      });
    }
  },

  // Iniciar produção
  startProduction: async (description?: string) => {
    const { currentTimesheet } = get();
    if (!currentTimesheet) {
      set({ error: 'Nenhum turno ativo encontrado' });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      await productionService.startProduction(currentTimesheet.id, description);
      set({ isLoading: false });
      
      // Atualiza status imediatamente após iniciar
      get().updateProductionStatus();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao iniciar produção',
        isLoading: false 
      });
    }
  },

  // Parar produção
  stopProduction: async (data: StopProductionData) => {
    const { currentTimesheet } = get();
    if (!currentTimesheet) {
      set({ error: 'Nenhum turno ativo encontrado' });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const { timesheet } = await productionService.stopProduction(currentTimesheet.id, data);
      set({ 
        currentTimesheet: timesheet,
        productionStatus: null,
        isLoading: false 
      });
      
      // Para o polling quando a produção é finalizada
      get().stopPolling();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao parar produção',
        isLoading: false 
      });
    }
  },

  // Pausar produção
  pauseProduction: async (reason?: string) => {
    const { currentTimesheet } = get();
    if (!currentTimesheet) {
      set({ error: 'Nenhum turno ativo encontrado' });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      await productionService.pauseProduction(currentTimesheet.id, reason);
      set({ isLoading: false });
      
      // Atualiza status imediatamente
      get().updateProductionStatus();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao pausar produção',
        isLoading: false 
      });
    }
  },

  // Retomar produção
  resumeProduction: async () => {
    const { currentTimesheet } = get();
    if (!currentTimesheet) {
      set({ error: 'Nenhum turno ativo encontrado' });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      await productionService.resumeProduction(currentTimesheet.id);
      set({ isLoading: false });
      
      // Atualiza status imediatamente
      get().updateProductionStatus();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao retomar produção',
        isLoading: false 
      });
    }
  },

  // Iniciar polling
  startPolling: () => {
    const { currentTimesheet, isPolling } = get();
    
    if (!currentTimesheet || isPolling) return;
    
    set({ isPolling: true });
    
    // Primeira atualização imediata
    get().updateProductionStatus();
    
    // Polling a cada 30 segundos
    const intervalId = setInterval(() => {
      const { currentTimesheet: current } = get();
      if (current) {
        get().updateProductionStatus();
      } else {
        get().stopPolling();
      }
    }, 30000);
    
    // Registrar intervalo no sistema centralizado
    pollingManager.registerInterval(intervalId);
    
    // Armazena o ID do intervalo para limpeza posterior
    (window as any).productionPollingInterval = intervalId;
  },

  // Parar polling
  stopPolling: () => {
    set({ isPolling: false });
    
    const intervalId = (window as any).productionPollingInterval;
    if (intervalId) {
      clearInterval(intervalId);
      pollingManager.unregisterInterval(intervalId);
      (window as any).productionPollingInterval = null;
    }
  },

  // Atualizar status da produção
  updateProductionStatus: async () => {
    const { currentTimesheet } = get();
    if (!currentTimesheet) return;
    
    try {
      const status = await productionService.getProductionStatus(currentTimesheet.id);
      set({ productionStatus: status });
    } catch (error) {
      console.error('Erro ao atualizar status da produção:', error);
      // Não define erro aqui para não interromper o polling
    }
  },

  // Definir erro
  setError: (error: string | null) => {
    set({ error });
  },

  // Limpar erro
  clearError: () => {
    set({ error: null });
  },

  // Resetar estado
  reset: () => {
    get().stopPolling();
    set(initialState);
  },
})); 