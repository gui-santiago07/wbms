import React, { useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useTimelinePolling } from '../../../hooks/useTimelinePolling';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

const ProductionTimeline: React.FC = () => {
  const { 
    timelineEvents, 
    timelineLoading, 
    currentJob
  } = useProductionStore();

  // Usar hook de polling para atualização automática
  const { refreshTimeline } = useTimelinePolling(30000); // 30 segundos

  // Carregar dados da timeline na montagem do componente
  useEffect(() => {
    refreshTimeline();
  }, [refreshTimeline]);

  // Calcular métricas da timeline
  const totalProduced = timelineEvents
    .filter(item => item.status === 'PROD')
    .reduce((sum, item) => sum + (item.count || 0), 0);
  
  const totalDownTime = timelineEvents
    .filter(item => item.status === 'DOWN')
    .reduce((sum, item) => sum + item.duration, 0);
  
  const totalSetupTime = timelineEvents
    .filter(item => item.status === 'SETUP')
    .reduce((sum, item) => sum + item.duration, 0);

  // Formatar tempo em segundos para formato legível
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Limitar eventos para exibição (últimos 10)
  const displayEvents = timelineEvents.slice(-10);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Timeline de Produção</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshTimeline}
            disabled={timelineLoading}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar timeline"
          >
            {timelineLoading ? 'Atualizando...' : '🔄'}
          </button>
          <div className="text-right">
            <div className="text-sm text-muted">OP: {currentJob?.orderId || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {timelineLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-muted">Carregando timeline...</span>
        </div>
      )}

      {/* Timeline Visual */}
      {!timelineLoading && (
        <div className="relative mb-6">
          {displayEvents.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4 overflow-x-auto">
                {displayEvents.map((item, index) => (
                  <div key={item.id} className="flex flex-col items-center min-w-0 flex-shrink-0 mx-1">
                    <div 
                      className="w-4 h-4 rounded-full mb-2"
                      style={{ backgroundColor: item.color }}
                      title={`${item.status} - ${item.reason} (${formatDuration(item.duration)})`}
                    />
                    <div className="text-xs text-muted text-center">{item.time}</div>
                  </div>
                ))}
              </div>
              
              {/* Linha de conexão */}
              <div className="absolute top-2 left-0 right-0 h-0.5 bg-gray-600 -z-10" />
              
              {/* Barras de produção */}
              <div className="flex items-end justify-between h-20 overflow-x-auto">
                {displayEvents.map((item) => (
                  <div key={item.id} className="flex flex-col items-center min-w-0 flex-shrink-0 mx-1">
                    <div 
                      className="w-8 rounded-t transition-all duration-300"
                      style={{ 
                        backgroundColor: item.color,
                        height: item.status === 'PROD' && item.count 
                          ? `${Math.max(10, (item.count / 100) * 60)}px` 
                          : `${Math.max(4, (item.duration / 3600) * 40)}px`
                      }}
                      title={`${item.status} - ${item.reason} (${formatDuration(item.duration)})`}
                    />
                    <div className="text-xs text-muted mt-1 text-center">
                      {item.status === 'PROD' && item.count ? item.count : item.status}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted text-sm">Nenhum evento de produção disponível</div>
            </div>
          )}
        </div>
      )}

      {/* Barra de status horizontal */}
      {!timelineLoading && displayEvents.length > 0 && (
        <div className="flex h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
          {displayEvents.map((item) => (
            <div
              key={item.id}
              className="h-full transition-all duration-300"
              style={{ 
                backgroundColor: item.color,
                width: `${100 / displayEvents.length}%`
              }}
              title={`${item.status} - ${item.reason}`}
            />
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {totalProduced > 0 ? totalProduced : '0'}
          </div>
          <div className="text-xs text-muted">Produzido</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">
            {formatDuration(totalDownTime)}
          </div>
          <div className="text-xs text-muted">Tempo Parado</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-400">
            {formatDuration(totalSetupTime)}
          </div>
          <div className="text-xs text-muted">Setup</div>
        </div>
      </div>

      {/* Lista detalhada de eventos */}
      {!timelineLoading && displayEvents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-white mb-3">Eventos Recentes</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {displayEvents.slice().reverse().map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-white">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">{item.time}</div>
                  <div className="text-xs text-muted">{formatDuration(item.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProductionTimeline; 