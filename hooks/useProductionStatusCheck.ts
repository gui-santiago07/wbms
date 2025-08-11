import { useEffect, useState } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import AutoApontamentoService from '../services/autoApontamentoService';

interface ProductionStatusCheckResult {
  needsSetup: boolean;
  hasActiveProduction: boolean;
  clientLineKey: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useProductionStatusCheck = (): ProductionStatusCheckResult => {
  const [result, setResult] = useState<ProductionStatusCheckResult>({
    needsSetup: false,
    hasActiveProduction: false,
    clientLineKey: null,
    isLoading: true,
    error: null
  });

  const { 
    loadDeviceStatus, 
    loadApiProductionStatus, 
    setSelectedProduct,
    setSetupData
  } = useProductionStore();

  useEffect(() => {
    const checkStatus = async () => {
      setResult(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // 1. Carregar produto selecionado do cache
        const cachedProduct = localStorage.getItem('selected_product');
        if (cachedProduct) {
          try {
            const product = JSON.parse(cachedProduct);
            setSelectedProduct(product);
            console.log('✅ Produto carregado do cache:', product);
          } catch (error) {
            console.warn('⚠️ Erro ao carregar produto do cache:', error);
          }
        } else {
          console.log('ℹ️ Nenhum produto encontrado no cache');
        }

        // 2. Carregar setupData do cache
        const cachedSetupData = localStorage.getItem('setup_data');
        if (cachedSetupData) {
          try {
            const setupData = JSON.parse(cachedSetupData);
            setSetupData(setupData);
            console.log('✅ SetupData carregado do cache:', setupData);
          } catch (error) {
            console.warn('⚠️ Erro ao carregar setupData do cache:', error);
          }
        } else {
          console.log('ℹ️ Nenhum setupData encontrado no cache');
        }

        // 3. Buscar todas as linhas disponíveis
        const allDevices = await AutoApontamentoService.getAllDevices();
        
        if (!allDevices.success || allDevices.devices.length === 0) {
          setResult({
            needsSetup: true,
            hasActiveProduction: false,
            clientLineKey: null,
            isLoading: false,
            error: 'Nenhuma linha de produção disponível'
          });
          return;
        }

        // 4. Se há apenas uma linha, usar ela diretamente
        if (allDevices.devices.length === 1) {
          const device = allDevices.devices[0];
          const clientLineKey = device.line.client_line_key;
          
          // 5. Verificar status da linha
          const status = await AutoApontamentoService.getLineStatus(clientLineKey);
          
          // 6. Carregar status do dispositivo e da API
          await loadDeviceStatus(clientLineKey);
          await loadApiProductionStatus(clientLineKey);
          
          setResult({
            needsSetup: status.needs_setup,
            hasActiveProduction: status.has_active_production,
            clientLineKey: clientLineKey,
            isLoading: false,
            error: null
          });
          return;
        }

        // 7. Se há múltiplas linhas, precisamos de seleção
        // Por enquanto, usar a primeira linha como padrão
        const device = allDevices.devices[0];
        const clientLineKey = device.line.client_line_key;
        
        const status = await AutoApontamentoService.getLineStatus(clientLineKey);
        
        // 8. Carregar status do dispositivo e da API
        await loadDeviceStatus(clientLineKey);
        await loadApiProductionStatus(clientLineKey);
        
        setResult({
          needsSetup: status.needs_setup,
          hasActiveProduction: status.has_active_production,
          clientLineKey: clientLineKey,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('❌ Erro ao verificar status de produção:', error);
        setResult({
          needsSetup: true,
          hasActiveProduction: false,
          clientLineKey: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    };

    checkStatus();
  }, [loadDeviceStatus, loadApiProductionStatus, setSelectedProduct, setSetupData]);

  return result;
}; 