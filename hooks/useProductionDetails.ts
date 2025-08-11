import { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';

/**
 * Hook personalizado para gerenciar o carregamento dos Production Details
 * Carrega automaticamente os detalhes quando o turno muda
 */
export const useProductionDetails = () => {
  const { currentShift, productionDetails, loadProductionDetails } = useProductionStore();

  useEffect(() => {
    if (currentShift?.id) {
      loadProductionDetails(currentShift.id);
    }
  }, [currentShift?.id, loadProductionDetails]);

  return {
    productionDetails,
    isLoading: !productionDetails && !!currentShift?.id,
    hasData: !!productionDetails
  };
}; 