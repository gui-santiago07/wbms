export interface Device {
  id: string;
  name: string;
  lineId: string;
  lineName: string;
  apiEndpoint: string;
  token: string;
  equipmentId: string;
  isActive: boolean;
  lastConnection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFormData {
  name: string;
  lineId: string;
  apiEndpoint: string;
  token: string;
  equipmentId: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  description?: string;
}

export interface ConnectionTestResult {
  status: 'success' | 'error' | 'idle';
  message: string;
}

export interface DeviceSettingsState {
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  formState: DeviceFormData;
  connectionTestResult: ConnectionTestResult;
  productionLines: ProductionLine[];
  isFormDirty: boolean;
}

export interface DeviceSettingsActions {
  fetchDevices: () => Promise<void>;
  fetchProductionLines: () => Promise<void>;
  selectDevice: (id: string) => void;
  createNewDevice: () => void;
  updateFormField: (field: keyof DeviceFormData, value: string) => void;
  saveDevice: () => Promise<void>;
  testConnection: (deviceData: DeviceFormData) => Promise<void>;
  resetConnectionTest: () => void;
} 