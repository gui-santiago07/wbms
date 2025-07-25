import { useEffect, useRef } from 'react';
import { useProductionControlStore } from '../store/useProductionControlStore';

interface UseProductionPollingOptions {
  interval?: number; // em milissegundos
  enabled?: boolean;
}

export const useProductionPolling = (options: UseProductionPollingOptions = {}) => {
  const { interval = 30000, enabled = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    currentTimesheet,
    isPolling,
    startPolling,
    stopPolling,
    updateProductionStatus
  } = useProductionControlStore();

  // Iniciar polling quando há produção ativa
  useEffect(() => {
    if (enabled && currentTimesheet && !isPolling) {
      startPolling();
    }
  }, [enabled, currentTimesheet, isPolling, startPolling]);

  // Parar polling quando não há produção ativa
  useEffect(() => {
    if (!currentTimesheet && isPolling) {
      stopPolling();
    }
  }, [currentTimesheet, isPolling, stopPolling]);

  // Limpar intervalo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Função para forçar atualização
  const forceUpdate = () => {
    if (currentTimesheet) {
      updateProductionStatus();
    }
  };

  return {
    isPolling,
    forceUpdate,
    currentTimesheet
  };
}; 