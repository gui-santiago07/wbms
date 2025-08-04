
import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';

export const useLiveDataPolling = (intervalMs: number) => {
  const fetchLiveData = useProductionStore((state) => state.fetchLiveData);
  const isLoading = useProductionStore((state) => state.isLoading);
  const deviceSettings = useDeviceSettingsStore((state) => state.deviceSettings);
  const isPollingActive = useRef(true);

  useEffect(() => {
    // Verificar se o dispositivo está configurado antes de iniciar polling
    if (!deviceSettings.isConfigured || !deviceSettings.lineId) {
      console.log('🔄 Polling: Dispositivo não configurado, não iniciando polling');
      return;
    }

    console.log('🔄 Polling: Iniciando polling de dados em tempo real...');
    isPollingActive.current = true;

    const intervalId = setInterval(async () => {
      // Verificar se o polling ainda está ativo
      if (!isPollingActive.current) {
        console.log('🔄 Polling: Polling desativado, parando...');
        return;
      }

      // Verificar se já está carregando para evitar chamadas duplicadas
      if (isLoading) {
        console.log('🔄 Polling: Já está carregando, pulando chamada...');
        return;
      }

      try {
        await fetchLiveData();
      } catch (error) {
        console.error('🔄 Polling: Erro no polling (tratado silenciosamente):', error);
        // Não propagar erro - tratamento silencioso
      }
    }, intervalMs);

    return () => {
      console.log('🔄 Polling: Parando polling...');
      isPollingActive.current = false;
      clearInterval(intervalId);
    };
  }, [fetchLiveData, intervalMs, isLoading, deviceSettings.isConfigured, deviceSettings.lineId]);
};
