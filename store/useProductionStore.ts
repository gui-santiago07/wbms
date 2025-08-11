
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MachineStatus, ViewState, LiveMetrics, CurrentJob, DowntimeEvent, DowntimeReasonCategory, ProductionOrder, Product, ProductionLine, TimeDistribution, StopReason, ProductionStatus, ProductSelection, SetupType, Job } from '../types';
import DashboardService from '../services/dashboardService';
import ShiftService from '../services/shiftService';
import WbmsService from '../services/wbmsService';
import Option7ApiService from '../services/option7ApiService';
import JobsService from '../services/jobsService';
import TimesheetService from '../services/timesheetService';
import AutomaticProductionService from '../services/automaticProductionService';
import AutoApontamentoService from '../services/autoApontamentoService';
import { useDeviceSettingsStore } from './useDeviceSettingsStore';
import { clearInvalidData } from '../utils/clearInvalidData';
import ShiftsService from '../services/shiftsService';

// Tipo local para turno usado no store
type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  shiftNumberKey?: string | number;
};

// Função utilitária para validar e corrigir clientLineKey
const validateAndFixClientLineKey = async (clientLineKey: string): Promise<string | null> => {
  const normalizedKey = String(clientLineKey || '').trim();

  // Considerar inválido apenas vazio, 'undefined' ou 'null'
  if (!normalizedKey || normalizedKey === 'undefined' || normalizedKey === 'null') {
    console.warn('⚠️ clientLineKey inválido detectado:', clientLineKey);

    // Tentar obter o clientLineKey correto do localStorage
    const cachedSetupData = localStorage.getItem('setup_data');
    if (cachedSetupData) {
      try {
        const setupData = JSON.parse(cachedSetupData);
        if (setupData.line && String(setupData.line).trim()) {
          console.log('🔄 Usando clientLineKey do cache:', setupData.line);
          return String(setupData.line).trim();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar setupData do cache:', error);
      }
    }

    // Se ainda não temos um clientLineKey válido, buscar da API
    console.log('🔄 Buscando dispositivos disponíveis...');
    try {
      const allDevices = await AutoApontamentoService.getAllDevices();
      if (allDevices.success && allDevices.devices.length > 0) {
        const device = allDevices.devices[0];
        const validClientLineKey = String(device.line.client_line_key).trim();
        console.log('✅ Usando primeiro dispositivo disponível:', validClientLineKey);
        return validClientLineKey;
      } else {
        console.error('❌ Nenhum dispositivo disponível');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dispositivos:', error);
      return null;
    }
  }

  return normalizedKey;
};



interface ProductionState {
  machineStatus: MachineStatus;
  view: ViewState;
  previousView: ViewState | null;
  liveMetrics: LiveMetrics;
  currentJob: CurrentJob | null;
  downtimeHistory: DowntimeEvent[];
  downtimeReasons: DowntimeReasonCategory[];
  pauseReasons: DowntimeReasonCategory[];
  productionOrders: ProductionOrder[];
  products: Product[];
  currentDowntimeEventId: string | null;
  productionLines: ProductionLine[];
  currentProductionLine: ProductionLine | null;
  // Turnos
  shifts: Shift[];
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;
  dashboardService: DashboardService;
  shiftService: ShiftService;
  wbmsService: WbmsService;
  option7ApiService: Option7ApiService;
  jobsService: JobsService;
  timesheetService: TimesheetService;
  automaticProductionService: typeof AutomaticProductionService;
  // Ações de registro de motivos
  registerStopReasonWithAutoApontamento: (reason: string, reasonId?: string) => Promise<void>;
  registerStandbyReasonWithOption7: (reason: string, reasonId?: string) => Promise<void>;
  oeeHistory: {
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  } | null;
  // OEE atual da API local (quando disponível)
  oeeFromStatus?: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  } | null;
  
  // Novas propriedades WBMS
  timeDistribution: TimeDistribution;
  topStopReasons: StopReason[];
  productionStatus: ProductionStatus;
  availableProducts: ProductSelection[];
  setupTypes: SetupType[];
  showProductSelectionModal: boolean;
  
  // Timeline de produção
  timelineEvents: any[];
  timelineLoading: boolean;
  timelineError: string | null;
  currentShiftJobs: any[];
  
  // Novas propriedades para Production Details
  productionDetails: {
    turno: string;
    ordemProducao: string;
    quantidadeOP: number;
    productCode: string;
    productId: string;
    operator: string;
    line: string;
    shiftTarget: number;
  } | null;
  
  // Controle de verificação de turno
  lastShiftCheck: number | null;
  shouldCheckShift: boolean;
  
  // Auto-apontamento
  showSetupModal: boolean;
  setupData: {
    plant: string;
    sector: string;
    line: string;
    product: string;
    productKey: string;
  } | null;
  // shift_number_key retornado ao iniciar produção (API local)
  wbmsShiftNumberKey?: number | null;
  productionData: {
    target: number;
    actual: number;
    completion: number;
    goodParts: number;
    goodPartsPercent: number;
  };
  
  // Produto selecionado
  selectedProduct: ProductSelection | null;
  
  // Status do dispositivo
  deviceStatus: {
    status: string;
    assetId: string;
    deviceId: number;
    isLoading: boolean;
  };
  
  // Status de produção ativa da API
  apiProductionStatus: {
    hasActiveProduction: boolean;
    isLoading: boolean;
  };
  
  setMachineStatus: (status: MachineStatus) => void;
  setView: (view: ViewState) => void;
  fetchLiveData: () => Promise<void>;
  initializeDashboard: () => Promise<void>;
  fetchOeeHistory: (period: string) => Promise<void>;
  // Buscar status do turno na API local e atualizar OEE/histórico
  loadShiftStatusFromLocalApi: () => Promise<void>;
  registerStopReason: (reason: string, reasonId?: string) => Promise<void>;
  registerEvent: (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => Promise<void>;
  selectProductionOrder: (order: ProductionOrder) => void;
  startSetup: () => void;
  startProduction: () => void;
  setCurrentProductionLine: (line: ProductionLine) => void;
  setCurrentShift: (shift: Shift) => void;
  createProductionLine: (line: Omit<ProductionLine, 'client_line_key'>) => void;
  createShift: (shiftData: Omit<Shift, 'id'>) => void;
  clearError: () => void;
  
  // Novos métodos para API real
  loadRealProductionOrders: () => Promise<void>;
  loadCurrentShiftJobs: () => Promise<void>;
  loadJobProducts: (jobId: string) => Promise<void>;
  // Carregar turnos reais
  loadRealShifts: () => Promise<boolean>;
  
  // Novos métodos WBMS
  fetchTimeDistribution: () => Promise<void>;
  fetchTopStopReasons: () => Promise<void>;
  updateProductionStatus: () => void;
  selectProduct: (productId: string) => void;
  startProductSetup: (setupTypeId: string) => void;
  setShowProductSelectionModal: (show: boolean) => void;
  fetchProductionTimeline: () => Promise<void>;
  fetchDowntimeHistory: () => Promise<void>;
  fetchDashboardComposite: () => Promise<void>;
  fetchStopReasons: () => Promise<void>;
  fetchPauseReasons: () => Promise<void>;
  fetchTimelineData: () => Promise<void>;
  formatTime: (seconds: number) => string;
  loadAvailableProducts: () => Promise<void>;
  
  // Novo método para carregar Production Details
  loadProductionDetails: (shiftId?: string) => Promise<void>;
  
  // Métodos para controle de verificação de turno
  checkShiftIfNeeded: () => Promise<void>;
  markShiftCheckNeeded: () => void;
  
  // Métodos para auto-apontamento
  setShowSetupModal: (show: boolean) => void;
  handleSetupComplete: (setupData: any) => void;
  loadProductionData: () => Promise<void>;
  loadInitialProductionData: (clientLineKey: string) => Promise<void>;
  checkProductionStatus: () => Promise<void>;
  // Cache: carregar dados de produção do cache local
  loadProductionDataFromCache: () => void;
  
  // Métodos para produto selecionado
  setSelectedProduct: (product: ProductSelection | null) => void;
  setSetupData: (setupData: any) => void;
  startProductionSetup: () => Promise<void>;
  
  // Métodos para status do dispositivo
  loadApiProductionStatus: (clientLineKey: string) => Promise<void>;
  loadDeviceStatus: (clientLineKey: string) => Promise<void>;
  
  // Métodos do sistema de cache inteligente
  getCacheStats: () => { cacheSize: number; queueSize: number; isProcessing: boolean };
  clearCache: () => void;
  
}

export const useProductionStore = create<ProductionState>()(
  persist(
    (set, get) => ({
  machineStatus: MachineStatus.RUNNING,
  view: ViewState.DASHBOARD,
  previousView: null,
  liveMetrics: {
    total: 0,
    good: 0,
    rejects: 0,
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 100,
    productionOrderProgress: 0,
    possibleProduction: 0,
    timeInShift: 0,
    totalShiftTime: 0,
    avgSpeed: 0,
    instantSpeed: 0,
  },
  currentJob: null,
  downtimeHistory: [],
  downtimeReasons: [],
  pauseReasons: [],
  productionOrders: [],
  products: [],
  currentDowntimeEventId: null,
  productionLines: [],
  currentProductionLine: null,
  shifts: [],
  currentShift: null,
  isLoading: false,
  error: null,
  dashboardService: new DashboardService(),
  shiftService: new ShiftService(),
  wbmsService: new WbmsService(),
  option7ApiService: new Option7ApiService(),
  jobsService: new JobsService(),
  timesheetService: new TimesheetService(),
  automaticProductionService: AutomaticProductionService,
  oeeHistory: null,
  oeeFromStatus: null,
  
  // Novas propriedades WBMS
  timeDistribution: {
    produced: 0,
    stopped: 0,
    standby: 0,
    setup: 0,
    totalTime: '00:00:00'
  },
  topStopReasons: [],
  productionStatus: {
    status: 'PARADO',
    icon: '⏸️',
    color: '#f59e0b',
    producingTime: '00:00:00',
    producingPercentage: 0,
    stoppedTime: '00:00:00'
  },
  availableProducts: [],
  setupTypes: [],
  showProductSelectionModal: false,
  
  // Timeline de produção
  timelineEvents: [],
  timelineLoading: false,
  timelineError: null,
  currentShiftJobs: [],
  
  // Production Details inicial
  productionDetails: null,
  
  // Controle de verificação de turno
  lastShiftCheck: null,
  shouldCheckShift: true,
  
  // Auto-apontamento
  showSetupModal: false,
  setupData: null,
  productionData: {
    target: 0,
    actual: 0,
    completion: 0,
    goodParts: 0,
    goodPartsPercent: 100
  },
  wbmsShiftNumberKey: null,
  
  // Produto selecionado
  selectedProduct: null,
  
  // Status do dispositivo
  deviceStatus: {
    status: 'aguardando...',
    assetId: '',
    deviceId: 0,
    isLoading: true
  },
  
  // Status de produção ativa da API
  apiProductionStatus: {
    hasActiveProduction: false,
    isLoading: false
  },

    setMachineStatus: (status: MachineStatus) => {
    const currentState = get();
    const previousStatus = currentState.machineStatus;
    
    set({ machineStatus: status });
    
    // Verificar se houve transição para parada (de status ativo para DOWN)
    const isTransitionToDown = status === MachineStatus.DOWN && 
      previousStatus !== MachineStatus.DOWN && 
      [MachineStatus.RUNNING, MachineStatus.PAUSED, MachineStatus.SETUP, MachineStatus.STANDBY].includes(previousStatus);
    
    if (isTransitionToDown) {
      //   previousStatus,
      //   newStatus: status
      // });
      const currentView = currentState.view;
      const newEventId = `evt${Date.now()}`;
      set({ 
        previousView: currentView,
        view: ViewState.STOP_REASON, 
        currentDowntimeEventId: newEventId,
        downtimeHistory: [
          { 
            id: newEventId, 
            operator: 'Operador', 
            startDate: new Date().toISOString().split('T')[0], 
            startTime: new Date().toLocaleTimeString(), 
            endDate: null, 
            endTime: null, 
            totalTime: null, 
            reason: 'Aguardando motivo...' 
          },
          ...currentState.downtimeHistory
        ]
      });
    } else if (status === MachineStatus.STANDBY) {
      set({ view: ViewState.DASHBOARD });
    } else if (status === MachineStatus.RUNNING) {
      const currentView = get().view;
      if (currentView === ViewState.STOP_REASON) {
        // Retorna para a view anterior (DASHBOARD ou OEE)
        const previousView = get().previousView || ViewState.DASHBOARD;
        set({ view: previousView, previousView: null });
      }
    }
  },
  
  setView: (view: ViewState) => {
    const currentView = get().view;
    console.log('🔄 Store: setView chamado - de:', currentView, 'para:', view);
    
    // Garantir que sempre temos uma view válida
    if (!Object.values(ViewState).includes(view)) {
      console.warn('⚠️ View inválida detectada, usando DASHBOARD como fallback');
      view = ViewState.DASHBOARD;
    }
    
    set({ view });
    console.log('✅ Store: View alterada para:', view);
  },

  initializeDashboard: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const deviceSettings = useDeviceSettingsStore.getState().deviceSettings;
      
      if (!deviceSettings.isConfigured || !deviceSettings.lineId) {
        set({ isLoading: false });
        return;
      }

      // 1. Marcar que precisa verificar turno na inicialização
      get().markShiftCheckNeeded();
      
      // 2. Detectar turno atual
      await get().loadRealShifts();
      
      // 3. Carregar Production Details do backend
      await get().loadProductionDetails();
      
      // 4. Carregar dados em tempo real do backend
      await get().fetchLiveData();
      
      // 5. Carregar histórico OEE do backend
      await get().fetchOeeHistory('1h');
      
      set({ isLoading: false });
    } catch (error) {
      console.error('🏪 Store: Erro ao inicializar dashboard com dados do backend (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  fetchLiveData: async () => {
    // Função desabilitada para evitar chamadas ao automaticProductionService
    console.log('🔄 Store: fetchLiveData desabilitada');
    return;
  },

  registerEvent: async (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => {
    const { dashboardService, currentShift } = get();
    
    // Não definir loading para não bloquear a UI
    // set({ isLoading: true, error: null });
    
    try {
      await dashboardService.registerEvent(currentShift, eventType);
      console.log(`✅ Evento ${eventType} registrado com sucesso`);
      // set({ isLoading: false });
    } catch (error) {
      console.warn(`⚠️ Erro ao registrar evento ${eventType} (tratado silenciosamente):`, error);
      // Não definir erro no estado - tratamento silencioso
      // set({ isLoading: false });
      
      // Não fazer re-throw para evitar propagação de erro
      // A funcionalidade deve continuar mesmo sem registro na API
    }
  },

  registerStopReason: async (reason: string, reasonId?: string) => {
    const { dashboardService, currentShift } = get();
    
    // Não definir loading para não bloquear a UI
    // set({ isLoading: true, error: null });
    
    try {
      // Registrar o motivo da parada usando método específico
      await dashboardService.registerStopEvent(currentShift, reason, reasonId);
      console.log(`✅ Motivo da parada registrado com sucesso: ${reason}`);
      
      set(state => {
        const previousView = state.previousView || ViewState.DASHBOARD;
        const updatedHistory = state.downtimeHistory.map(event => 
          event.id === state.currentDowntimeEventId 
            ? { 
                ...event, 
                reason: reasonId ? `${reason} (ID: ${reasonId})` : reason,
                endDate: new Date().toISOString().split('T')[0],
                endTime: new Date().toLocaleTimeString(),
                totalTime: '0' // Será calculado pelo backend
              } 
            : event
        );
        
        return {
          downtimeHistory: updatedHistory,
          currentDowntimeEventId: null, // 🔑 CRÍTICO: Limpa o ID do evento atual
          machineStatus: MachineStatus.RUNNING, // 🔑 CRÍTICO: Define máquina como rodando
          view: previousView, // 🔑 CRÍTICO: Retorna para view anterior
          previousView: null, // 🔑 CRÍTICO: Limpa view anterior
          // isLoading: false,
        };
      });
    } catch (error) {
      console.warn('⚠️ Erro ao registrar motivo da parada (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      // set({ isLoading: false });
      
      // Mesmo com erro, atualizar o estado localmente para manter a funcionalidade
      set(state => {
        const previousView = state.previousView || ViewState.DASHBOARD;
        const updatedHistory = state.downtimeHistory.map(event => 
          event.id === state.currentDowntimeEventId 
            ? { 
                ...event, 
                reason: reasonId ? `${reason} (ID: ${reasonId})` : reason,
                endDate: new Date().toISOString().split('T')[0],
                endTime: new Date().toLocaleTimeString(),
                totalTime: '0' // Será calculado pelo backend
              } 
            : event
        );
        
        return {
          downtimeHistory: updatedHistory,
          currentDowntimeEventId: null,
          machineStatus: MachineStatus.RUNNING,
          view: previousView,
          previousView: null,
          // isLoading: false,
        };
      });
      
      // Não fazer re-throw para evitar propagação de erro
    }
  },

  selectProductionOrder: (order: ProductionOrder) => {
      const product = get().products.find(p => p.description === order.product);
      set({
          currentJob: {
              orderId: order.name.split('-')[1],
              orderQuantity: order.quantity,
              productId: product?.sku || 'N/A',
              productName: product?.description || 'N/A',
          },
      });
  },
  
  startSetup: () => {
      const currentView = get().view;
      set({ machineStatus: MachineStatus.SETUP, showSetupModal: true, previousView: currentView });
  },

  startProduction: () => {
    if (get().currentJob) {
        set({ machineStatus: MachineStatus.RUNNING, view: ViewState.DASHBOARD });
    } else {
        // Maybe show an alert that a job must be selected
        alert("Please select a Production Order or Product first.");
    }
  },

  setCurrentProductionLine: (line: ProductionLine) => {
    set({ currentProductionLine: line });
    // Em um sistema real, isso dispararia uma API call para buscar dados da linha
  },

  setCurrentShift: (shift: Shift) => {
    set({ currentShift: shift });
    
    // Atualizar dados da API com o novo turno selecionado
    const { dashboardService } = get();
    
    // Buscar dados atualizados do turno selecionado
    dashboardService.initializeDashboardData(shift).then(data => {
      set({
        liveMetrics: data.liveMetrics,
        currentJob: data.currentJob,
        currentProductionLine: data.productionLine,
        currentShift: {
          id: data.shift.id.toString(),
          name: data.shift.name,
          startTime: data.shift.startTime,
          endTime: data.shift.endTime,
          isActive: data.shift.isActive,
          shiftNumberKey: data.shift.shiftNumberKey
        },
      });
    }).catch(() => {
      // console.error('❌ Store: Erro ao atualizar dados do turno:', error);
    });
  },

  createProductionLine: (lineData: Omit<ProductionLine, 'client_line_key'>) => {
    const newLine: ProductionLine = {
      ...lineData,
      client_line_key: `line-${Date.now()}`,
    };
    set(state => ({
      productionLines: [...state.productionLines, newLine],
    }));
  },

  createShift: (shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: `shift-${Date.now()}`,
    };
    set(state => ({
      shifts: [...state.shifts, newShift],
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  loadRealShifts: async () => {
    const { deviceSettings } = useDeviceSettingsStore.getState();
    
    set({ isLoading: true, error: null });
    
    try {
      if (!deviceSettings.isConfigured) {
        console.warn('⚠️ Store: Dispositivo não configurado');
        set({ isLoading: false, error: 'Dispositivo não configurado' });
        return false;
      }

      console.log('🔄 Store: Iniciando carregamento de turnos com configurações:', {
        plantId: deviceSettings.plantId,
        sectorId: deviceSettings.sectorId,
        lineId: deviceSettings.lineId
      });

      // Usar o serviço de turnos para carregar dados da API
      const workshifts = await ShiftsService.loadShiftsForInitialSetup(
        deviceSettings.plantId,
        deviceSettings.sectorId,
        deviceSettings.lineId
      );
      
      // Garantir formato de array
      if (!Array.isArray(workshifts)) {
        console.error('❌ Store: Resposta de workshifts não é um array:', workshifts);
        set({ 
          shifts: [],
          currentShift: null,
          isLoading: false, 
          error: 'Formato inesperado ao carregar turnos' 
        });
        return false;
      }
      
      if (!workshifts || workshifts.length === 0) {
        console.error('❌ Store: Nenhum turno carregado da API');
        set({ 
          shifts: [],
          currentShift: null,
          isLoading: false, 
          error: 'Nenhum turno disponível para a configuração selecionada' 
        });
        return false;
      }
      
      // Converter para formato do store com validação
      const realShifts: Shift[] = workshifts.map(workshift => {
        try {
          const converted = ShiftsService.convertToStoreFormat(workshift);
          const shift: Shift = {
            id: converted.id.toString(),
            name: converted.name,
            startTime: converted.startTime,
            endTime: converted.endTime,
            isActive: converted.isActive,
            shiftNumberKey: converted.shiftNumberKey
          };
          return shift;
        } catch (error) {
          console.error('❌ Store: Erro ao converter turno:', error);
          return null as unknown as Shift;
        }
      }).filter(Boolean);
      
      console.log('✅ Store: Turnos convertidos com sucesso:', {
        total: realShifts.length,
        shifts: realShifts.map(s => ({ id: s.id, name: s.name, start: s.startTime, end: s.endTime }))
      });
      
      // Detectar turno atual usando o serviço
      const currentWorkshift = ShiftsService.detectCurrentShift(workshifts);
      let currentShift = null;
      
      if (currentWorkshift) {
        try {
          const converted = ShiftsService.convertToStoreFormat(currentWorkshift);
          currentShift = {
            id: converted.id.toString(),
            name: converted.name,
            startTime: converted.startTime,
            endTime: converted.endTime,
            isActive: converted.isActive,
            shiftNumberKey: converted.shiftNumberKey
          };
          console.log('✅ Store: Turno atual detectado:', currentShift.name);
        } catch (error) {
          console.error('❌ Store: Erro ao converter turno atual:', error);
        }
      }
      
      // Usar primeiro turno se não conseguir detectar
      if (!currentShift && realShifts.length > 0) {
        currentShift = realShifts[0];
        console.log('🔄 Store: Usando primeiro turno como padrão:', currentShift.name);
      }
      
      set({
        shifts: realShifts,
        currentShift: currentShift,
        isLoading: false,
        error: null
      });
      
      console.log('✅ Store: Carregamento de turnos concluído com sucesso:', {
        totalShifts: realShifts.length,
        currentShift: currentShift?.name || 'Nenhum'
      });
      
      return true;
    } catch (error) {
      console.error('❌ Store: Erro crítico ao carregar turnos:', error);
      set({ 
        shifts: [],
        currentShift: null,
        isLoading: false, 
        error: 'Erro ao carregar turnos da API' 
      });
      return false;
    }
  },

  fetchOeeHistory: async (period: string) => {
    try {
      const { dashboardService, currentShift } = get();
      const history = await dashboardService.getOeeHistory(currentShift, period);
      set({ oeeHistory: history });
    } catch (error) {
      // Silencioso: mantém último valor
    }
  },

  // Novos métodos WBMS
  fetchTimeDistribution: async () => {
    const { dashboardService, currentShift } = get();
    try {
      const timeDistributionData = await dashboardService.getTimeDistribution(currentShift);
      
      // Converter segundos para formato hh:mm:ss
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      set({ 
        timeDistribution: {
          produced: timeDistributionData.produced,
          stopped: timeDistributionData.stopped,
          standby: timeDistributionData.standby,
          setup: timeDistributionData.setup,
          totalTime: formatTime(timeDistributionData.totalTime)
        }
      });
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar distribuição de tempo:', error);
      // Manter dados vazios em caso de erro
    }
  },

  fetchTopStopReasons: async () => {
    const { dashboardService, currentShift } = get();
    try {
      const stopReasonsData = await dashboardService.getTopStopReasons(currentShift);
      
      // Converter segundos para formato hh:mm:ss
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const convertedStopReasons = stopReasonsData.map(reason => ({
        id: reason.id.toString(),
        code: reason.code,
        description: reason.description,
        category: reason.category,
        totalTime: formatTime(reason.totalTime),
        occurrences: reason.occurrences
      }));

      set({ topStopReasons: convertedStopReasons });
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar principais paradas:', error);
      set({ topStopReasons: [] });
    }
  },

  // Novo método para buscar timeline de produção
  fetchProductionTimeline: async () => {
    const { dashboardService, currentShift } = get();
    try {
      await dashboardService.getProductionTimeline(currentShift);
      // Por enquanto, apenas logar os dados - implementar no componente quando necessário
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar timeline de produção:', error);
    }
  },

  // Novo método para buscar histórico de paradas
  fetchDowntimeHistory: async () => {
    const { dashboardService, currentShift } = get();
    try {
      const downtimeData = await dashboardService.getDowntimeHistory(currentShift);
      // Converter para o formato esperado pelo frontend
      const convertedDowntimeHistory = downtimeData.map(event => ({
        id: event.id.toString(),
        operator: 'Operador', // Valor padrão
        startDate: new Date(event.startTime).toISOString().split('T')[0],
        startTime: new Date(event.startTime).toLocaleTimeString(),
        endDate: event.endTime ? new Date(event.endTime).toISOString().split('T')[0] : null,
        endTime: event.endTime ? new Date(event.endTime).toLocaleTimeString() : null,
        totalTime: event.duration ? Math.floor(event.duration / 60).toString() : null, // Converter para minutos
        reason: event.reason
      }));

      set({ downtimeHistory: convertedDowntimeHistory });
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar histórico de paradas:', error);
    }
  },

  // Novo método para buscar dados compostos do dashboard
  fetchDashboardComposite: async () => {
    const { dashboardService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      const compositeData = await dashboardService.getDashboardComposite(currentShift);
      
      // TODO: Converter dados para o formato do store quando API estiver estável
      set({
        oeeHistory: compositeData.oeeHistory,
        timeDistribution: {
          produced: compositeData.timeDistribution.produced,
          stopped: compositeData.timeDistribution.stopped,
          standby: compositeData.timeDistribution.standby,
          setup: compositeData.timeDistribution.setup,
          totalTime: get().formatTime(compositeData.timeDistribution.totalTime)
        },
        topStopReasons: compositeData.topStopReasons.map(reason => ({
          id: reason.id.toString(),
          code: reason.code,
          description: reason.description,
          category: reason.category,
          totalTime: get().formatTime(reason.totalTime),
          occurrences: reason.occurrences
        })),
        productionStatus: compositeData.productionStatus,
        isLoading: false
      });

    } catch (error) {
      // console.error('❌ Store: Erro ao buscar dados compostos do dashboard (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  // Função auxiliar para formatar tempo
  formatTime: (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Implementações dos novos métodos para API real
  loadRealProductionOrders: async () => {
    const { jobsService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      if (!currentShift?.shiftNumberKey) {
        throw new Error('Turno atual não encontrado');
      }
      
      const jobs = await jobsService.getJobsByShift(currentShift.shiftNumberKey.toString());
      const productionOrders: ProductionOrder[] = [];
      
      for (const job of jobs) {
        const products = await jobsService.getProductsForJob(job);
        const product = products[0]; // Usar primeiro produto encontrado
        
        if (product) {
          const order: ProductionOrder = {
            id: job.job_number_key.toString(),
            name: `OP-${job.job_number_key}`,
            product: product.product,
            quantity: job.good_count,
            dueDate: new Date().toISOString().split('T')[0] // Data atual como fallback
          };
          productionOrders.push(order);
        }
      }
      
      set({ productionOrders, isLoading: false });
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar ordens de produção:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar ordens de produção',
        isLoading: false 
      });
    }
  },
  
  loadCurrentShiftJobs: async () => {
    const { jobsService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      if (!currentShift?.shiftNumberKey) {
        throw new Error('Turno atual não encontrado');
      }
      
      const jobs = await jobsService.getJobsByShift(currentShift.shiftNumberKey.toString());
      
      // Converter para ProductionOrders
      const productionOrders: ProductionOrder[] = [];
      for (const job of jobs) {
        const products = await jobsService.getProductsForJob(job);
        const product = products[0]; // Usar primeiro produto encontrado
        
        if (product) {
          const order: ProductionOrder = {
            id: job.job_number_key.toString(),
            name: `OP-${job.job_number_key}`,
            product: product.product,
            quantity: job.good_count,
            dueDate: new Date().toISOString().split('T')[0] // Data atual como fallback
          };
          productionOrders.push(order);
        }
      }
      
      set({ productionOrders, isLoading: false });
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar jobs do turno:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar jobs do turno',
        isLoading: false 
      });
    }
  },
  
  loadJobProducts: async (jobId: string) => {
    const { jobsService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      if (!currentShift?.shiftNumberKey) {
        throw new Error('Turno atual não encontrado');
      }
      
      // Buscar job específico
      const jobs = await jobsService.getJobsByShift(currentShift.shiftNumberKey.toString());
      const job = jobs.find((j: Job) => j.job_number_key.toString() === jobId);
      
      if (job) {
        const products = await jobsService.getProductsForJob(job);
        
        // Converter produtos para formato da store
        const convertedProducts = products.map(p => ({
          id: p.product_key,
          name: p.product,
          product_key: p.product_key,
          product: p.product,
          internal_code: p.internal_code,
          units_per_package: p.units_per_package,
          isSelected: false,
          code: p.internal_code,
          description: p.product,
          sku: p.internal_code
        }));
        
        set({ products: convertedProducts, isLoading: false });
      } else {
        throw new Error('Job não encontrado');
      }
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar produtos do job:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar produtos do job',
        isLoading: false 
      });
    }
  },

  updateProductionStatus: () => {
    const { machineStatus } = get();
    
    let status: ProductionStatus['status'] = 'PRODUZINDO';
    let icon = '▶️';
    let color = '#22c55e';
    
    switch (machineStatus) {
      case MachineStatus.DOWN:
        status = 'PARADO';
        icon = '⏸️';
        color = '#ef4444';
        break;
      case MachineStatus.SETUP:
        status = 'SETUP';
        icon = '🔧';
        color = '#3b82f6';
        break;
      case MachineStatus.STANDBY:
        status = 'STANDBY';
        icon = '⏸️';
        color = '#f59e0b';
        break;
      default:
        status = 'PRODUZINDO';
        icon = '▶️';
        color = '#22c55e';
    }
    
    // Calcular tempos baseados nos dados atuais
    const producingTime = '00:00:00'; // Em implementação real viria dos dados
    const producingPercentage = 0; // Em implementação real seria calculado
    const stoppedTime = '00:00:00'; // Em implementação real viria dos dados
    
    set({
      productionStatus: {
        status,
        icon,
        color,
        producingTime,
        producingPercentage,
        stoppedTime
      }
    });
  },

  selectProduct: (productId: string) => {
    set(state => ({
      availableProducts: state.availableProducts.map(product => ({
        ...product,
        isSelected: product.id === productId
      }))
    }));
  },

  // Carregar produtos da API Option7 e converter para ProductSelection
  loadAvailableProducts: async () => {
    try {
      
      const { deviceSettings } = useDeviceSettingsStore.getState();
      
      if (!deviceSettings.isConfigured) {
        set({ availableProducts: [] });
        return;
      }
      
      // Usar a API Option7 para buscar produtos
      const products = await get().option7ApiService.getProducts(
        [parseInt(deviceSettings.plantId)],
        [parseInt(deviceSettings.sectorId)],
        [parseInt(deviceSettings.lineId)]
      );
      
      // Converter para ProductSelection
      const productSelections: ProductSelection[] = products.map((product: any) => ({
        id: product.id.toString(),
        name: product.nome,
        product_key: product.id.toString(),
        product: product.nome,
        internal_code: product.codigo,
        units_per_package: 1, // Valor padrão
        isSelected: false,
        code: product.codigo,
        description: product.nome
      }));
      
      set({ availableProducts: productSelections });
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar produtos da API Option7:', error);
      // Não definir erro no estado - tratamento silencioso
      set({ availableProducts: [] });
    }
  },

  startProductSetup: (setupTypeId: string) => {
    const setupType = get().setupTypes.find(st => st.id === setupTypeId);
    if (setupType) {
      set({ 
        machineStatus: MachineStatus.SETUP,
        view: ViewState.SETUP,
        showProductSelectionModal: false
      });
    }
  },

  setShowProductSelectionModal: (show: boolean) => {
    set({ showProductSelectionModal: show });
  },

  fetchStopReasons: async () => {
    const { option7ApiService } = get();
    set({ isLoading: true, error: null });
    
    try {
      const eventReasons = await option7ApiService.getEventReasons('stop');
      
      // Converter para o formato esperado pelo frontend
      const categories = new Map<string, DowntimeReasonCategory>();
      
      eventReasons.forEach((reason: any) => {
        // Extrair categoria baseada no prefixo do motivo
        let category = 'Outros';
        
        if (reason.motivo.startsWith('Man.') || reason.motivo.startsWith('Manut.')) {
          category = 'Manutenção';
        } else if (reason.motivo.startsWith('Ajuste') || reason.motivo.includes('Ajuste')) {
          category = 'Ajustes';
        } else if (reason.motivo.startsWith('Falha') || reason.motivo.includes('Falha')) {
          category = 'Falhas';
        } else if (reason.motivo.startsWith('Parada') || reason.motivo.includes('Parada')) {
          category = 'Paradas';
        } else if (reason.motivo.startsWith('Falta') || reason.motivo.includes('Falta')) {
          category = 'Falta de Material';
        } else if (reason.motivo.startsWith('Troca') || reason.motivo.includes('Troca')) {
          category = 'Trocas';
        } else if (reason.motivo.startsWith('Limpeza') || reason.motivo.includes('Limpeza')) {
          category = 'Limpeza';
        } else if (reason.motivo.startsWith('Aguardando') || reason.motivo.includes('Aguardando')) {
          category = 'Aguardando';
        } else if (reason.motivo.startsWith('M-')) {
          category = 'Manutenção';
        } else if (reason.motivo.includes('Producao') || reason.motivo.includes('Produção')) {
          category = 'Produção';
        } else if (reason.motivo.includes('Queda') || reason.motivo.includes('Energia')) {
          category = 'Energia';
        } else if (reason.motivo.includes('Intervalo') || reason.motivo.includes('Operacional')) {
          category = 'Operacional';
        } else if (reason.motivo.includes('Retrabalho') || reason.motivo.includes('Retirada')) {
          category = 'Retrabalho';
        } else if (reason.motivo.includes('Correção') || reason.motivo.includes('Raspagem')) {
          category = 'Correções';
        } else if (reason.motivo.includes('TESTES') || reason.motivo.includes('Teste')) {
          category = 'Testes';
        } else if (reason.motivo.includes('ESGOTAMENTO') || reason.motivo.includes('Matéria Prima')) {
          category = 'Material';
        }
        
        if (!categories.has(category)) {
          categories.set(category, {
            category,
            reasons: []
          });
        }
        
        categories.get(category)!.reasons.push({
          id: reason.descricao_parada_key.toString(),
          code: reason.descricao_parada_key.toString(),
          description: reason.motivo
        });
      });
      
      // Ordenar categorias por relevância (mais importantes primeiro)
      const categoryOrder = [
        'Manutenção',
        'Falhas', 
        'Paradas',
        'Ajustes',
        'Falta de Material',
        'Trocas',
        'Aguardando',
        'Limpeza',
        'Produção',
        'Energia',
        'Operacional',
        'Retrabalho',
        'Correções',
        'Testes',
        'Material',
        'Outros'
      ];
      
      const sortedCategories = Array.from(categories.values()).sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        return aIndex - bIndex;
      });
      
      const downtimeReasons = sortedCategories;
      
      set({ 
        downtimeReasons,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar motivos de parada (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  fetchPauseReasons: async () => {
    const { option7ApiService } = get();
    set({ isLoading: true, error: null });
    
    try {
      const eventReasons = await option7ApiService.getEventReasons('standby');
      
      // Converter para o formato esperado pelo frontend
      const categories = new Map<string, DowntimeReasonCategory>();
      
      eventReasons.forEach((reason: any) => {
        // Extrair categoria baseada no prefixo do motivo
        let category = 'Outros';
        
        if (reason.motivo.startsWith('Aguardando') || reason.motivo.includes('Aguardando')) {
          category = 'Aguardando';
        } else if (reason.motivo.startsWith('Intervalo') || reason.motivo.includes('Intervalo')) {
          category = 'Intervalo';
        } else if (reason.motivo.startsWith('Pausa') || reason.motivo.includes('Pausa')) {
          category = 'Pausas';
        } else if (reason.motivo.startsWith('Almoço') || reason.motivo.includes('Almoço')) {
          category = 'Refeições';
        } else if (reason.motivo.startsWith('Café') || reason.motivo.includes('Café')) {
          category = 'Refeições';
        } else if (reason.motivo.startsWith('Banheiro') || reason.motivo.includes('Banheiro')) {
          category = 'Pessoal';
        } else if (reason.motivo.startsWith('Reunião') || reason.motivo.includes('Reunião')) {
          category = 'Reuniões';
        } else if (reason.motivo.startsWith('Treinamento') || reason.motivo.includes('Treinamento')) {
          category = 'Treinamento';
        } else if (reason.motivo.startsWith('Operacional') || reason.motivo.includes('Operacional')) {
          category = 'Operacional';
        } else if (reason.motivo.includes('Espera') || reason.motivo.includes('Aguardar')) {
          category = 'Aguardando';
        } else if (reason.motivo.includes('Standby') || reason.motivo.includes('Stand-by')) {
          category = 'Standby';
        }
        
        if (!categories.has(category)) {
          categories.set(category, {
            category,
            reasons: []
          });
        }
        
        categories.get(category)!.reasons.push({
          id: reason.descricao_parada_key.toString(),
          code: reason.descricao_parada_key.toString(),
          description: reason.motivo
        });
      });
      
      // Ordenar categorias por relevância para pausas
      const categoryOrder = [
        'Aguardando',
        'Intervalo',
        'Pausas',
        'Refeições',
        'Pessoal',
        'Reuniões',
        'Treinamento',
        'Operacional',
        'Standby',
        'Outros'
      ];
      
      const sortedCategories = Array.from(categories.values()).sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        return aIndex - bIndex;
      });
      
      const pauseReasons = sortedCategories;
      
      set({ 
        pauseReasons,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar motivos de pausa (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  fetchTimelineData: async () => {
    const { timesheetService } = get();
    const { deviceSettings } = useDeviceSettingsStore.getState();
    
    set({ timelineLoading: true, timelineError: null });
    
    try {
      if (!deviceSettings.isConfigured) {
        set({ timelineEvents: [], timelineLoading: false });
        return;
      }

      // Buscar timesheet ativo primeiro
      const activeTimesheet = await timesheetService.getActiveTimesheet(deviceSettings.lineId);
      
      if (activeTimesheet) {
        // Carregar eventos da timeline do timesheet ativo
        const timelineEvents = await timesheetService.getTimelineEvents(activeTimesheet.shift_number_key.toString());
        
        set({ 
          timelineEvents,
          timelineLoading: false,
          timelineError: null
        });
        
        //   timesheet: activeTimesheet.shift_number_key,
        //   totalEvents: timelineEvents.length,
        //   events: timelineEvents.slice(0, 3) // Log dos primeiros 3 eventos
        // });
      } else {
        // Se não há timesheet ativo, timeline vazia
        set({ 
          timelineEvents: [],
          timelineLoading: false,
          timelineError: null
        });
        
      }
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar dados da timeline (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ timelineLoading: false });
    }
  },

  // Novo método para carregar Production Details
  loadProductionDetails: async () => {
    // Função desabilitada para evitar chamadas ao automaticProductionService
    console.log('🔄 Store: loadProductionDetails desabilitada');
    set({ productionDetails: null });
    return;
  },

  // Métodos para controle de verificação de turno
  checkShiftIfNeeded: async () => {
    const { currentShift, lastShiftCheck, shouldCheckShift } = get();
    const now = Date.now();
    
    // Se não precisa verificar, retorna
    if (!shouldCheckShift) {
      return;
    }
    
    // Se já verificou recentemente (menos de 5 minutos), retorna
    if (lastShiftCheck && (now - lastShiftCheck) < 5 * 60 * 1000) {
      return;
    }
    
    // Se não há turno atual, precisa verificar
    if (!currentShift) {
      await get().loadRealShifts();
      set({ lastShiftCheck: now, shouldCheckShift: false });
      return;
    }
    
    // Verificar se o turno atual ainda é válido
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const [startHour, startMin] = currentShift.startTime.split(':').map(Number);
    const [endHour, endMin] = currentShift.endTime.split(':').map(Number);
    const shiftStartMinutes = startHour * 60 + startMin;
    const shiftEndMinutes = endHour * 60 + endMin;
    
    let isShiftValid = false;
    
    // Lidar com turnos que passam da meia-noite
    if (shiftEndMinutes < shiftStartMinutes) {
      isShiftValid = currentTimeMinutes >= shiftStartMinutes || currentTimeMinutes < shiftEndMinutes;
    } else {
      isShiftValid = currentTimeMinutes >= shiftStartMinutes && currentTimeMinutes < shiftEndMinutes;
    }
    
    if (!isShiftValid) {
      await get().loadRealShifts();
      set({ lastShiftCheck: now, shouldCheckShift: false });
    } else {
      set({ lastShiftCheck: now, shouldCheckShift: false });
    }
  },

  markShiftCheckNeeded: () => {
    set({ shouldCheckShift: true });
  },

  // Métodos para auto-apontamento
  setShowSetupModal: (show: boolean) => {
    set({ showSetupModal: show });
  },

  handleSetupComplete: (setupData: any) => {
    set({ 
      setupData,
      showSetupModal: false,
      productionData: {
        target: 0, // Será atualizado quando buscar dados do produto
        actual: 0,
        completion: 0,
        goodParts: 0,
        goodPartsPercent: 100
      }
    });
    
    // Carregar dados de produção em tempo real e status do turno
    get().loadProductionData();
    get().loadShiftStatusFromLocalApi();
  },

  loadProductionData: async () => {
    const { setupData, selectedProduct } = get();
    
    if (!setupData?.line) {
      return;
    }

    try {
      // Passar o ID do produto selecionado se disponível
      const productId = selectedProduct?.product_key?.toString();
      const productionData = await AutoApontamentoService.getProductionData(setupData.line, productId);
      
      set({ productionData });

      // Persistir em cache local com metadados para pré-carga
      try {
        const cachedPayload = {
          line: setupData.line,
          productId: productId || null,
          timestamp: Date.now(),
          data: productionData
        };
        localStorage.setItem('production_data', JSON.stringify(cachedPayload));
      } catch (e) {
        // silencioso
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados de produção:', error);
    }
  },

  // Buscar status do turno na API local
  loadShiftStatusFromLocalApi: async () => {
    try {
      const { wbmsShiftNumberKey } = get();
      if (!wbmsShiftNumberKey) return;
      const status = await AutoApontamentoService.getShiftStatusByNumberKey(wbmsShiftNumberKey);

      // Atualizar OEE atual
      set({
        oeeFromStatus: {
          oee: status.oee?.main ?? 0,
          availability: status.oee?.availability ?? 0,
          performance: status.oee?.performance ?? 0,
          quality: status.oee?.quality ?? 0
        },
        // Converter histórico para o formato do gráfico
        oeeHistory: {
          points: (status.historicalPerformance?.dataPoints || []).map((p, idx) => ({ x: idx * (200 / Math.max(1, (status.historicalPerformance?.dataPoints.length || 1) - 1)), y: p.oee })),
          timeLabels: (status.historicalPerformance?.dataPoints || []).map((p: { time?: string }) => p.time || ''),
          trend: status.historicalPerformance?.trend || '0.0%',
          trendColor: (status.historicalPerformance?.trend || '').startsWith('+') ? 'text-green-400' : (status.historicalPerformance?.trend || '').startsWith('-') ? 'text-red-400' : 'text-gray-400'
        }
      });
    } catch (e) {
      // silencioso
    }
  },

  // Novo método para carregar dados imediatamente após seleção da linha
  loadInitialProductionData: async (clientLineKey: string) => {
    const { selectedProduct } = get();
    
    try {
      // Validar e corrigir clientLineKey se necessário
      const validClientLineKey = await validateAndFixClientLineKey(clientLineKey);
      
      if (!validClientLineKey) {
        console.error('❌ Não foi possível obter um clientLineKey válido');
        return;
      }
      
      // Passar o ID do produto selecionado se disponível
      const productId = selectedProduct?.product_key?.toString();
      
      console.log('🔄 Carregando dados para clientLineKey:', validClientLineKey);
      
      // Carregar dados de produção
      const productionData = await AutoApontamentoService.getProductionData(validClientLineKey, productId);
      
      // Carregar status do dispositivo
      const deviceStatus = await AutoApontamentoService.getDeviceStatus(validClientLineKey);
      
      // Carregar status de produção da API
      const apiStatus = await AutoApontamentoService.getLineStatus(validClientLineKey);
      
      set({ 
        productionData,
        deviceStatus: {
          ...deviceStatus,
          isLoading: false
        },
        apiProductionStatus: {
          hasActiveProduction: apiStatus.has_active_production,
          isLoading: false
        }
      });

      // Persistir em cache local com metadados para pré-carga
      try {
        const cachedPayload = {
          line: validClientLineKey,
          productId: productId || null,
          timestamp: Date.now(),
          data: productionData
        };
        localStorage.setItem('production_data', JSON.stringify(cachedPayload));
      } catch (e) {
        // silencioso
      }
      
      console.log('✅ Dados carregados com sucesso para clientLineKey:', validClientLineKey);
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais de produção:', error);
      
      // Em caso de erro 404, limpar dados inválidos
      if (error instanceof Error && error.message.includes('404')) {
        clearInvalidData();
        
        // Resetar estado
        set({
          setupData: null,
          selectedProduct: null,
          deviceStatus: {
            status: 'unknown',
            assetId: '',
            deviceId: 0,
            isLoading: false
          },
          apiProductionStatus: {
            hasActiveProduction: false,
            isLoading: false
          }
        });
      }
    }
  },

  checkProductionStatus: async () => {
    const { setupData } = get();
    
    if (!setupData?.line) {
      return;
    }

    try {
      // Verificar se precisa de setup
      const needsSetup = await AutoApontamentoService.checkSetupNeeded(setupData.line);
      
      if (needsSetup) {
        set({ showSetupModal: true });
        return;
      }

      // Verificar se há produção ativa
      const hasActiveProduction = await AutoApontamentoService.hasActiveProduction(setupData.line);
      
      if (hasActiveProduction) {
        // Carregar dados de produção
        await get().loadProductionData();
      } else {
        // Se não há produção ativa, mostrar modal de setup
        set({ showSetupModal: true });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status de produção:', error);
      // Em caso de erro, mostrar modal de setup
      set({ showSetupModal: true });
    }
  },

  // Métodos para status do dispositivo
  loadApiProductionStatus: async (clientLineKey: string) => {
    set(state => ({ 
      apiProductionStatus: { 
        ...state.apiProductionStatus, 
        isLoading: true 
      } 
    }));

    try {
      // Validar e corrigir clientLineKey se necessário
      const validClientLineKey = await validateAndFixClientLineKey(clientLineKey);
      
      if (!validClientLineKey) {
        console.error('❌ Não foi possível obter um clientLineKey válido em loadApiProductionStatus');
        set({ 
          apiProductionStatus: {
            hasActiveProduction: false,
            isLoading: false
          }
        });
        return;
      }
      
      console.log('🔄 Carregando status de produção da API para clientLineKey:', validClientLineKey);
      const status = await AutoApontamentoService.getLineStatus(validClientLineKey);
      
      set({ 
        apiProductionStatus: {
          hasActiveProduction: status.has_active_production,
          isLoading: false
        }
      });
      
      console.log('✅ Status de produção da API carregado com sucesso para clientLineKey:', validClientLineKey);
      
    } catch (error) {
      console.error('❌ Erro ao carregar status de produção da API:', error);
      
      // Em caso de erro 404, limpar dados inválidos
      if (error instanceof Error && error.message.includes('404')) {
        clearInvalidData();
      }
      
      set({ 
        apiProductionStatus: {
          hasActiveProduction: false,
          isLoading: false
        }
      });
    }
  },

  loadDeviceStatus: async (clientLineKey: string) => {
    set(state => ({ 
      deviceStatus: { 
        ...state.deviceStatus, 
        isLoading: true 
      } 
    }));

    try {
      // Validar e corrigir clientLineKey se necessário
      const validClientLineKey = await validateAndFixClientLineKey(clientLineKey);
      
      if (!validClientLineKey) {
        console.error('❌ Não foi possível obter um clientLineKey válido em loadDeviceStatus');
        set({ 
          deviceStatus: {
            status: 'unknown',
            assetId: '',
            deviceId: 0,
            isLoading: false
          }
        });
        return;
      }
      
      console.log('🔄 Carregando status do dispositivo para clientLineKey:', validClientLineKey);
      const deviceStatus = await AutoApontamentoService.getDeviceStatus(validClientLineKey);
      
      set({ 
        deviceStatus: {
          ...deviceStatus,
          isLoading: false
        }
      });
      
      console.log('✅ Status do dispositivo carregado com sucesso para clientLineKey:', validClientLineKey);
      
    } catch (error) {
      console.error('❌ Erro ao carregar status do dispositivo:', error);
      
      // Em caso de erro 404, limpar dados inválidos
      if (error instanceof Error && error.message.includes('404')) {
        clearInvalidData();
      }
      
      set({ 
        deviceStatus: {
          status: 'stopped',
          assetId: '',
          deviceId: 0,
          isLoading: false
        }
      });
    }
  },

  // Cache: tentar restaurar dados de produção rapidamente do localStorage
  loadProductionDataFromCache: () => {
    try {
      const cached = localStorage.getItem('production_data');
      if (!cached) return;
      const parsed = JSON.parse(cached);
      const { setupData, selectedProduct, productionData } = get();

      // Regras de validade: mesma linha e, se houver produto selecionado, mesmo produto
      const sameLine = setupData?.line && parsed.line && setupData.line === parsed.line;
      const sameProduct = !selectedProduct?.product_key || !parsed.productId || selectedProduct.product_key.toString() === String(parsed.productId);

      const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos
      const isFresh = typeof parsed.timestamp === 'number' && (Date.now() - parsed.timestamp) < MAX_AGE_MS;

      if (sameLine && sameProduct && isFresh) {
        // Evitar sobrescrever dados já carregados
        const hasExistingData = (productionData?.target ?? 0) > 0 || (productionData?.actual ?? 0) > 0;
        if (!hasExistingData) {
          set({ productionData: parsed.data });
        }
      }
    } catch (e) {
      // silencioso
    }
  },

  // Métodos para produto selecionado
  setSelectedProduct: (product: ProductSelection | null) => {
    console.log('🔄 Store: setSelectedProduct chamado com:', product);
    set({ selectedProduct: product });
  },

  setSetupData: (setupData: any) => {
    console.log('🔄 Store: setSetupData chamado com:', setupData);
    set({ setupData });
    // Persistir também no localStorage para reutilização por outras partes do app e após reload
    try {
      localStorage.setItem('setup_data', JSON.stringify(setupData));
    } catch (e) {
      // tratamento silencioso
    }
  },

  startProductionSetup: async () => {
    const { selectedProduct, setupData } = get();
    
    if (!selectedProduct || !setupData?.line) {
      throw new Error('Produto ou linha não selecionados');
    }

    try {
      // Iniciar produção usando a API e capturar shift_number_key
      const startResp = await AutoApontamentoService.startProduction(
        setupData.line,
        selectedProduct.product_key
      );

      // Atualizar setupData com o produto selecionado
      const updatedSetupData = {
        ...setupData,
        product: selectedProduct.description || selectedProduct.name,
        productKey: selectedProduct.product_key
      };

      set({ 
        setupData: updatedSetupData,
        showSetupModal: false,
        wbmsShiftNumberKey: startResp?.shift?.shift_number_key ?? null
      });

      // Atualizar status imediatamente após iniciar a produção
      try {
        await Promise.allSettled([
          get().loadApiProductionStatus(updatedSetupData.line),
          get().loadDeviceStatus(updatedSetupData.line),
          get().loadProductionData(),
          get().loadShiftStatusFromLocalApi()
        ]);
      } catch (e) {
        // silencioso
      }

      // Se houver um turno atual, anotar o shift_number_key retornado para uso nos eventos
      const { currentShift } = get();
      if (currentShift && startResp?.shift?.shift_number_key) {
        set({
          currentShift: {
            ...currentShift,
            shiftNumberKey: startResp.shift.shift_number_key
          }
        });
      }

      // Salvar no localStorage
      localStorage.setItem('setup_data', JSON.stringify(updatedSetupData));

      // === Inserção de evento RUN na timesheet Option7 ===
      try {
        const { timesheetService, option7ApiService } = get();
        // Identificar linha/turno
        const clientLineKey = updatedSetupData.line;
        const deviceSettings = useDeviceSettingsStore.getState().deviceSettings;

        // Garantir timesheet ativo
        let activeTimesheet = await timesheetService.getActiveTimesheet(clientLineKey);
        if (!activeTimesheet) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

          await timesheetService.createTimesheet({
            shift_number_key: '0',
            shift_id: (currentShift?.id ?? 'TURNO_1').toString(),
            client_line_key: clientLineKey,
            asset_id: deviceSettings.lineName || 'Linha',
            start_time: startTime,
            end_time: '',
            company: deviceSettings.plantName || 'Empresa',
            plant: deviceSettings.plantName || 'Planta',
            sector: deviceSettings.sectorName || 'Setor'
          });

          activeTimesheet = await timesheetService.getActiveTimesheet(clientLineKey);
        }

        if (activeTimesheet?.shift_number_key) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const hh = pad(now.getHours());
          const mm = pad(now.getMinutes());
          const endTime = `${hh}:${mm}`;
          const startDate = new Date(now.getTime() - 60 * 1000);
          const startTime = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;

          await option7ApiService.post('/timesheet_events', {
            shift_number_key: parseInt(activeTimesheet.shift_number_key.toString(), 10),
            description_id: 0,
            description_text: 'Produção iniciada (mobile)',
            type: 'RUN',
            start_time: startTime,
            end_time: endTime
          });
        }
      } catch (e) {
        console.warn('⚠️ Falha ao registrar evento RUN na Option7:', e);
      }
      
    } catch (error) {
      console.error('❌ Erro ao iniciar setup de produção:', error);
      throw error;
    }
  },

  // Métodos do sistema de cache inteligente
  getCacheStats: () => {
    // Importar dados do hook useTimelineData
    const { getCacheStats } = require('../hooks/useTimelineData');
    return getCacheStats ? getCacheStats() : { cacheSize: 0, queueSize: 0, isProcessing: false };
  },

  clearCache: () => {
    // Importar função do hook useTimelineData
    const { clearCache } = require('../hooks/useTimelineData');
    if (clearCache) {
      clearCache();
    }
  },

  // Novo método para registrar parada com auto-apontamento
  registerStopReasonWithAutoApontamento: async (_reason: string, _reasonId?: string) => {
    // Preferir a linha do setup (client_line_key real) quando disponível
    const { setupData } = get();
    let clientLineKey = setupData?.line;

    // Fallback para deviceSettings se necessário
    if (!clientLineKey) {
      const { useDeviceSettingsStore } = await import('./useDeviceSettingsStore');
      const deviceSettings = useDeviceSettingsStore.getState().deviceSettings;
      clientLineKey = deviceSettings.lineId;
    }

    if (!clientLineKey) {
      console.warn('⚠️ client_line_key não configurado - não será possível enviar o POST');
      return;
    }

    try {
      // Validar e corrigir clientLineKey se necessário
      const validClientLineKey = await validateAndFixClientLineKey(clientLineKey);
      if (!validClientLineKey) {
        console.warn('⚠️ client_line_key inválido após validação - abortando chamada');
        return;
      }

      // Enviar motivo da parada conforme nova especificação (Opção B)
      console.log('🛑 [useProductionStore] Registrando parada com motivo selecionado', {
        clientLineKey: validClientLineKey,
        reason: _reason,
        reasonId: _reasonId
      });
      const response = await AutoApontamentoService.stopProductionWithReason(
        validClientLineKey,
        _reason,
        _reasonId
      );
      console.log('✅ [useProductionStore] Resposta da API de parada', response);

      // Atualização otimista imediata do estado para refletir no Header
      set((state) => ({
        apiProductionStatus: {
          hasActiveProduction: false,
          isLoading: false
        },
        deviceStatus: {
          ...state.deviceStatus,
          status: 'stopped',
          isLoading: false
        }
      }));

      // Disparar recargas imediatas em paralelo para garantir consistência
      await Promise.allSettled([
        get().loadApiProductionStatus(validClientLineKey),
        get().loadDeviceStatus(validClientLineKey),
        get().loadProductionData(),
        get().loadShiftStatusFromLocalApi()
      ]);

      // === Inserção de evento STOP na timesheet Option7 ===
      try {
        const { timesheetService, option7ApiService } = get();
        const activeTimesheet = await timesheetService.getActiveTimesheet(validClientLineKey);
        if (activeTimesheet?.shift_number_key) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const hh = pad(now.getHours());
          const mm = pad(now.getMinutes());
          const endTime = `${hh}:${mm}`;
          const startDate = new Date(now.getTime() - 60 * 1000);
          const startTime = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;

          await option7ApiService.post('/timesheet_events', {
            shift_number_key: parseInt(activeTimesheet.shift_number_key.toString(), 10),
            description_id: 0,
            description_text: 'Parada (mobile)',
            type: 'STOP',
            start_time: startTime,
            end_time: endTime
          });
        } else {
          console.warn('⚠️ Nenhum timesheet ativo encontrado para registrar STOP');
        }
      } catch (e) {
        console.warn('⚠️ Falha ao registrar evento STOP na Option7:', e);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao registrar parada (continuando mesmo assim):', error);
      // Mesmo em caso de erro, forçar estado para parado para evitar UI inconsistente
      set((state) => ({
        apiProductionStatus: {
          hasActiveProduction: false,
          isLoading: false
        },
        deviceStatus: {
          ...state.deviceStatus,
          status: 'stopped',
          isLoading: false
        }
      }));
    }
  },

  // Novo: registrar standby (pausa) via Option7
  registerStandbyReasonWithOption7: async (_reason: string, _reasonId?: string) => {
    try {
      const { setupData } = get();
      let clientLineKey = setupData?.line;
      if (!clientLineKey) {
        const { useDeviceSettingsStore } = await import('./useDeviceSettingsStore');
        const deviceSettings = useDeviceSettingsStore.getState().deviceSettings;
        clientLineKey = deviceSettings.lineId;
      }

      if (!clientLineKey) {
        console.warn('⚠️ client_line_key não configurado - não será possível enviar STANDBY');
        return;
      }

      console.log('⏸️ [useProductionStore] Registrando STANDBY (pausa) na Option7', {
        clientLineKey,
        reason: _reason,
        reasonId: _reasonId
      });

      const { timesheetService, option7ApiService } = get();
      const activeTimesheet = await timesheetService.getActiveTimesheet(clientLineKey);
      if (!activeTimesheet?.shift_number_key) {
        console.warn('⚠️ Nenhum timesheet ativo encontrado para registrar STANDBY');
        return;
      }

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const hh = pad(now.getHours());
      const mm = pad(now.getMinutes());
      const endTime = `${hh}:${mm}`;
      const startDate = new Date(now.getTime() - 60 * 1000);
      const startTime = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;

      const payload = {
        shift_number_key: parseInt(activeTimesheet.shift_number_key.toString(), 10),
        description_id: _reasonId ? parseInt(String(_reasonId), 10) : 0,
        description_text: _reason,
        type: 'STANDBY',
        start_time: startTime,
        end_time: endTime
      } as const;

      console.log('📤 [useProductionStore] POST /timesheet_events (STANDBY):', payload);
      const created = await option7ApiService.post('/timesheet_events', payload);
      console.log('✅ [useProductionStore] STANDBY criado:', created);

      // Atualizar estado otimista para standby
      set((state) => ({
        apiProductionStatus: {
          hasActiveProduction: state.apiProductionStatus?.hasActiveProduction ?? true,
          isLoading: false
        },
        deviceStatus: {
          ...state.deviceStatus,
          status: 'standby',
          isLoading: false
        }
      }));
    } catch (error) {
      console.error('❌ Erro ao registrar STANDBY na Option7:', error);
    }
  },

  
    }),
    {
      name: 'production-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        view: state.view,
        machineStatus: state.machineStatus,
        currentShift: state.currentShift,
        previousView: state.previousView,
      }),
    }
  )
);
