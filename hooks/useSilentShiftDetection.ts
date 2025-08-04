import { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';

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

    return () => clearInterval(interval);
  }, [checkShiftIfNeeded]);

  // Verificar turno na inicialização
  useEffect(() => {
    checkShiftIfNeeded();
  }, [checkShiftIfNeeded]);
}; 