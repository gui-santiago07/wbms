import { useProductionStore } from '../store/useProductionStore';
import { ViewState } from '../types';

export const useMachineControlsVisibility = () => {
  const { view, isLoading } = useProductionStore();
  
  // Sempre mostrar se estamos em uma view principal
  if (view === ViewState.DASHBOARD || view === ViewState.OEE) {
    return true;
  }
  
  // Mostrar em STOP_REASON ou PAUSE_REASON se não estiver carregando
  if ((view === ViewState.STOP_REASON || view === ViewState.PAUSE_REASON) && !isLoading) {
    return true;
  }
  
  // Fallback: se não temos view válida, mostrar
  if (!view) {
    return true;
  }
  
  return false;
}; 