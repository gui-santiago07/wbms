import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import Card from '../../ui/Card';

const TimeDistributionChart: React.FC = () => {
  const { timeDistribution, fetchTimeDistribution } = useProductionStore();

  React.useEffect(() => {
    fetchTimeDistribution();
  }, [fetchTimeDistribution]);

  const data = [
    { label: 'Produzido', value: timeDistribution.produced, color: '#22c55e' },
    { label: 'Parado', value: timeDistribution.stopped, color: '#ef4444' },
    { label: 'Standby', value: timeDistribution.standby, color: '#3b82f6' },
    { label: 'Setup', value: timeDistribution.setup, color: '#f59e0b' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const x1 = radius * Math.cos(startAngle);
    const y1 = radius * Math.sin(startAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);
    
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Utilização De Tempo</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{timeDistribution.totalTime}</div>
          <div className="text-sm text-muted">Tempo Total</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="-100 -100 200 200">
            {data.map((item, index) => {
              const startAngle = currentAngle;
              const endAngle = currentAngle + (item.value / total) * 2 * Math.PI;
              currentAngle = endAngle;
              
              return (
                <path
                  key={index}
                  d={createArc(startAngle, endAngle, 80)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="text-xs text-muted">{item.value.toFixed(2)}%</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TimeDistributionChart; 