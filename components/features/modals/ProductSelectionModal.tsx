import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

const ProductSelectionModal: React.FC = () => {
  const { 
    setupTypes, 
    selectProduct, 
    startProductSetup, 
    setShowProductSelectionModal,
    availableProducts,
    loadAvailableProducts,
    isLoading,
    error
  } = useProductionStore();
  
  const [selectedSetupType, setSelectedSetupType] = useState<string>('');
  const [willHaveSetup, setWillHaveSetup] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Carregar produtos quando o modal for aberto
  useEffect(() => {
    loadAvailableProducts();
  }, [loadAvailableProducts]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    selectProduct(productId);
  };

  const handleSubmit = () => {
    if (willHaveSetup && selectedSetupType) {
      startProductSetup(selectedSetupType);
    } else {
      setShowProductSelectionModal(false);
    }
  };

  const handleCancel = () => {
    setShowProductSelectionModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Seleção de Produto</h2>
          <button
            onClick={handleCancel}
            className="text-muted hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Seleção de Produto */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Produto em Produção</h3>
            
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-muted">Carregando produtos...</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">Erro ao carregar produtos: {error}</p>
              </div>
            )}
            
            {!isLoading && !error && (
              <div className="space-y-3">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedProductId === product.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-surface hover:border-gray-500'
                    }`}
                    onClick={() => handleProductSelect(product.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {product.description || product.name}
                        </div>
                        <div className="text-xs text-muted">
                          Código: {product.code || product.internal_code}
                        </div>
                      </div>
                      {selectedProductId === product.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opção de Setup */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="willHaveSetup"
                checked={willHaveSetup}
                onChange={(e) => setWillHaveSetup(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="willHaveSetup" className="text-lg font-semibold text-white">
                Iniciar Setup para Troca de Produto
              </label>
            </div>

            {willHaveSetup && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted">Tipo de Setup</h4>
                {setupTypes.map((setupType) => (
                  <div
                    key={setupType.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedSetupType === setupType.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-surface hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedSetupType(setupType.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {setupType.name}
                        </div>
                        <div className="text-xs text-muted">
                          {setupType.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted">
                          Tempo estimado: {setupType.estimatedTime}
                        </div>
                        {selectedSetupType === setupType.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              {willHaveSetup ? 'Iniciar Setup' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductSelectionModal; 