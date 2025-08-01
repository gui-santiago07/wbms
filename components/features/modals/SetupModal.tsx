
import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import Option7ApiService from '../../../services/option7ApiService';
import TimesheetService from '../../../services/timesheetService';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface Product {
  id: number;
  nome: string;
  codigo: string;
  linha_id: number;
  setor_id: number;
  planta_id: number;
}

const SetupModal: React.FC = () => {
  const { deviceSettings } = useDeviceSettingsStore();
  const { currentShift, startProduction } = useProductionStore();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupTime, setSetupTime] = useState(30); // minutos

  const apiService = new Option7ApiService();
  const timesheetService = new TimesheetService();

  // Carregar produtos disponíveis para a linha
  useEffect(() => {
    if (deviceSettings.isConfigured) {
      loadAvailableProducts();
    }
  }, [deviceSettings]);

  const loadAvailableProducts = async () => {
    try {
      setIsLoading(true);
      setError('');

      const products = await apiService.getProducts(
        [parseInt(deviceSettings.plantId)],
        [parseInt(deviceSettings.sectorId)],
        [parseInt(deviceSettings.lineId)]
      );
      setAvailableProducts(products);
    } catch (error) {
      setError('Erro ao carregar produtos');
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleStartProduction = async () => {
    if (!selectedProduct) return;

    try {
      setIsLoading(true);
      
      // Atualizar produto no device settings
      await useDeviceSettingsStore.getState().setDeviceSettings({
        productId: selectedProduct.id.toString(),
        productName: selectedProduct.nome
      });

      // ✅ CORRETO - Criar evento de setup na timeline
      if (currentShift) {
        const now = new Date();
        const setupEndTime = new Date(now.getTime() + setupTime * 60 * 1000); // setupTime minutos de setup
        
        await timesheetService.createTimelineEvent({
          shift_number_key: currentShift.id,
          start_time: now.toISOString(),
          end_time: setupEndTime.toISOString(),
          tipo: 'SETUP',
          descricao_text: `Setup ${selectedProduct.nome}`
        });
      }

      // Iniciar produção
      startProduction();
      
    } catch (error) {
      setError('Erro ao iniciar produção');
      console.error('Erro ao iniciar produção:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="text-center">
        <h2 className="text-3xl font-bold text-white">Setup em Progresso</h2>
        <p className="text-5xl font-mono font-black text-primary mt-2">00:29:57</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-3">Produtos Disponíveis</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-muted">Carregando...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">Erro: {error}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedProduct?.id === product.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <p className="font-bold">{product.nome}</p>
                  <p className="text-sm">{product.codigo}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">Produto Selecionado</h3>
          {selectedProduct ? (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-muted">{selectedProduct.codigo}</p>
              <p className="text-lg font-bold text-white">{selectedProduct.nome}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-700/50 rounded-lg">
              <p className="text-muted">Selecione um produto</p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleStartProduction}
          disabled={!selectedProduct || isLoading}
          className="w-full max-w-md bg-success text-white font-bold text-xl py-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-500"
        >
          {isLoading ? 'Iniciando...' : 'Iniciar Produção'}
        </button>
      </div>
    </div>
  );
};

export default SetupModal;
