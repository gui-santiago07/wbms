import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import Card from '../../ui/Card';

const ProductionTimeline: React.FC = () => {
  const { liveMetrics, currentJob } = useProductionStore();

  // Em implementação real, os dados viriam da API
  // Por enquanto, usar dados vazios
  const timelineData: Array<{ time: string; status: string; count: number; color: string }> = [];

  const totalProduced = timelineData
    .filter(item => item.status === 'PROD')
    .reduce((sum, item) => sum + item.count, 0);
  
  const totalRejected = timelineData
    .filter(item => item.status === 'REJ')
    .reduce((sum, item) => sum + item.count, 0);

  const rejectionRate = totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Timeline de Produção</h3>
        <div className="text-right">
          <div className="text-sm text-muted">OP: {currentJob?.orderId || 'N/A'}</div>
        </div>
      </div>

      {/* Timeline Visual */}
      <div className="relative mb-6">
        {timelineData.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              {timelineData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-4 h-4 rounded-full mb-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="text-xs text-muted">{item.time}</div>
                </div>
              ))}
            </div>
            
            {/* Linha de conexão */}
            <div className="absolute top-2 left-0 right-0 h-0.5 bg-gray-600 -z-10" />
            
            {/* Barras de produção */}
            <div className="flex items-end justify-between h-20">
              {timelineData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 rounded-t transition-all duration-300"
                    style={{ 
                      backgroundColor: item.color,
                      height: item.count > 0 ? `${Math.max(10, (item.count / 4000) * 60)}px` : '4px'
                    }}
                  />
                  <div className="text-xs text-muted mt-1">
                    {item.status === 'PROD' ? item.count : item.status}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted text-sm">Nenhum dado de timeline disponível</div>
          </div>
        )}
      </div>

      {/* Barra de status horizontal */}
      {timelineData.length > 0 && (
        <div className="flex h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
          {timelineData.map((item, index) => (
            <div
              key={index}
              className="h-full transition-all duration-300"
              style={{ 
                backgroundColor: item.color,
                width: `${100 / timelineData.length}%`
              }}
            />
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">PROD {totalProduced}</div>
          <div className="text-xs text-muted">Produzido</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">REJ {totalRejected}</div>
          <div className="text-xs text-muted">Rejeitos</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">REJ {rejectionRate.toFixed(1)}%</div>
          <div className="text-xs text-muted">Taxa Rejeição</div>
        </div>
      </div>
    </Card>
  );
};

export default ProductionTimeline; 