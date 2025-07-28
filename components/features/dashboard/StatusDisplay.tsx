
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';

const StatusDisplay: React.FC = () => {
  const { productionStatus, updateProductionStatus } = useProductionStore();

  // Atualizar status quando o componente montar
  React.useEffect(() => {
    updateProductionStatus();
  }, [updateProductionStatus]);

  return (
    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg">
      <div 
        className="w-2.5 h-2.5 rounded-full animate-pulse"
        style={{ backgroundColor: productionStatus.color }}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{productionStatus.icon}</span>
        <span 
          className="text-sm font-bold"
          style={{ color: productionStatus.color }}
        >
          {productionStatus.status}
        </span>
      </div>
      
      {/* Tempo Produzindo */}
      <div className="flex items-center gap-1.5 ml-3">
        <span className="text-xs text-muted">Produzindo:</span>
        <span className="text-xs font-semibold text-white">
          {productionStatus.producingTime}
        </span>
        <span className="text-xs text-muted">
          ({productionStatus.producingPercentage}%)
        </span>
      </div>
      
      {/* Tempo Parado */}
      <div className="flex items-center gap-1.5 ml-3">
        <span className="text-xs text-muted">Parado:</span>
        <span className="text-xs font-semibold text-red-400">
          {productionStatus.stoppedTime}
        </span>
      </div>
    </div>
  );
};

export default StatusDisplay;
