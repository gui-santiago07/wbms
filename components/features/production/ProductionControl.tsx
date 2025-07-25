import React, { useEffect, useState } from 'react';
import { useProductionControlStore } from '../../../store/useProductionControlStore';
import { ProductionLine, Product } from '../../../types';
import ProductionStatus from './ProductionStatus';
import ProductionSetup from './ProductionSetup';
import ProductionControls from './ProductionControls';
import ProductionHistory from './ProductionHistory';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';
import Card from '../../ui/Card';

const ProductionControl: React.FC = () => {
  const {
    currentTimesheet,
    productionStatus,
    availableLines,
    availableProducts,
    isLoading,
    error,
    isPolling,
    checkActiveProduction,
    loadAvailableLines,
    loadAvailableProducts,
    clearError
  } = useProductionControlStore();

  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Verificar produção ativa primeiro
        await checkActiveProduction();
        
        // Carregar dados de suporte
        await Promise.all([
          loadAvailableLines(),
          loadAvailableProducts()
        ]);
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
      }
    };

    initializeData();
  }, []);

  // Limpar erro quando componente for desmontado
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  const handleLineSelect = (line: ProductionLine) => {
    setSelectedLine(line);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleStartNewProduction = () => {
    setSelectedLine(null);
    setSelectedProduct(null);
  };

  if (isLoading && !currentTimesheet) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Carregando dados de produção...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Controle de Produção
        </h1>
        {isPolling && (
          <div className="flex items-center text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Monitoramento ativo
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={clearError}
        />
      )}

      {/* Status atual da produção */}
      {currentTimesheet && productionStatus && (
        <ProductionStatus 
          timesheet={currentTimesheet}
          status={productionStatus}
        />
      )}

      {/* Controles de produção */}
      {currentTimesheet && (
        <ProductionControls 
          timesheet={currentTimesheet}
          status={productionStatus}
        />
      )}

      {/* Histórico de eventos */}
      {currentTimesheet && (
        <ProductionHistory 
          timesheetId={currentTimesheet.id}
        />
      )}

      {/* Setup para nova produção */}
      {!currentTimesheet && (
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma produção ativa
            </h2>
            <p className="text-gray-600 mb-6">
              Inicie uma nova produção selecionando uma linha e produto
            </p>
            <button
              onClick={handleStartNewProduction}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Iniciar Nova Produção
            </button>
          </div>
        </Card>
      )}

      {/* Modal de setup */}
      {!currentTimesheet && (selectedLine || selectedProduct) && (
        <ProductionSetup
          selectedLine={selectedLine}
          selectedProduct={selectedProduct}
          availableLines={availableLines}
          onLineSelect={handleLineSelect}
          onProductSelect={handleProductSelect}
          onCancel={() => {
            setSelectedLine(null);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductionControl; 