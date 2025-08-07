
import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import { pollingManager } from '../services/api';

export const useLiveDataPolling = (intervalMs: number) => {
  const fetchLiveData = useProductionStore((state) => state.fetchLiveData);
  const isLoading = useProductionStore((state) => state.isLoading);
  const deviceSettings = useDeviceSettingsStore((state) => state.deviceSettings);
  const isPollingActive = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar se o dispositivo está configurado antes de iniciar polling
    if (!deviceSettings.isConfigured || !deviceSettings.lineId) {
      return;
    }

    isPollingActive.current = true;

    const intervalId = setInterval(async () => {
      // Verificar se o polling ainda está ativo
      if (!isPollingActive.current) {
        return;
      }

      // Verificar se já está carregando para evitar chamadas duplicadas
      if (isLoading) {
        return;
      }

      try {
        await fetchLiveData();
      } catch (error) {
        console.error('🔄 Polling: Erro no polling (tratado silenciosamente):', error);
        // Não propagar erro - tratamento silencioso
      }
    }, intervalMs);

    // Registrar intervalo no sistema centralizado
    intervalRef.current = intervalId;
    pollingManager.registerInterval(intervalId);

    return () => {
      isPollingActive.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        pollingManager.unregisterInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchLiveData, intervalMs, isLoading, deviceSettings.isConfigured, deviceSettings.lineId]);
};
