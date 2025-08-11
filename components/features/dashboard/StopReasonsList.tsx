import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import Card from '../../ui/Card';

const StopReasonsList: React.FC = () => {
  const { topStopReasons, fetchTopStopReasons } = useProductionStore();

  React.useEffect(() => {
    fetchTopStopReasons();
  }, [fetchTopStopReasons]);

  // Calcular tempo total parado
  const totalStoppedTime = topStopReasons.reduce((total, reason) => {
    const [hours, minutes, seconds] = reason.totalTime.split(':').map(Number);
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Principais Paradas do Dia</h3>
        <div className="text-right">
          <div className="text-lg font-bold text-red-400">
            Total Parado: {formatTime(totalStoppedTime)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {topStopReasons.map((reason, index) => (
          <div 
            key={reason.id}
            className="flex items-center justify-between p-3 bg-surface rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {reason.code}: {reason.description}
                </div>
                <div className="text-xs text-muted">
                  Categoria: {reason.category}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-white">
                  {reason.occurrences}
                </div>
                <div className="text-xs text-muted">Qtd.</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-semibold text-red-400">
                  {reason.totalTime}
                </div>
                <div className="text-xs text-muted">Tempo Parado</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topStopReasons.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted">Nenhuma parada registrada no turno</div>
        </div>
      )}
    </Card>
  );
};

export default StopReasonsList; 