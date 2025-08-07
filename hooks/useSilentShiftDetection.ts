import { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { pollingManager } from '../services/api';

/**
 * Hook para detecção silenciosa de turno
 * Funciona em background sem mostrar estados visuais
 * Atualiza automaticamente quando o turno muda
 */
export const useSilentShiftDetection = () => {
  const { checkShiftIfNeeded } = useProductionStore();

  // Verificar turno silenciosamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      checkShiftIfNeeded();
    }, 5 * 60 * 1000); // 5 minutos

    // Registrar intervalo no sistema centralizado
    pollingManager.registerInterval(interval);

    return () => {
      clearInterval(interval);
      pollingManager.unregisterInterval(interval);
    };
  }, [checkShiftIfNeeded]);

  // Verificar turno na inicialização
  useEffect(() => {
    checkShiftIfNeeded();
  }, [checkShiftIfNeeded]);
}; 