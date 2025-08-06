import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import AutoApontamentoService from '../services/autoApontamentoService';

export const useProductionDataPolling = (clientLineKey: string | null, enabled: boolean = true) => {
  const { loadProductionData, loadDeviceStatus, setupData } = useProductionStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !clientLineKey || !setupData?.line) {
      return;
    }

    // Carregar dados imediatamente
    loadProductionData();
    loadDeviceStatus(clientLineKey);

    // Configurar polling a cada 5 segundos
    intervalRef.current = setInterval(() => {
      loadProductionData();
      loadDeviceStatus(clientLineKey);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, clientLineKey, setupData?.line, loadProductionData, loadDeviceStatus]);

  // Limpar intervalo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}; 