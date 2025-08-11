// Função para limpar dados inválidos do localStorage
export const clearInvalidData = () => {
  console.log('🔄 Limpando dados inválidos do localStorage...');
  localStorage.removeItem('setup_data');
  localStorage.removeItem('selected_product');
};

// Função completa para limpar todos os caches do sistema
export const clearAllCaches = () => {
  console.log('🧹 Utils: Iniciando limpeza completa de caches...');
  
  // 1. Limpar intervalos de polling
  try {
    const { pollingManager } = require('../services/api');
    pollingManager.clearAllIntervals();
  } catch (error) {
    console.warn('⚠️ Erro ao limpar intervalos de polling:', error);
  }
  
  // 2. Limpar caches de dados em memória
  try {
    // Limpar cache de timeline
    const { clearCache: clearTimelineCache } = require('../hooks/useTimelineData');
    if (clearTimelineCache) {
      clearTimelineCache();
    }
    
    // Limpar cache de OEE
    const { oeeCache } = require('../hooks/useOeeData');
    if (oeeCache && oeeCache.clear) {
      oeeCache.clear();
    }
  } catch (error) {
    console.warn('⚠️ Erro ao limpar caches em memória:', error);
  }
  
  // 3. Limpar localStorage (exceto configurações que devem persistir)
  const keysToRemove = [
    'oee_user',
    'mobile_api_token',
    'user_name',
    'setup_data',
    'selected_product',
    'auth_token',
    'production_data',
    // Persistências do Zustand
    'production-store'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // 4. Limpar stores Zustand que usam persist
  try {
    // Limpar store de produção (apenas dados sensíveis)
    const { useProductionStore } = require('../store/useProductionStore');
    const productionStore = useProductionStore.getState();
    
    // Resetar apenas dados sensíveis, mantendo configurações
    productionStore.setMachineStatus('STOPPED');
    productionStore.setView('DASHBOARD');
    productionStore.clearError();
    
    // Limpar dados de produção ativa
    if (productionStore.setCurrentShift) {
      productionStore.setCurrentShift(null);
    }
    if (productionStore.setCurrentProductionLine) {
      productionStore.setCurrentProductionLine(null);
    }
    
    // Limpar store da timeline (seleções)
    const { useTimelineStore } = require('../store/useTimelineStore');
    useTimelineStore.getState().clearTimelineData();
    
  } catch (error) {
    console.warn('⚠️ Erro ao limpar stores Zustand:', error);
  }
  
  // 5. Limpar sessionStorage se houver
  sessionStorage.clear();
  
  console.log('✅ Utils: Limpeza de caches concluída');
};

// Função para limpar apenas caches de dados (sem afetar configurações)
export const clearDataCaches = () => {
  console.log('🧹 Utils: Limpando apenas caches de dados...');
  
  // Limpar caches em memória
  try {
    const { clearCache: clearTimelineCache } = require('../hooks/useTimelineData');
    if (clearTimelineCache) {
      clearTimelineCache();
    }
    
    const { oeeCache } = require('../hooks/useOeeData');
    if (oeeCache && oeeCache.clear) {
      oeeCache.clear();
    }
  } catch (error) {
    console.warn('⚠️ Erro ao limpar caches de dados:', error);
  }
  
  // Limpar dados temporários do localStorage
  const dataKeysToRemove = [
    'setup_data',
    'selected_product'
  ];
  
  dataKeysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Utils: Limpeza de caches de dados concluída');
}; 