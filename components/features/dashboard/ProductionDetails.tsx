
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
  const currentJob = useProductionStore((state) => state.currentJob);
  const productName = useProductionStore(state => state.currentJob?.productName);

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
      <h3 className="text-lg font-bold text-white mb-2">{productName}</h3>
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
