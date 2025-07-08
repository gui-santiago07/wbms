
import { create } from 'zustand';
import { MachineStatus, ViewState, LiveMetrics, CurrentJob, DowntimeEvent, DowntimeReasonCategory, ProductionOrder, Product } from '../types';

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
  
  setMachineStatus: (status: MachineStatus) => void;
  setView: (view: ViewState) => void;
  fetchLiveData: () => void; // Will be used by polling hook
  registerStopReason: (reason: string) => void;
  selectProductionOrder: (order: ProductionOrder) => void;
  startSetup: () => void;
  startProduction: () => void;
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


export const useProductionStore = create<ProductionState>((set, get) => ({
  machineStatus: MachineStatus.RUNNING,
  view: ViewState.DASHBOARD,
  previousView: null,
  liveMetrics: {
    total: 240,
    good: 213,
    rejects: 3,
    oee: 80.1,
    availability: 93.4,
    performance: 87.7,
    quality: 98.6,
    productionOrderProgress: 213,
    possibleProduction: 275,
    timeInShift: 2.3,
    totalShiftTime: 7.8,
    avgSpeed: 27.6,
    instantSpeed: 29.3,
  },
  currentJob: {
    orderId: '5207418',
    orderQuantity: 1241,
    productId: '240042176',
    productName: 'GUARANA 500ml',
  },
  downtimeHistory: mockDowntimeHistory,
  downtimeReasons: mockDowntimeReasons,
  productionOrders: mockProductionOrders,
  products: mockProducts,
  currentDowntimeEventId: null,

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

  fetchLiveData: () => {
    // This is a mock. In a real app, it would fetch from an API.
    // For now, let's just slightly update some metrics to show it's "live"
    set(state => {
      if (state.machineStatus === MachineStatus.RUNNING) {
        const newGood = state.liveMetrics.good + 1;
        const newTotal = state.liveMetrics.total + 1;
        return {
          liveMetrics: {
            ...state.liveMetrics,
            good: newGood,
            total: newTotal,
            productionOrderProgress: newGood,
            instantSpeed: 28 + Math.random() * 3, // Fluctuate speed
            oee: 79 + Math.random() * 2,
          }
        };
      }
      return {};
    });
  },

  registerStopReason: (reason: string) => {
    set(state => {
      const previousView = state.previousView || ViewState.DASHBOARD;
      return {
        downtimeHistory: state.downtimeHistory.map(event => 
          event.id === state.currentDowntimeEventId ? { ...event, reason } : event
        ),
        currentDowntimeEventId: null,
        machineStatus: MachineStatus.RUNNING,
        view: previousView,
        previousView: null,
      };
    });
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
}));
