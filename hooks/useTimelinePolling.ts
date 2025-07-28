import { useEffect, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';

/**
 * Hook para gerenciar o polling da timeline de produção
 * Atualiza os dados a cada 30 segundos, mas apenas se a aplicação estiver ativa
 */
export const useTimelinePolling = (intervalMs: number = 30000) => {
  const { fetchTimelineData, timelineLoading } = useProductionStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    // Função para verificar se a aplicação está ativa
    const checkActivity = () => {
      isActiveRef.current = !document.hidden;
    };

    // Função para atualizar a timeline
    const updateTimeline = async () => {
      // Só atualizar se a aplicação estiver ativa e não estiver carregando
      if (isActiveRef.current && !timelineLoading) {
        try {
          await fetchTimelineData();
        } catch (error) {
          console.warn('⚠️ Erro no polling da timeline (tratado silenciosamente):', error);
        }
      }
    };

    // Configurar listeners para detectar quando a aplicação fica ativa/inativa
    document.addEventListener('visibilitychange', checkActivity);
    window.addEventListener('focus', checkActivity);
    window.addEventListener('blur', checkActivity);

    // Iniciar polling
    intervalRef.current = setInterval(updateTimeline, intervalMs);

    // Limpeza ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', checkActivity);
      window.removeEventListener('focus', checkActivity);
      window.removeEventListener('blur', checkActivity);
    };
  }, [fetchTimelineData, timelineLoading, intervalMs]);

  // Retornar função para atualização manual
  return {
    refreshTimeline: fetchTimelineData
  };
}; 