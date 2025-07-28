import { useProductionStore } from '../store/useProductionStore';
import { ViewState } from '../types';

export const useMachineControlsVisibility = () => {
  const { view, isLoading } = useProductionStore();
  
  console.log('🔍 useMachineControlsVisibility:', { view, isLoading });
  
  // Sempre mostrar se estamos em uma view principal
  if (view === ViewState.DASHBOARD || view === ViewState.OEE) {
    console.log('✅ MachineControls: Mostrando para view principal');
    return true;
  }
  
  // Mostrar em STOP_REASON se não estiver carregando
  if (view === ViewState.STOP_REASON && !isLoading) {
    console.log('✅ MachineControls: Mostrando para STOP_REASON');
    return true;
  }
  
  // Fallback: se não temos view válida, mostrar
  if (!view) {
    console.log('✅ MachineControls: Mostrando por fallback (view inválida)');
    return true;
  }
  
  console.log('❌ MachineControls: Não mostrando');
  return false;
}; 