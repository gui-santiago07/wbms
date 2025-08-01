
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MachineStatus, ViewState, LiveMetrics, CurrentJob, DowntimeEvent, DowntimeReasonCategory, ProductionOrder, Product, ProductionLine, Shift, TimeDistribution, StopReason, ProductionStatus, ProductSelection, SetupType, Job, ApiProduct, ApiShift } from '../types';
import DashboardService from '../services/dashboardService';
import ShiftService from '../services/shiftService';
import WbmsService from '../services/wbmsService';
import Option7ApiService from '../services/option7ApiService';
import JobsService from '../services/jobsService';
import TimesheetService from '../services/timesheetService';
import { useDeviceSettingsStore } from './useDeviceSettingsStore';

interface ProductionState {
  machineStatus: MachineStatus;
  view: ViewState;
  previousView: ViewState | null;
  liveMetrics: LiveMetrics;
  currentJob: CurrentJob | null;
  downtimeHistory: DowntimeEvent[];
  downtimeReasons: DowntimeReasonCategory[];
  productionOrders: ProductionOrder[];
  products: Product[];
  currentDowntimeEventId: string | null;
  productionLines: ProductionLine[];
  shifts: Shift[];
  currentProductionLine: ProductionLine | null;
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;
  dashboardService: DashboardService;
  shiftService: ShiftService;
  wbmsService: WbmsService;
  option7ApiService: Option7ApiService;
  jobsService: JobsService;
  timesheetService: TimesheetService;
  oeeHistory: {
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
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
  
  setMachineStatus: (status: MachineStatus) => void;
  setView: (view: ViewState) => void;
  fetchLiveData: () => Promise<void>;
  initializeDashboard: () => Promise<void>;
  fetchOeeHistory: (period: string) => Promise<void>;
  registerStopReason: (reason: string, reasonId?: string) => Promise<void>;
  registerEvent: (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => Promise<void>;
  selectProductionOrder: (order: ProductionOrder) => void;
  startSetup: () => void;
  startProduction: () => void;
  setCurrentProductionLine: (line: ProductionLine) => void;
  setCurrentShift: (shift: Shift) => void;
  createProductionLine: (line: Omit<ProductionLine, 'client_line_key'>) => void;
  createShift: (shift: Omit<Shift, 'id'>) => void;
  loadRealShifts: () => Promise<boolean>;
  clearError: () => void;
  
  // Novos métodos para API real
  loadRealProductionOrders: () => Promise<void>;
  loadCurrentShiftJobs: () => Promise<void>;
  loadJobProducts: (jobId: string) => Promise<void>;
  
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
  fetchTimelineData: () => Promise<void>;
  formatTime: (seconds: number) => string;
  loadAvailableProducts: () => Promise<void>;
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
  productionOrders: [],
  products: [],
  currentDowntimeEventId: null,
  productionLines: [],
  shifts: [],
  currentProductionLine: null,
  currentShift: null,
  isLoading: false,
  error: null,
  dashboardService: new DashboardService(),
  shiftService: new ShiftService(),
  wbmsService: new WbmsService(),
  option7ApiService: new Option7ApiService(),
  jobsService: new JobsService(),
  timesheetService: new TimesheetService(),
  oeeHistory: null,
  
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

    setMachineStatus: (status: MachineStatus) => {
    const currentState = get();
    const previousStatus = currentState.machineStatus;
    
    set({ machineStatus: status });
    
    // Verificar se houve transição para parada (de status ativo para DOWN)
    const isTransitionToDown = status === MachineStatus.DOWN && 
      previousStatus !== MachineStatus.DOWN && 
      [MachineStatus.RUNNING, MachineStatus.PAUSED, MachineStatus.SETUP, MachineStatus.STANDBY].includes(previousStatus);
    
    if (isTransitionToDown) {
      // console.log('🔄 Store: Transição para parada via setMachineStatus, mostrando modal de motivo...', {
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
    // console.log('🔄 View alterada:', { 
    //   from: currentView, 
    //   to: view, 
    //   timestamp: new Date().toISOString() 
    // });
    
    // Garantir que sempre temos uma view válida
    if (!Object.values(ViewState).includes(view)) {
      // console.warn('⚠️ View inválida detectada, usando DASHBOARD como fallback');
      view = ViewState.DASHBOARD;
    }
    
    set({ view });
  },

  initializeDashboard: async () => {
    // console.log('🏪 Store: Iniciando dashboard...');
    set({ isLoading: true, error: null });
    
    try {
      const deviceSettings = useDeviceSettingsStore.getState().deviceSettings;
      
      if (!deviceSettings.isConfigured) {
        // console.log('⚠️ Dispositivo não configurado');
        set({ isLoading: false });
        return;
      }

      // 1. Detectar turno atual
      await get().loadRealShifts();
      
      // 2. Buscar timesheet ativo
      const activeTimesheet = await get().timesheetService.getActiveTimesheet(deviceSettings.lineId);
      
      if (activeTimesheet) {
        // 3. Carregar eventos da timeline
        const timelineEvents = await get().timesheetService.getTimelineEvents(activeTimesheet.shift_number_key.toString());
        set({ timelineEvents });
        
        // 4. Carregar jobs do turno
        const shiftJobs = await get().timesheetService.getShiftJobs(activeTimesheet.shift_number_key.toString());
        set({ currentShiftJobs: shiftJobs });
        
        // console.log('✅ Dados do timesheet carregados:', {
        //   timesheet: activeTimesheet.shift_number_key,
        //   events: timelineEvents.length,
        //   jobs: shiftJobs.length
        // });
      } else {
        // console.log('⚠️ Nenhum timesheet ativo encontrado');
        set({ timelineEvents: [], currentShiftJobs: [] });
      }

      // 5. Carregar dados em tempo real
      await get().fetchLiveData();
      
      // console.log('🏪 Store: Dashboard inicializado com sucesso!');
    } catch (error) {
      console.error('🏪 Store: Erro ao inicializar dashboard (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  fetchLiveData: async () => {
    const { wbmsService, currentShift } = get();
    // console.log('🔄 Store: Buscando dados em tempo real WBMS...', { 
    //   currentShift: currentShift?.name
    // });
    
    // Só fazer chamadas se há um turno atual
    if (!currentShift) {
      // console.log('🔄 Store: Turno não definido, pulando busca de dados');
      return;
    }
    
    try {
      // Usar equipamento padrão do WBMS
      const equipmentId = await wbmsService.getDefaultEquipment();
      
      const liveData = await wbmsService.getLiveData(equipmentId);
      const liveMetrics = wbmsService.convertToLiveMetrics(liveData);
      const machineStatus = wbmsService.getMachineStatus(liveData);
      
      // console.log('🔄 Store: Dados em tempo real recebidos:', { liveData, liveMetrics, machineStatus });
      
      // Só atualizar o status da máquina se não há um evento de parada em andamento
      const currentState = get();
      const shouldUpdateMachineStatus = !currentState.currentDowntimeEventId || machineStatus !== 'DOWN';
      
      // console.log('🔄 Store: Verificando atualização de status:', {
      //   currentMachineStatus: currentState.machineStatus,
      //   newMachineStatus: machineStatus,
      //   hasDowntimeEvent: !!currentState.currentDowntimeEventId,
      //   shouldUpdate: shouldUpdateMachineStatus
      // });
      
      set({ 
        liveMetrics,
        machineStatus: shouldUpdateMachineStatus ? (machineStatus as MachineStatus) : currentState.machineStatus,
        error: null
      });

      // Verificar se houve transição para parada (de status ativo para DOWN)
      const updatedState = get();
      const previousMachineStatus = currentState.machineStatus;
      const isTransitionToDown = machineStatus === 'DOWN' && 
        previousMachineStatus !== 'DOWN' && 
        ['RUNNING', 'PAUSED', 'SETUP', 'STANDBY'].includes(previousMachineStatus);
      
      // Se a máquina parou E não estamos já na tela de parada E não há um evento de parada em andamento E houve transição
      if (isTransitionToDown && updatedState.view !== ViewState.STOP_REASON && !updatedState.currentDowntimeEventId) {
        // console.log('🔄 Store: Transição para parada detectada, mostrando modal de motivo...', {
        //   previousStatus: previousMachineStatus,
        //   newStatus: machineStatus
        // });
        const currentView = updatedState.view;
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
            ...updatedState.downtimeHistory
          ]
        });
      } else if (machineStatus === 'DOWN' && updatedState.currentDowntimeEventId) {
        // console.log('🔄 Store: Máquina ainda parada, evento já registrado:', updatedState.currentDowntimeEventId);
      } else if (machineStatus === 'DOWN' && updatedState.view === ViewState.STOP_REASON) {
        // console.log('🔄 Store: Máquina parada, já na tela de parada');
      } else if (machineStatus === 'DOWN' && !isTransitionToDown) {
        // console.log('🔄 Store: Máquina já estava parada, não é uma transição');
      }
    } catch (error) {
      console.error('🔄 Store: Erro ao buscar dados em tempo real (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
    }
  },

  registerEvent: async (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => {
    const { dashboardService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      await dashboardService.registerEvent(currentShift, eventType);
      set({ isLoading: false });
    } catch (error) {
      console.error('Erro ao registrar evento (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  registerStopReason: async (reason: string, reasonId?: string) => {
    const { dashboardService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      // Registrar o motivo da parada usando método específico
      await dashboardService.registerStopEvent(currentShift, reason, reasonId);
      
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
        
        // console.log('✅ Motivo da parada registrado:', { 
        //   reason, 
        //   reasonId, 
        //   previousView,
        //   eventId: state.currentDowntimeEventId 
        // });
        
        return {
          downtimeHistory: updatedHistory,
          currentDowntimeEventId: null, // 🔑 CRÍTICO: Limpa o ID do evento atual
          machineStatus: MachineStatus.RUNNING, // 🔑 CRÍTICO: Define máquina como rodando
          view: previousView, // 🔑 CRÍTICO: Retorna para view anterior
          previousView: null, // 🔑 CRÍTICO: Limpa view anterior
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('❌ Erro ao registrar motivo da parada (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
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
      set({ machineStatus: MachineStatus.SETUP, view: ViewState.SETUP });
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
    // console.log('Linha de produção selecionada:', line.line);
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
        currentShift: data.shift,
      });
      // console.log('🔄 Store: Dados atualizados para o turno:', shift.name);
    }).catch(error => {
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
    const { option7ApiService } = get();
    const { deviceSettings } = useDeviceSettingsStore.getState();
    
    console.log('🔄 Store: Carregando turnos da API Option7...');
    set({ isLoading: true, error: null });
    
    try {
      if (!deviceSettings.isConfigured) {
        console.log('⚠️ Dispositivo não configurado, não é possível carregar turnos');
        set({ isLoading: false });
        return false;
      }

      // Buscar turnos da API Option7
      const workshifts = await option7ApiService.getWorkshifts();
      
      // Converter para formato do store
      const realShifts: Shift[] = workshifts.map(workshift => ({
        id: workshift.id.toString(),
        name: workshift.nome,
        startTime: '08:00', // Horários padrão - API não fornece
        endTime: '18:00', // Horários padrão - API não fornece
        isActive: true, // Assumir ativo - API não fornece
        shiftNumberKey: workshift.id
      }));
      
      console.log('✅ Store: Turnos carregados da API Option7:', realShifts);
      
      // Detectar turno atual baseado no horário
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      let currentShift = realShifts.find(shift => {
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        
        const shiftStartMinutes = startHour * 60 + startMin;
        const shiftEndMinutes = endHour * 60 + endMin;
        
        // Lidar com turnos que passam da meia-noite
        if (shiftEndMinutes < shiftStartMinutes) {
          return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
        } else {
          return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
        }
      });
      
      if (currentShift) {
        console.log('✅ Store: Turno atual detectado:', currentShift.name);
      } else {
        console.log('⚠️ Store: Nenhum turno ativo encontrado para o horário atual');
        // Usar primeiro turno como fallback
        currentShift = realShifts[0];
      }
      
      set({
        shifts: realShifts,
        currentShift: currentShift,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Store: Erro ao carregar turnos da API Option7:', error);
      set({ isLoading: false, error: 'Erro ao carregar turnos' });
      return false;
    }
  },

  fetchOeeHistory: async (period: string = '1h') => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando histórico OEE...', { period, currentShift: currentShift?.name });
    
    try {
      const historyData = await dashboardService.getOeeHistory(currentShift, period);
      set({ oeeHistory: historyData });
      // console.log('✅ Store: Histórico OEE carregado:', historyData);
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar histórico OEE:', error);
      // Em caso de erro, definir dados vazios
      set({ oeeHistory: null });
    }
  },

  // Novos métodos WBMS
  fetchTimeDistribution: async () => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando distribuição de tempo...');
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
      // console.log('✅ Store: Distribuição de tempo carregada');
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar distribuição de tempo:', error);
      // Manter dados vazios em caso de erro
    }
  },

  fetchTopStopReasons: async () => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando principais paradas...');
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
      // console.log('✅ Store: Principais paradas carregadas');
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar principais paradas:', error);
      set({ topStopReasons: [] });
    }
  },

  // Novo método para buscar timeline de produção
  fetchProductionTimeline: async () => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando timeline de produção...');
    try {
      const timelineData = await dashboardService.getProductionTimeline(currentShift);
      // Por enquanto, apenas logar os dados - implementar no componente quando necessário
      // console.log('✅ Store: Timeline de produção carregada:', timelineData);
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar timeline de produção:', error);
    }
  },

  // Novo método para buscar histórico de paradas
  fetchDowntimeHistory: async () => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando histórico de paradas...');
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
      // console.log('✅ Store: Histórico de paradas carregado');
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar histórico de paradas:', error);
    }
  },

  // Novo método para buscar dados compostos do dashboard
  fetchDashboardComposite: async () => {
    const { dashboardService, currentShift } = get();
    // console.log('📊 Store: Buscando dados compostos do dashboard...');
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

      // console.log('✅ Store: Dados compostos do dashboard carregados');
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
    const { jobsService } = get();
    set({ isLoading: true, error: null });
    
    try {
      const jobs = await jobsService.getCurrentShiftJobs();
      const productionOrders: ProductionOrder[] = [];
      
      for (const job of jobs) {
        const product = await jobsService.getProductByPartId(job.part_id);
        const order = jobsService.convertJobToProductionOrder(job, product || undefined);
        productionOrders.push(order);
      }
      
      set({ productionOrders, isLoading: false });
      // console.log('📦 Store: Ordens de produção carregadas:', productionOrders);
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar ordens de produção:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar ordens de produção',
        isLoading: false 
      });
    }
  },
  
  loadCurrentShiftJobs: async () => {
    const { jobsService } = get();
    set({ isLoading: true, error: null });
    
    try {
      const jobs = await jobsService.getCurrentShiftJobs();
      // console.log('🔄 Store: Jobs do turno atual carregados:', jobs);
      
      // Converter para ProductionOrders
      const productionOrders: ProductionOrder[] = [];
      for (const job of jobs) {
        const product = await jobsService.getProductByPartId(job.part_id);
        const order = jobsService.convertJobToProductionOrder(job, product || undefined);
        productionOrders.push(order);
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
    const { jobsService } = get();
    set({ isLoading: true, error: null });
    
    try {
      // Buscar job específico
      const jobs = await jobsService.getCurrentShiftJobs();
      const job = jobs.find(j => j.job_number_key.toString() === jobId);
      
      if (job) {
        const products = await jobsService.getProductsForJob(job);
        // console.log('🎯 Store: Produtos do job carregados:', products);
        
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
    const { machineStatus, liveMetrics } = get();
    
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
      // console.log('🔄 Store: Carregando produtos da API Option7...');
      
      const { deviceSettings } = useDeviceSettingsStore.getState();
      
      if (!deviceSettings.isConfigured) {
        // console.log('⚠️ Dispositivo não configurado, não é possível carregar produtos');
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
      // console.log('✅ Store: Produtos carregados da API Option7:', productSelections);
    } catch (error) {
      // console.error('❌ Store: Erro ao carregar produtos da API Option7:', error);
      // Não definir erro no estado - tratamento silencioso
      set({ availableProducts: [] });
    }
  },

  startProductSetup: (setupTypeId: string) => {
    const setupType = get().setupTypes.find(st => st.id === setupTypeId);
    if (setupType) {
      // console.log('🔧 Store: Iniciando setup:', setupType.name);
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
    // console.log('🛑 Store: Buscando motivos de parada da API...');
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
      
      // console.log('✅ Store: Motivos de parada carregados:', downtimeReasons);
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar motivos de parada (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ isLoading: false });
    }
  },

  fetchTimelineData: async () => {
    const { timesheetService } = get();
    const { deviceSettings } = useDeviceSettingsStore.getState();
    
    // console.log('📈 Store: Buscando dados da timeline de produção...');
    set({ timelineLoading: true, timelineError: null });
    
    try {
      if (!deviceSettings.isConfigured) {
        // console.log('⚠️ Dispositivo não configurado, não é possível carregar timeline');
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
        
        // console.log('✅ Store: Timeline de produção carregada:', {
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
        
        console.log('⚠️ Store: Nenhum timesheet ativo, timeline vazia');
      }
    } catch (error) {
      // console.error('❌ Store: Erro ao buscar dados da timeline (tratado silenciosamente):', error);
      // Não definir erro no estado - tratamento silencioso
      set({ timelineLoading: false });
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
