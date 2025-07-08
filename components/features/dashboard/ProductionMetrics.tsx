
import React from 'react';
import Card from '../../ui/Card';
import { useProductionStore } from '../../../store/useProductionStore';

interface MetricBarProps {
  label: string;
  value: number | string;
  max?: number | string;
  progress?: number; // 0-100
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, max, progress }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-lg font-semibold text-white">
        {value}
        {max && <span className="text-sm text-muted"> / {max}</span>}
      </span>
    </div>
    {progress !== undefined && (
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
      </div>
    )}
  </div>
);


const ProductionMetrics: React.FC = () => {
    const { productionOrderProgress, possibleProduction, timeInShift, totalShiftTime, avgSpeed, instantSpeed } = useProductionStore(state => state.liveMetrics);
    const orderProgressPercent = (productionOrderProgress / possibleProduction) * 100;
    const timeProgressPercent = (timeInShift / totalShiftTime) * 100;
    const speedProgressPercent = (instantSpeed / (avgSpeed * 1.2)) * 100; // Cap at 120% of avg for visual

  return (
    <Card className="h-full flex flex-col justify-between space-y-4">
        <MetricBar label="Ordem de Produção" value={productionOrderProgress} max={possibleProduction} progress={orderProgressPercent}/>
        <MetricBar label="Tempo no Turno" value={`${timeInShift.toFixed(1)}hr`} max={`${totalShiftTime.toFixed(1)}hr`} progress={timeProgressPercent}/>
        <MetricBar label="Velocidade (Média / Instantânea)" value={`${avgSpeed.toFixed(1)}/hr`} max={`${instantSpeed.toFixed(1)}/hr`} progress={speedProgressPercent} />
    </Card>
  );
};

export default ProductionMetrics;
