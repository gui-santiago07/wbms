import React, { useEffect } from 'react';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import DeviceList from '../components/features/settings/DeviceList';
import DeviceForm from '../components/features/settings/DeviceForm';
import Sidebar from '../components/features/dashboard/Sidebar';

const DeviceSettingsPage: React.FC = () => {
  const {
    devices,
    selectedDevice,
    isLoading,
    formState,
    connectionTestResult,
    productionLines,
    isFormDirty,
    fetchDevices,
    fetchProductionLines,
    selectDevice,
    createNewDevice,
    updateFormField,
    saveDevice,
    testConnection,
    resetConnectionTest
  } = useDeviceSettingsStore();

  useEffect(() => {
    fetchDevices();
    fetchProductionLines();
  }, [fetchDevices, fetchProductionLines]);

  const handleSelectDevice = (deviceId: string) => {
    selectDevice(deviceId);
  };

  const handleCreateNew = () => {
    createNewDevice();
  };

  const handleUpdateField = (field: keyof typeof formState, value: string) => {
    updateFormField(field, value);
  };

  const handleTestConnection = () => {
    testConnection(formState);
  };

  const handleSave = () => {
    saveDevice();
  };

  const isNewDevice = selectedDevice === null && !!(formState.name || formState.lineId || formState.token || formState.equipmentId);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Configurações de Dispositivo</h1>
            <p className="text-muted">Gerencie os dispositivos WBMS conectados às suas linhas de produção</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Lista de Dispositivos */}
            <div className="space-y-4">
              <DeviceList
                devices={devices}
                selectedDeviceId={selectedDevice?.id || null}
                onSelectDevice={handleSelectDevice}
                onCreateNew={handleCreateNew}
                isLoading={isLoading}
              />
            </div>

            {/* Coluna Direita - Formulário de Dispositivo */}
            <div className="space-y-4">
              <DeviceForm
                formState={formState}
                productionLines={productionLines}
                connectionTestResult={connectionTestResult}
                isLoading={isLoading}
                isFormDirty={isFormDirty}
                isNewDevice={isNewDevice}
                onUpdateField={handleUpdateField}
                onTestConnection={handleTestConnection}
                onSave={handleSave}
                onResetConnectionTest={resetConnectionTest}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettingsPage; 