import { useEffect, useRef } from 'react';
import { pollingManager } from '../services/api';

/**
 * Hook utilitário para criar intervalos de polling que são automaticamente
 * gerenciados pelo sistema centralizado
 */
export const useManagedPolling = (
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean = true,
  immediate: boolean = true
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Executar callback imediatamente se solicitado
    if (immediate) {
      callback();
    }

    // Criar intervalo
    const interval = setInterval(callback, intervalMs);
    intervalRef.current = interval;

    // Registrar no sistema centralizado
    pollingManager.registerInterval(interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        pollingManager.unregisterInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [callback, intervalMs, enabled, immediate]);

  // Função para limpar o intervalo manualmente
  const clearPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      pollingManager.unregisterInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Função para reiniciar o polling
  const restartPolling = () => {
    clearPolling();
    if (enabled) {
      const interval = setInterval(callback, intervalMs);
      intervalRef.current = interval;
      pollingManager.registerInterval(interval);
    }
  };

  return {
    clearPolling,
    restartPolling,
    isActive: !!intervalRef.current
  };
};

/**
 * Função utilitária para criar um intervalo gerenciado fora de hooks
 */
export const createManagedInterval = (
  callback: () => void | Promise<void>,
  intervalMs: number
): NodeJS.Timeout => {
  const interval = setInterval(callback, intervalMs);
  pollingManager.registerInterval(interval);
  return interval;
};

/**
 * Função utilitária para limpar um intervalo gerenciado
 */
export const clearManagedInterval = (interval: NodeJS.Timeout): void => {
  clearInterval(interval);
  pollingManager.unregisterInterval(interval);
};

/**
 * Função para obter estatísticas do sistema de polling
 */
export const getPollingStats = () => {
  return {
    activeIntervals: pollingManager.getActiveIntervalsCount()
  };
}; 