
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';

const StatusDisplay: React.FC = () => {
  const { productionStatus, updateProductionStatus } = useProductionStore();

  // Atualizar status quando o componente montar
  React.useEffect(() => {
    updateProductionStatus();
  }, [updateProductionStatus]);

  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-lg">
      <div 
        className="w-3 h-3 rounded-full animate-pulse"
        style={{ backgroundColor: productionStatus.color }}
      />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{productionStatus.icon}</span>
        <span 
          className="text-lg font-bold"
          style={{ color: productionStatus.color }}
        >
          {productionStatus.status}
        </span>
      </div>
      
      {/* Tempo Produzindo */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm text-muted">Produzindo:</span>
        <span className="text-sm font-semibold text-white">
          {productionStatus.producingTime}
        </span>
        <span className="text-sm text-muted">
          ({productionStatus.producingPercentage}%)
        </span>
      </div>
      
      {/* Tempo Parado */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm text-muted">Parado:</span>
        <span className="text-sm font-semibold text-red-400">
          {productionStatus.stoppedTime}
        </span>
      </div>
    </div>
  );
};

export default StatusDisplay;
