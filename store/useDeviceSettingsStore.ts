import { create } from 'zustand';
import { Device, DeviceFormData, DeviceSettingsState, DeviceSettingsActions, ProductionLine } from '../types/device';
import ApiClient from '../services/api';

// Mock de dados para desenvolvimento
const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Dispositivo Linha 1',
    lineId: 'line-1',
    lineName: 'Linha de Produção 1',
    apiEndpoint: 'https://www.wbms.com.br/serv/apiWbms.php',
    token: 'abc123token',
    equipmentId: 'Rivets_PH6601',
    isActive: true,
    lastConnection: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Dispositivo Linha 2',
    lineId: 'line-2',
    lineName: 'Linha de Produção 2',
    apiEndpoint: 'https://www.wbms.com.br/serv/apiWbms.php',
    token: 'def456token',
    equipmentId: 'Rivets_PH6602',
    isActive: false,
    lastConnection: '2024-01-10T08:15:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T08:15:00Z'
  }
];

const mockProductionLines: ProductionLine[] = [
  { id: 'line-1', name: 'Linha de Produção 1', description: 'Linha principal de envase' },
  { id: 'line-2', name: 'Linha de Produção 2', description: 'Linha secundária de envase' },
  { id: 'line-3', name: 'Linha de Produção 3', description: 'Linha de embalagem' }
];

const initialFormState: DeviceFormData = {
  name: '',
  lineId: '',
  apiEndpoint: 'https://www.wbms.com.br/serv/apiWbms.php',
  token: '',
  equipmentId: ''
};

type DeviceSettingsStore = DeviceSettingsState & DeviceSettingsActions;

export const useDeviceSettingsStore = create<DeviceSettingsStore>((set, get) => ({
  // Estado inicial
  devices: [],
  selectedDevice: null,
  isLoading: false,
  formState: { ...initialFormState },
  connectionTestResult: { status: 'idle', message: '' },
  productionLines: [],
  isFormDirty: false,

  // Ações
  fetchDevices: async () => {
    set({ isLoading: true });
    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ devices: mockDevices, isLoading: false });
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      set({ isLoading: false });
    }
  },

  fetchProductionLines: async () => {
    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ productionLines: mockProductionLines });
    } catch (error) {
      console.error('Erro ao buscar linhas de produção:', error);
    }
  },

  selectDevice: (id: string) => {
    const device = get().devices.find(d => d.id === id);
    if (device) {
      const formState: DeviceFormData = {
        name: device.name,
        lineId: device.lineId,
        apiEndpoint: device.apiEndpoint,
        token: device.token,
        equipmentId: device.equipmentId
      };
      set({ 
        selectedDevice: device, 
        formState,
        isFormDirty: false,
        connectionTestResult: { status: 'idle', message: '' }
      });
    }
  },

  createNewDevice: () => {
    set({ 
      selectedDevice: null, 
      formState: { ...initialFormState },
      isFormDirty: false,
      connectionTestResult: { status: 'idle', message: '' }
    });
  },

  updateFormField: (field: keyof DeviceFormData, value: string) => {
    set(state => ({
      formState: { ...state.formState, [field]: value },
      isFormDirty: true
    }));
  },

  saveDevice: async () => {
    const { formState, selectedDevice } = get();
    set({ isLoading: true });
    
    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (selectedDevice) {
        // Atualizar dispositivo existente
        const updatedDevice: Device = {
          ...selectedDevice,
          name: formState.name,
          lineId: formState.lineId,
          lineName: mockProductionLines.find(l => l.id === formState.lineId)?.name || '',
          apiEndpoint: formState.apiEndpoint,
          token: formState.token,
          equipmentId: formState.equipmentId,
          updatedAt: new Date().toISOString()
        };
        
        set(state => ({
          devices: state.devices.map(d => d.id === selectedDevice.id ? updatedDevice : d),
          selectedDevice: updatedDevice,
          isFormDirty: false,
          isLoading: false
        }));
      } else {
        // Criar novo dispositivo
        const newDevice: Device = {
          id: Date.now().toString(),
          name: formState.name,
          lineId: formState.lineId,
          lineName: mockProductionLines.find(l => l.id === formState.lineId)?.name || '',
          apiEndpoint: formState.apiEndpoint,
          token: formState.token,
          equipmentId: formState.equipmentId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set(state => ({
          devices: [...state.devices, newDevice],
          selectedDevice: newDevice,
          isFormDirty: false,
          isLoading: false
        }));
      }
      
      // Simular toast de sucesso
      console.log('Dispositivo salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar dispositivo:', error);
      set({ isLoading: false });
    }
  },

  testConnection: async (deviceData: DeviceFormData) => {
    set({ isLoading: true, connectionTestResult: { status: 'idle', message: '' } });
    
    try {
      // Simular chamada de API de teste
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado baseado nos dados
      const isValidToken = deviceData.token.length > 5;
      const isValidEquipmentId = deviceData.equipmentId.length > 3;
      
      if (isValidToken && isValidEquipmentId) {
        set({ 
          connectionTestResult: { 
            status: 'success', 
            message: 'Conexão estabelecida com sucesso! API WBMS respondeu corretamente.' 
          },
          isLoading: false 
        });
      } else {
        set({ 
          connectionTestResult: { 
            status: 'error', 
            message: 'Falha na conexão: Token ou ID do equipamento inválidos.' 
          },
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        connectionTestResult: { 
          status: 'error', 
          message: 'Erro de rede: Não foi possível conectar com a API WBMS.' 
        },
        isLoading: false 
      });
    }
  },

  resetConnectionTest: () => {
    set({ connectionTestResult: { status: 'idle', message: '' } });
  }
})); 