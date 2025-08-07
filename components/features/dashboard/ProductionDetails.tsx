
import React from 'react';
import Card from '../../ui/Card';
import { useProductionStore } from '../../../store/useProductionStore';

const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
    <p className="text-sm text-muted">{label}</p>
    <p className="text-md font-semibold text-white text-right">{value}</p>
  </div>
);

const ProductionDetails: React.FC = () => {
  const { 
    currentJob, 
    currentShift, 
    selectedProduct, 
    setShowProductSelectionModal 
  } = useProductionStore();
  
  const productName = useProductionStore(state => state.currentJob?.productName);

  const handleProductChange = () => {
    setShowProductSelectionModal(true);
  };

  if (!currentJob) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-white mb-2">Detalhes da Produção</h3>
        <p className="text-muted">Nenhuma ordem de produção ativa.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">{productName}</h3>
        <div className="flex items-center gap-3">
          {/* Indicador do turno */}
          <div className="text-sm text-muted">
            {currentShift?.name || 'Turno Ativo'}
          </div>
          
          {/* Seletor de produto */}
          <button
            onClick={handleProductChange}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
            {selectedProduct ? 'Trocar Produto' : 'Escolher Produto'}
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <DetailItem label="ORDEM DE PRODUÇÃO" value={currentJob.orderId} />
        <DetailItem label="QUANTIDADE OP" value={currentJob.orderQuantity} />
        <DetailItem label="NO DO PRODUTO" value={currentJob.productId} />
        <DetailItem label="DESCRIÇÃO" value={currentJob.productName} />
      </div>
    </Card>
  );
};

export default ProductionDetails;
