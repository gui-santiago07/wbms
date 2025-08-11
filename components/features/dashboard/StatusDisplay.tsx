
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';

const StatusDisplay: React.FC = () => {
  const { deviceStatus, apiProductionStatus } = useProductionStore();

  // Função para mapear status do dispositivo para ícone e cor
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'producing':
        return {
          icon: '▶️',
          color: '#22c55e',
          label: 'PRODUZINDO'
        };
      case 'stopped':
      case 'setup':
      case 'standby':
      case 'error':
      case 'offline':
      default:
        return {
          icon: '⏸️',
          color: '#ef4444',
          label: 'PARADO'
        };
    }
  };

  // Lógica para determinar o status final considerando a API e o dispositivo
  const getFinalStatus = () => {
    // Se a API indica que há produção ativa, mostrar como PRODUZINDO
    if (apiProductionStatus.hasActiveProduction) {
      return {
        icon: '▶️',
        color: '#22c55e',
        label: 'PRODUZINDO'
      };
    }
    
    // Se não há produção ativa na API, usar o status do dispositivo
    // Mapear 'producing' para PRODUZINDO, outros para PARADO
    return getStatusInfo(deviceStatus.status);
  };

  const statusInfo = getFinalStatus();

  // Determinar se o status está sendo controlado pela API ou pelo dispositivo
  const isApiControlled = apiProductionStatus.hasActiveProduction;
  const isDeviceProducing = deviceStatus.status.toLowerCase() === 'producing';

  return (
    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg">
      <div 
        className={`w-2.5 h-2.5 rounded-full ${deviceStatus.isLoading ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: statusInfo.color }}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{statusInfo.icon}</span>
        <span 
          className="text-sm font-bold"
          style={{ color: statusInfo.color }}
          title={
            isApiControlled 
              ? "Status determinado pela API (produção ativa)" 
              : isDeviceProducing 
                ? "Status determinado pelo dispositivo (producing)" 
                : `Status do dispositivo: ${deviceStatus.status}`
          }
        >
          {statusInfo.label}
        </span>
        {/* Indicador sutil da origem do status */}
        {isApiControlled && (
          <span className="text-xs text-blue-400 ml-1" title="Controlado pela API">
            API
          </span>
        )}
      </div>
      
      {/* Informações do dispositivo */}
      {deviceStatus.assetId && (
        <div className="flex items-center gap-1.5 ml-3">
          <span className="text-xs text-muted">Device:</span>
          <span className="text-xs font-semibold text-white">
            {deviceStatus.assetId}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
