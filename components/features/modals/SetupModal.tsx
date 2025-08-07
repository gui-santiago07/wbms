import React, { useState } from 'react';
import Card from '../../ui/Card';
import { useProductionStore } from '../../../store/useProductionStore';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (setupData: any) => void;
  clientLineKey?: string;
}

const SetupModal: React.FC<SetupModalProps> = ({ 
  isOpen, 
  onClose, 
  onSetupComplete,
  clientLineKey 
}) => {
  const { 
    setupData, 
    selectedProduct,
    setShowProductSelectionModal,
    startProductionSetup
  } = useProductionStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSetup = async () => {
    // Verificar se há produto selecionado
    if (!selectedProduct) {
      // Se não há produto, abrir modal de seleção de produto
      setShowProductSelectionModal(true);
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Iniciar setup de produção
      await startProductionSetup();
      onSetupComplete(setupData);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao iniciar setup:', error);
      setError('Erro ao iniciar setup. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M12 2v20M2 12h20"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Iniciar Setup</h2>
            <p className="text-muted">
              Deseja iniciar um novo setup de produção?
            </p>
          </div>

          {selectedProduct && (
            <div className="mb-6 p-4 bg-surface rounded-lg">
              <p className="text-sm text-muted mb-2">Produto selecionado:</p>
              <p className="text-white font-semibold">{selectedProduct.description || selectedProduct.name}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartSetup}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Iniciando...' : 'Sim, Iniciar'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SetupModal; 