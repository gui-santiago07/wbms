
import { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';

export const useLiveDataPolling = (intervalMs: number) => {
  const fetchLiveData = useProductionStore((state) => state.fetchLiveData);
  const machineStatus = useProductionStore((state) => state.machineStatus);

  useEffect(() => {
    // Polling sempre ativo para receber atualizações da API
    const intervalId = setInterval(async () => {
      try {
        await fetchLiveData();
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [fetchLiveData, intervalMs]);
};
