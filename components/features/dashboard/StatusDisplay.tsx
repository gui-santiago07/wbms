
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';

const StatusDisplay: React.FC = () => {
  const { deviceStatus } = useProductionStore();

  // Função para mapear status do dispositivo para ícone e cor
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return {
          icon: '▶️',
          color: '#22c55e',
          label: 'PRODUZINDO'
        };
      case 'stopped':
        return {
          icon: '⏸️',
          color: '#ef4444',
          label: 'PARADO'
        };
      case 'setup':
        return {
          icon: '🔧',
          color: '#3b82f6',
          label: 'SETUP'
        };
      case 'standby':
        return {
          icon: '⏸️',
          color: '#f59e0b',
          label: 'STANDBY'
        };
      case 'error':
        return {
          icon: '⚠️',
          color: '#ef4444',
          label: 'ERRO'
        };
      case 'aguardando...':
      default:
        return {
          icon: '⏳',
          color: '#6b7280',
          label: 'AGUARDANDO...'
        };
    }
  };

  const statusInfo = getStatusInfo(deviceStatus.status);

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
        >
          {statusInfo.label}
        </span>
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
