import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { pollingManager } from '../services/api';
import ShiftsService from '../services/shiftsService';

/**
 * Hook para detecção silenciosa de turno
 * Funciona em background sem mostrar estados visuais
 * Atualiza automaticamente quando o turno muda
 * Inclui retry automático e fallbacks robustos
 */
export const useSilentShiftDetection = () => {
  const { checkShiftIfNeeded, currentShift, lastShiftCheck } = useProductionStore();
  const lastCheckRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const maxConsecutiveFailures = 3;

  // Função robusta para verificar turno
  const robustShiftCheck = async () => {
    const now = Date.now();
    
    // Evitar verificações muito frequentes
    if (now - lastCheckRef.current < 30000) { // 30 segundos mínimo
      return;
    }
    
    lastCheckRef.current = now;
    
    try {
      console.log('🔄 useSilentShiftDetection: Iniciando verificação silenciosa de turno');
      
      // Verificar saúde da API primeiro
      const apiHealth = await ShiftsService.checkApiHealth();
      
      if (!apiHealth) {
        console.warn('⚠️ useSilentShiftDetection: API indisponível, aguardando próxima verificação');
        consecutiveFailuresRef.current++;
        return;
      }
      
      // Resetar contador de falhas se API está saudável
      consecutiveFailuresRef.current = 0;
      
      // Executar verificação de turno
      await checkShiftIfNeeded();
      
      console.log('✅ useSilentShiftDetection: Verificação de turno concluída com sucesso');
      
    } catch (error) {
      console.error('❌ useSilentShiftDetection: Erro na verificação de turno:', error);
      consecutiveFailuresRef.current++;
      
      // Se muitas falhas consecutivas, tentar recarregar turnos
      if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
        console.warn('⚠️ useSilentShiftDetection: Muitas falhas consecutivas, tentando recarregar turnos');
        try {
          const { loadRealShifts } = useProductionStore.getState();
          await loadRealShifts();
          consecutiveFailuresRef.current = 0;
        } catch (reloadError) {
          console.error('❌ useSilentShiftDetection: Falha ao recarregar turnos:', reloadError);
        }
      }
    }
  };

  // Verificar turno silenciosamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      robustShiftCheck();
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
    // Aguardar um pouco antes da primeira verificação
    const initialCheck = setTimeout(() => {
      robustShiftCheck();
    }, 2000); // 2 segundos

    return () => clearTimeout(initialCheck);
  }, [checkShiftIfNeeded]);

  // Verificar turno quando currentShift mudar
  useEffect(() => {
    if (currentShift) {
      console.log('🔄 useSilentShiftDetection: Turno atual mudou para:', currentShift.name);
      consecutiveFailuresRef.current = 0; // Resetar contador de falhas
    }
  }, [currentShift]);

  return {
    currentShift,
    lastCheck: lastShiftCheck,
    consecutiveFailures: consecutiveFailuresRef.current
  };
}; 