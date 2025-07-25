import React, { useState, useEffect } from 'react';
import { useProductionControlStore } from '../../../store/useProductionControlStore';
import { ProductionLine, Product } from '../../../types';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface ProductionSetupProps {
  selectedLine: ProductionLine | null;
  selectedProduct: Product | null;
  availableLines: ProductionLine[];
  onLineSelect: (line: ProductionLine) => void;
  onProductSelect: (product: Product) => void;
  onCancel: () => void;
}

const ProductionSetup: React.FC<ProductionSetupProps> = ({
  selectedLine,
  selectedProduct,
  availableLines,
  onLineSelect,
  onProductSelect,
  onCancel
}) => {
  const { 
    availableProducts, 
    loadAvailableProducts, 
    isLoading, 
    error: productsError,
    startSetup 
  } = useProductionControlStore();
  const [setupDescription, setSetupDescription] = useState('');

  // Carregar produtos quando o componente for montado
  useEffect(() => {
    loadAvailableProducts();
  }, [loadAvailableProducts]);

  const handleStartSetup = async () => {
    if (!selectedLine || !selectedProduct) {
      alert('Por favor, selecione uma linha e um produto');
      return;
    }

    try {
      await startSetup({
        line_id: selectedLine.client_line_key,
        product_id: selectedProduct.id,
        setup_description: setupDescription
      });
    } catch (error) {
      console.error('Erro ao iniciar setup:', error);
    }
  };

  const canStartSetup = selectedLine && selectedProduct;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Nova Produção
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Seleção de Linha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Linha de Produção *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableLines.map((line) => (
                <button
                  key={line.client_line_key}
                  onClick={() => onLineSelect(line)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedLine?.client_line_key === line.client_line_key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900">{line.line}</div>
                  {line.description && (
                    <div className="text-sm text-gray-600 mt-1">{line.description}</div>
                  )}
                </button>
              ))}
            </div>
            {availableLines.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma linha disponível</p>
            )}
          </div>

          {/* Seleção de Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Produto *
            </label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-600">Carregando produtos...</span>
              </div>
            ) : productsError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">Erro ao carregar produtos: {productsError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => onProductSelect(product)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {product.description || product.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Código: {product.code || product.internal_code}
                    </div>
                    {product.units_per_package && (
                      <div className="text-sm text-gray-600">
                        Unidades por pacote: {product.units_per_package}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {!isLoading && !productsError && availableProducts.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum produto disponível</p>
            )}
          </div>

          {/* Descrição do Setup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Setup
            </label>
            <textarea
              value={setupDescription}
              onChange={(e) => setSetupDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva as configurações ou observações do setup..."
            />
          </div>

          {/* Resumo da Seleção */}
          {(selectedLine || selectedProduct) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Resumo da Configuração</h4>
              <div className="space-y-2 text-sm">
                {selectedLine && (
                  <div>
                    <span className="font-medium">Linha:</span> {selectedLine.line}
                  </div>
                )}
                {selectedProduct && (
                  <div>
                    <span className="font-medium">Produto:</span> {selectedProduct.description}
                  </div>
                )}
                {setupDescription && (
                  <div>
                    <span className="font-medium">Setup:</span> {setupDescription}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartSetup}
              disabled={isLoading || !canStartSetup}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Iniciando...</span>
                </div>
              ) : (
                'Iniciar Setup'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionSetup; 