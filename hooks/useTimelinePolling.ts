import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useTimelineStore } from '../store/useTimelineStore';
import { pollingManager } from '../services/api';

/**
 * Hook otimizado para gerenciar o polling da timeline de produção
 * Usa sistema inteligente de fila e cache para evitar requisições desnecessárias
 */
export const useTimelinePolling = (intervalMs: number = 30000) => {
  const { fetchTimelineData, getCacheStats } = useProductionStore();
  const { selectedLines, hasGeneratedTimeline } = useTimelineStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);
  const lastPollTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  const maxConsecutiveErrors = 3;

  useEffect(() => {
    // Função para verificar se a aplicação está ativa
    const checkActivity = () => {
      isActiveRef.current = !document.hidden && document.hasFocus();
    };

    // Função otimizada para atualizar a timeline
    const updateTimeline = async () => {
      const now = Date.now();
      
      // Só atualizar se:
      // 1. A aplicação estiver ativa
      // 2. Houver linhas selecionadas
      // 3. A timeline tiver sido gerada
      // 4. Passou tempo suficiente desde a última requisição
      // 5. Não há muitos erros consecutivos
      if (isActiveRef.current && 
          selectedLines.length > 0 && 
          hasGeneratedTimeline &&
          (now - lastPollTimeRef.current) >= intervalMs &&
          consecutiveErrorsRef.current < maxConsecutiveErrors) {
        
        try {
          console.log('🔄 Polling: Atualizando timeline...');
          lastPollTimeRef.current = now;
          
          await fetchTimelineData();
          
          // Reset contador de erros em caso de sucesso
          consecutiveErrorsRef.current = 0;
          
          // Log estatísticas do cache
          const stats = getCacheStats();
          console.log('📊 Cache stats:', stats);
          
        } catch (error) {
          consecutiveErrorsRef.current++;
          console.warn(`⚠️ Erro no polling da timeline (${consecutiveErrorsRef.current}/${maxConsecutiveErrors}):`, error);
          
          // Se muitos erros consecutivos, aumentar intervalo
          if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
            console.warn('🚨 Muitos erros consecutivos, aumentando intervalo de polling');
          }
        }
      } else {
        // Log detalhado quando não atualiza
        if (!isActiveRef.current) {
          console.log('⏸️ Polling pausado: aplicação inativa');
        } else if (selectedLines.length === 0) {
          console.log('⏸️ Polling pausado: nenhuma linha selecionada');
        } else if (!hasGeneratedTimeline) {
          console.log('⏸️ Polling pausado: timeline não gerada');
        } else if ((now - lastPollTimeRef.current) < intervalMs) {
          console.log('⏸️ Polling pausado: aguardando intervalo');
        } else if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
          console.log('⏸️ Polling pausado: muitos erros consecutivos');
        }
      }
    };

    // Configurar event listeners para detectar atividade
    document.addEventListener('visibilitychange', checkActivity);
    window.addEventListener('focus', checkActivity);
    window.addEventListener('blur', checkActivity);

    // Iniciar polling apenas se houver condições válidas
    if (selectedLines.length > 0 && hasGeneratedTimeline) {
      console.log('🚀 Iniciando polling otimizado da timeline');
      intervalRef.current = setInterval(updateTimeline, intervalMs);
      
      // Registrar intervalo no sistema centralizado
      if (intervalRef.current) {
        pollingManager.registerInterval(intervalRef.current);
      }
      
      // Primeira execução imediata
      updateTimeline();
    } else {
      console.log('⏸️ Polling não iniciado: condições não atendidas');
    }

    // Limpeza ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        pollingManager.unregisterInterval(intervalRef.current);
        console.log('🛑 Polling da timeline interrompido');
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', checkActivity);
      window.removeEventListener('focus', checkActivity);
      window.removeEventListener('blur', checkActivity);
    };
  }, [fetchTimelineData, selectedLines.length, hasGeneratedTimeline, intervalMs, getCacheStats]);

  // Função para forçar atualização manual
  const refreshTimeline = async () => {
    if (selectedLines.length > 0 && hasGeneratedTimeline) {
      console.log('🔄 Forçando atualização manual da timeline');
      lastPollTimeRef.current = 0; // Reset para permitir atualização imediata
      consecutiveErrorsRef.current = 0; // Reset contador de erros
      await fetchTimelineData();
    }
  };

  return {
    refreshTimeline,
    isActive: isActiveRef.current,
    consecutiveErrors: consecutiveErrorsRef.current,
    lastPollTime: lastPollTimeRef.current
  };
}; 