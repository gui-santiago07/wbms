import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import AutoApontamentoService from '../services/autoApontamentoService';
import { config } from '../config/environment';
import { pollingManager } from '../services/api';

// Variável global para controlar o polling único
let globalPollingInterval: NodeJS.Timeout | null = null;

export const useProductionDataPolling = (clientLineKey: string | null, enabled: boolean = true) => {
  const { loadProductionData, loadDeviceStatus, loadApiProductionStatus, setupData, loadShiftStatusFromLocalApi } = useProductionStore();

  useEffect(() => {
    if (!enabled || !clientLineKey || !setupData?.line) {
      // Limpar polling global se não estiver habilitado
      if (globalPollingInterval) {
        clearInterval(globalPollingInterval);
        pollingManager.unregisterInterval(globalPollingInterval);
        globalPollingInterval = null;
      }
      return;
    }

    // Carregar dados imediatamente
    loadProductionData();
    loadDeviceStatus(clientLineKey);
    loadApiProductionStatus(clientLineKey);
    loadShiftStatusFromLocalApi();

    // Configurar polling único usando configuração do ambiente
    if (!globalPollingInterval) {
      globalPollingInterval = setInterval(() => {
        loadProductionData();
        loadDeviceStatus(clientLineKey);
        loadApiProductionStatus(clientLineKey);
        loadShiftStatusFromLocalApi();
      }, config.pollingInterval);
      
      // Registrar intervalo no sistema centralizado
      pollingManager.registerInterval(globalPollingInterval);
    }

    // Cleanup: limpar intervalo quando componente for desmontado ou dependências mudarem
    return () => {
      if (globalPollingInterval) {
        clearInterval(globalPollingInterval);
        pollingManager.unregisterInterval(globalPollingInterval);
        globalPollingInterval = null;
      }
    };
  }, [enabled, clientLineKey, setupData?.line, loadProductionData, loadDeviceStatus, loadApiProductionStatus, loadShiftStatusFromLocalApi]);

  // Cleanup adicional quando componente for desmontado
  useEffect(() => {
    return () => {
      if (globalPollingInterval) {
        clearInterval(globalPollingInterval);
        pollingManager.unregisterInterval(globalPollingInterval);
        globalPollingInterval = null;
      }
    };
  }, []);
}; 