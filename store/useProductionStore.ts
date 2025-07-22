
import { create } from 'zustand';
import { MachineStatus, ViewState, LiveMetrics, CurrentJob, DowntimeEvent, DowntimeReasonCategory, ProductionOrder, Product, ProductionLine, Shift } from '../types';
import DashboardService from '../services/dashboardService';
import ShiftService from '../services/shiftService';
import WbmsService from '../services/wbmsService';

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
  oeeHistory: {
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  } | null;
  
  setMachineStatus: (status: MachineStatus) => void;
  setView: (view: ViewState) => void;
  fetchLiveData: () => Promise<void>;
  initializeDashboard: () => Promise<void>;
  fetchOeeHistory: (period: string) => Promise<void>;
  registerStopReason: (reason: string) => Promise<void>;
  registerEvent: (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => Promise<void>;
  selectProductionOrder: (order: ProductionOrder) => void;
  startSetup: () => void;
  startProduction: () => void;
  setCurrentProductionLine: (line: ProductionLine) => void;
  setCurrentShift: (shift: Shift) => void;
  createProductionLine: (line: Omit<ProductionLine, 'id'>) => void;
  createShift: (shift: Omit<Shift, 'id'>) => void;
  loadRealShifts: () => Promise<boolean>;
  clearError: () => void;
}

const mockDowntimeReasons: DowntimeReasonCategory[] = [
    { category: 'Mechanical', reasons: [{id: 'm1', code: 'mech-01', description: 'Bearing Failure'}, {id: 'm2', code: 'mech-02', description: 'Belt Breakage'}, {id: 'm3', code: 'mech-03', description: 'Gear Damage'}, {id: 'm4', code: 'mech-04', description: 'Hydraulic Leak'}] },
    { category: 'Operational', reasons: [{id: 'o1', code: 'oper-01', description: 'Material Shortage'}, {id: 'o2', code: 'oper-02', description: 'Operator Unavailable'}, {id: 'o3', code: 'oper-03', description: 'Quality Check'}] },
    { category: 'Electrical', reasons: [{id: 'e1', code: 'elec-01', description: 'Sensor Failure'}, {id: 'e2', code: 'elec-02', description: 'Power Outage'}] },
    { category: 'Other', reasons: [{id: 'ot1', code: 'oth-01', description: 'Scheduled Maintenance'}, {id: 'ot2', code: 'oth-02', description: 'Unknown'}] },
];

const mockDowntimeHistory: DowntimeEvent[] = [
    { id: 'evt1', operator: 'John Smith', startDate: '2025-05-15', startTime: '08:23:15', endDate: '2025-05-15', endTime: '08:45:30', totalTime: '00:22:15', reason: 'Belt Breakage' },
    { id: 'evt2', operator: 'John Smith', startDate: '2025-05-15', startTime: '10:12:45', endDate: '2025-05-15', endTime: '10:30:20', totalTime: '00:17:35', reason: 'Material Shortage' },
    { id: 'evt3', operator: 'John Smith', startDate: '2025-05-15', startTime: '11:47:30', endDate: '2025-05-15', endTime: '11:52:50', totalTime: '00:05:20', reason: 'No Reason Provided' },
];

const mockProductionOrders: ProductionOrder[] = [
    { id: 'po-001', name: 'PO-2025-001', product: 'Widget Assembly Type-A', quantity: 3000, dueDate: '2025-05-25' },
    { id: 'po-002', name: 'PO-2025-002', product: 'Widget Assembly Type-B', quantity: 5200, dueDate: '2025-05-26' },
    { id: 'po-003', name: 'PO-2025-003', product: 'Widget Assembly Type-C', quantity: 2500, dueDate: '2025-05-27' },
];

const mockProducts: Product[] = [
    { id: 'prod-a', sku: 'SKU-12345', description: 'Widget Assembly Type-A' },
    { id: 'prod-b', sku: 'SKU-67890', description: 'Widget Assembly Type-B' },
];

const mockProductionLines: ProductionLine[] = [
    { id: 'line-1', name: 'ENVASE 520741-8', code: '520741-8', description: 'Linha de Envase Principal', isActive: true },
    { id: 'line-2', name: 'ENVASE 520741-9', code: '520741-9', description: 'Linha de Envase Secundária', isActive: true },
    { id: 'line-3', name: 'EMBALAGEM 520741-10', code: '520741-10', description: 'Linha de Embalagem', isActive: false },
];

const mockShifts: Shift[] = [
    { id: 'shift-1', name: 'TURNO 1', startTime: '06:00', endTime: '14:00', isActive: false },
    { id: 'shift-2', name: 'TURNO 2', startTime: '14:00', endTime: '22:00', isActive: true },
    { id: 'shift-3', name: 'TURNO 3', startTime: '22:00', endTime: '06:00', isActive: false },
];


export const useProductionStore = create<ProductionState>((set, get) => ({
  machineStatus: MachineStatus.RUNNING,
  view: ViewState.DASHBOARD,
  previousView: null,
  liveMetrics: {
    total: 0,
    good: 0,
    rejects: 0, // Zerar rejeitos
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 100, // Qualidade sempre 100% (sem rejeitos)
    productionOrderProgress: 0,
    possibleProduction: 0,
    timeInShift: 0,
    totalShiftTime: 0,
    avgSpeed: 0,
    instantSpeed: 0,
  },
  currentJob: null,
  downtimeHistory: mockDowntimeHistory,
  downtimeReasons: mockDowntimeReasons,
  productionOrders: mockProductionOrders,
  products: mockProducts,
  currentDowntimeEventId: null,
  productionLines: mockProductionLines,
  shifts: mockShifts,
  currentProductionLine: mockProductionLines[0], // ENVASE 520741-8 como padrão
  currentShift: mockShifts[1], // TURNO 2 como padrão (ativo)
  isLoading: false,
  error: null,
  dashboardService: new DashboardService(),
  shiftService: new ShiftService(),
  wbmsService: new WbmsService(),
  oeeHistory: null,

    setMachineStatus: (status: MachineStatus) => {
    set({ machineStatus: status });
    if (status === MachineStatus.DOWN) {
        const currentView = get().view;
        const newEventId = `evt${Date.now()}`;
        set({ 
            previousView: currentView,
            view: ViewState.STOP_REASON, 
            currentDowntimeEventId: newEventId,
            downtimeHistory: [
                { id: newEventId, operator: 'John Smith', startDate: new Date().toISOString().split('T')[0], startTime: new Date().toLocaleTimeString(), endDate: null, endTime: null, totalTime: null, reason: 'Aguardando motivo...' },
                ...get().downtimeHistory
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
  
  setView: (view: ViewState) => set({ view }),

  initializeDashboard: async () => {
    const { wbmsService } = get();
    console.log('🏪 Store: Iniciando dashboard...');
    set({ isLoading: true, error: null });
    
    try {
      // Primeiro, carregar turnos
      console.log('🏪 Store: Carregando turnos...');
      await get().loadRealShifts();
      
      // Obter o turno atual
      const { currentShift, currentProductionLine } = get();
      console.log('🏪 Store: Turno atual:', currentShift?.name);
      console.log('🏪 Store: Linha atual:', currentProductionLine?.name);
      
      // Se temos turno, carregar dados em tempo real
      if (currentShift) {
        console.log('🏪 Store: Carregando dados WBMS em tempo real...');
        
        // Usar equipamento padrão do WBMS
        const equipmentId = await wbmsService.getDefaultEquipment();
        
        const liveData = await wbmsService.getLiveData(equipmentId);
        const liveMetrics = wbmsService.convertToLiveMetrics(liveData);
        const currentJob = wbmsService.convertToCurrentJob(liveData);
        const productionLine = wbmsService.convertToProductionLine(liveData);
        
        console.log('🏪 Store: Dados WBMS recebidos, atualizando estado...', { liveData, liveMetrics });
        
        set({
          liveMetrics,
          currentJob: currentJob || get().currentJob, // Manter job atual se não há novo
          currentProductionLine: productionLine || currentProductionLine, // Manter linha atual se não há nova
          isLoading: false,
        });
      } else {
        console.log('🏪 Store: Usando dados mockados (turno não definido)');
        set({ isLoading: false });
      }
      
      console.log('🏪 Store: Dashboard inicializado com sucesso!');
    } catch (error) {
      console.error('🏪 Store: Erro ao inicializar dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false 
      });
    }
  },

  fetchLiveData: async () => {
    const { wbmsService, currentShift } = get();
    console.log('🔄 Store: Buscando dados em tempo real WBMS...', { 
      currentShift: currentShift?.name
    });
    
    // Só fazer chamadas se há um turno atual
    if (!currentShift) {
      console.log('🔄 Store: Turno não definido, pulando busca de dados');
      return;
    }
    
    try {
      // Usar equipamento padrão do WBMS
      const equipmentId = await wbmsService.getDefaultEquipment();
      
      const liveData = await wbmsService.getLiveData(equipmentId);
      const liveMetrics = wbmsService.convertToLiveMetrics(liveData);
      const machineStatus = wbmsService.getMachineStatus(liveData);
      
      console.log('🔄 Store: Dados em tempo real recebidos:', { liveData, liveMetrics, machineStatus });
      
      // Só atualizar o status da máquina se não há um evento de parada em andamento
      const currentState = get();
      const shouldUpdateMachineStatus = !currentState.currentDowntimeEventId || machineStatus !== 'DOWN';
      
      console.log('🔄 Store: Verificando atualização de status:', {
        currentMachineStatus: currentState.machineStatus,
        newMachineStatus: machineStatus,
        hasDowntimeEvent: !!currentState.currentDowntimeEventId,
        shouldUpdate: shouldUpdateMachineStatus
      });
      
      set({ 
        liveMetrics,
        machineStatus: shouldUpdateMachineStatus ? (machineStatus as MachineStatus) : currentState.machineStatus,
        error: null
      });

      // Se a máquina parou E não estamos já na tela de parada E não há um evento de parada em andamento
      if (machineStatus === 'DOWN' && get().view !== ViewState.STOP_REASON && !get().currentDowntimeEventId) {
        console.log('🔄 Store: Máquina parou, mostrando modal de motivo...');
        const currentView = get().view;
        const newEventId = `evt${Date.now()}`;
        set({ 
          previousView: currentView,
          view: ViewState.STOP_REASON, 
          currentDowntimeEventId: newEventId,
          downtimeHistory: [
            { id: newEventId, operator: 'John Smith', startDate: new Date().toISOString().split('T')[0], startTime: new Date().toLocaleTimeString(), endDate: null, endTime: null, totalTime: null, reason: 'Aguardando motivo...' },
            ...get().downtimeHistory
          ]
        });
      }
    } catch (error) {
      console.error('🔄 Store: Erro ao buscar dados em tempo real:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao buscar dados' });
    }
  },

  registerEvent: async (eventType: 'DOWN' | 'SETUP' | 'PAUSE' | 'RUN' | 'ASSISTANCE_REQUEST') => {
    const { dashboardService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      await dashboardService.registerEvent(currentShift, eventType);
      set({ isLoading: false });
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao registrar evento',
        isLoading: false 
      });
    }
  },

  registerStopReason: async (reason: string) => {
    const { dashboardService, currentShift } = get();
    set({ isLoading: true, error: null });
    
    try {
      // Registrar o motivo da parada
      await dashboardService.registerEvent(currentShift, 'DOWN');
      
      set(state => {
        const previousView = state.previousView || ViewState.DASHBOARD;
        const updatedHistory = state.downtimeHistory.map(event => 
          event.id === state.currentDowntimeEventId 
            ? { 
                ...event, 
                reason,
                endDate: new Date().toISOString().split('T')[0],
                endTime: new Date().toLocaleTimeString(),
                totalTime: '0' // Será calculado pelo backend
              } 
            : event
        );
        
        console.log('✅ Motivo da parada registrado:', { reason, previousView });
        
        return {
          downtimeHistory: updatedHistory,
          currentDowntimeEventId: null,
          machineStatus: MachineStatus.RUNNING,
          view: previousView,
          previousView: null,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Erro ao registrar motivo da parada:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao registrar motivo',
        isLoading: false 
      });
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
    // Simular atualização dos dados baseado na linha de produção
    // Em um sistema real, isso dispararia uma API call
    const lineBasedData = {
      'line-1': { // ENVASE 520741-8
        total: 240,
        good: 240, // Todas as peças são boas (sem rejeitos)
        rejects: 0, // Zerar rejeitos
        oee: 80.1,
        currentJob: {
          orderId: '5207418',
          orderQuantity: 1241,
          productId: '240042176',
          productName: 'GUARANA 500ml',
        }
      },
      'line-2': { // ENVASE 520741-9
        total: 180,
        good: 180, // Todas as peças são boas (sem rejeitos)
        rejects: 0, // Zerar rejeitos
        oee: 75.3,
        currentJob: {
          orderId: '5207419',
          orderQuantity: 980,
          productId: '240042177',
          productName: 'COCA-COLA 350ml',
        }
      },
      'line-3': { // EMBALAGEM 520741-10
        total: 320,
        good: 320, // Todas as peças são boas (sem rejeitos)
        rejects: 0, // Zerar rejeitos
        oee: 85.7,
        currentJob: {
          orderId: '5207420',
          orderQuantity: 1500,
          productId: '240042178',
          productName: 'ÁGUA MINERAL 500ml',
        }
      }
    };
    
    const data = lineBasedData[line.id as keyof typeof lineBasedData];
    if (data) {
      set(state => ({
        liveMetrics: {
          ...state.liveMetrics,
          total: data.total,
          good: data.good,
          rejects: 0, // Zerar rejeitos
          oee: data.oee,
          productionOrderProgress: data.good,
        },
        currentJob: data.currentJob
      }));
    }
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
      console.log('🔄 Store: Dados atualizados para o turno:', shift.name);
    }).catch(error => {
      console.error('❌ Store: Erro ao atualizar dados do turno:', error);
      // Em caso de erro, usar dados simulados como fallback
      const shiftBasedData = {
        'shift-1': { // TURNO 1
          timeInShift: 6.5,
          totalShiftTime: 8.0,
          avgSpeed: 25.2,
          instantSpeed: 26.8,
        },
        'shift-2': { // TURNO 2
          timeInShift: 2.3,
          totalShiftTime: 7.8,
          avgSpeed: 27.6,
          instantSpeed: 29.3,
        },
        'shift-3': { // TURNO 3
          timeInShift: 4.1,
          totalShiftTime: 8.0,
          avgSpeed: 23.8,
          instantSpeed: 24.5,
        }
      };
      
      const data = shiftBasedData[shift.id as keyof typeof shiftBasedData];
      if (data) {
        set(state => ({
          liveMetrics: {
            ...state.liveMetrics,
            timeInShift: data.timeInShift,
            totalShiftTime: data.totalShiftTime,
            avgSpeed: data.avgSpeed,
            instantSpeed: data.instantSpeed,
          }
        }));
      }
    });
  },

  createProductionLine: (lineData: Omit<ProductionLine, 'id'>) => {
    const newLine: ProductionLine = {
      ...lineData,
      id: `line-${Date.now()}`,
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
    const { shiftService } = get();
    console.log('🔄 Store: Carregando turnos da API...');
    set({ isLoading: true, error: null });
    
    try {
      // Buscar todos os apontamentos (turnos) - sempre há pelo menos um
      const apontamentos = await shiftService.getApontamentos(1, 10);
      const realShifts = shiftService.convertToShifts(apontamentos);
      
      console.log('✅ Store: Turnos carregados:', realShifts);
      
      // Sempre definir um turno atual (primeiro da lista ou ativo)
      let currentShift = realShifts[0]; // Primeiro turno da lista
      
      // Se há turnos ativos, usar o primeiro ativo
      const activeShifts = realShifts.filter(shift => shift.isActive);
      if (activeShifts.length > 0) {
        currentShift = activeShifts[0];
        console.log('✅ Store: Turno ativo encontrado:', currentShift.name);
      } else {
        console.log('⚠️ Store: Nenhum turno ativo, usando primeiro turno da lista:', currentShift.name);
      }
      
      set({
        shifts: realShifts,
        currentShift: currentShift,
        isLoading: false,
      });
      
      return true; // Sempre há um turno
    } catch (error) {
      console.error('❌ Store: Erro ao carregar turnos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar turnos',
        isLoading: false 
      });
      return false;
    }
  },

  fetchOeeHistory: async (period: string = '1h') => {
    const { dashboardService, currentShift } = get();
    console.log('📊 Store: Buscando histórico OEE...', { period, currentShift: currentShift?.name });
    
    try {
      const historyData = await dashboardService.getOeeHistory(currentShift, period);
      set({ oeeHistory: historyData });
      console.log('✅ Store: Histórico OEE carregado:', historyData);
    } catch (error) {
      console.error('❌ Store: Erro ao buscar histórico OEE:', error);
      // Em caso de erro, usar dados mockados como fallback
      const mockData = dashboardService.getMockOeeHistory(period);
      set({ oeeHistory: mockData });
    }
  },
}));
