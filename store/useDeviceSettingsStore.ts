import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Device, DeviceFormData, DeviceSettingsState, DeviceSettingsActions, ProductionLine } from '../types/device';

const initialFormState: DeviceFormData = {
  name: '',
  lineId: '',
  apiEndpoint: 'https://www.wbms.com.br/serv/apiWbms.php',
  token: '',
  equipmentId: ''
};

// Interface para configurações do dispositivo
interface DeviceSettings {
  plantId: string;
  plantName: string;
  sectorId: string;
  sectorName: string;
  lineId: string;
  lineName: string;
  productId: string;
  productName: string;
  isConfigured: boolean;
  lastSetupDate?: string;
}

type DeviceSettingsStore = DeviceSettingsState & DeviceSettingsActions & {
  deviceSettings: DeviceSettings;
  setDeviceSettings: (settings: Partial<DeviceSettings>) => void;
  resetDeviceSettings: () => void;
};

const initialDeviceSettings: DeviceSettings = {
  plantId: '',
  plantName: '',
  sectorId: '',
  sectorName: '',
  lineId: '',
  lineName: '',
  productId: '',
  productName: '',
  isConfigured: false
};

export const useDeviceSettingsStore = create<DeviceSettingsStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      devices: [],
      selectedDevice: null,
      isLoading: false,
      formState: { ...initialFormState },
      connectionTestResult: { status: 'idle', message: '' },
      productionLines: [],
      isFormDirty: false,
      
      // Configurações do dispositivo
      deviceSettings: initialDeviceSettings,

      // Ações
      fetchDevices: async () => {
        set({ isLoading: true });
        try {
          // Buscar dispositivos da API Option7
          const apiService = new (await import('../services/option7ApiService')).default();
          const lines = await apiService.getLines([], []);
          
          const devices = lines.map(line => ({
            id: line.id.toString(),
            name: line.nome,
            lineId: line.id.toString(),
            lineName: line.nome,
            apiEndpoint: '/api',
            token: '',
            equipmentId: line.codigo,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          set({ devices, isLoading: false });
        } catch (error) {
          console.error('Erro ao buscar dispositivos:', error);
          set({ devices: [], isLoading: false });
        }
      },

      fetchProductionLines: async () => {
        try {
          // Buscar linhas de produção da API Option7
          const apiService = new (await import('../services/option7ApiService')).default();
          const lines = await apiService.getLines([], []);
          
          const productionLines = lines.map(line => ({
            id: line.id.toString(),
            name: line.nome,
            description: line.nome
          }));
          
          set({ productionLines });
        } catch (error) {
          console.error('Erro ao buscar linhas de produção:', error);
          set({ productionLines: [] });
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
          // Em implementação real, salvar na API
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (selectedDevice) {
            // Atualizar dispositivo existente
            const updatedDevice: Device = {
              ...selectedDevice,
              name: formState.name,
              lineId: formState.lineId,
              lineName: get().productionLines.find(l => l.id === formState.lineId)?.name || '',
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
              lineName: get().productionLines.find(l => l.id === formState.lineId)?.name || '',
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
          
        } catch (error) {
          console.error('Erro ao salvar dispositivo:', error);
          set({ isLoading: false });
        }
      },

      testConnection: async (deviceData: DeviceFormData) => {
        set({ isLoading: true, connectionTestResult: { status: 'idle', message: '' } });
        
        try {
          // Testar conexão com a API Option7
          const apiService = new (await import('../services/option7ApiService')).default();
          
          // Tentar buscar linhas para testar a conexão
          await apiService.getLines([], []);
          
          set({ 
            connectionTestResult: { 
              status: 'success', 
              message: 'Conexão estabelecida com sucesso! API Option7 respondeu corretamente.' 
            },
            isLoading: false 
          });
        } catch (error) {
          set({ 
            connectionTestResult: { 
              status: 'error', 
              message: 'Falha na conexão: Não foi possível conectar com a API Option7.' 
            },
            isLoading: false 
          });
        }
      },

      resetConnectionTest: () => {
        set({ connectionTestResult: { status: 'idle', message: '' } });
      },

      // Novos métodos para configurações do dispositivo
      setDeviceSettings: (settings: Partial<DeviceSettings>) => {
        set(state => ({
          deviceSettings: {
            ...state.deviceSettings,
            ...settings,
            lastSetupDate: new Date().toISOString()
          }
        }));
      },

      updateDeviceSettings: async (settings: Partial<DeviceSettings>) => {
        set(state => ({
          deviceSettings: {
            ...state.deviceSettings,
            ...settings,
            lastSetupDate: new Date().toISOString()
          }
        }));
      },

      resetDeviceSettings: () => {
        set({ deviceSettings: initialDeviceSettings });
      }
    }),
    {
      name: 'device-settings-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        deviceSettings: state.deviceSettings,
        devices: state.devices,
        selectedDevice: state.selectedDevice
      }),
    }
  )
); 