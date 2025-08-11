import React from 'react';
import Card from '../../ui/Card';
import { Device } from '../../../types/device';

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

const DeviceList: React.FC<DeviceListProps> = ({ 
  devices, 
  selectedDeviceId, 
  onSelectDevice, 
  onCreateNew, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Dispositivos WBMS</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-surface rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Dispositivos WBMS</h2>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Adicionar Novo
        </button>
      </div>

      <div className="space-y-3">
        {devices.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-muted mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
                <rect width="20" height="14" x="2" y="3" rx="2"/>
                <line x1="8" x2="16" y1="21" y2="21"/>
                <line x1="12" x2="12" y1="17" y2="21"/>
              </svg>
              <p className="text-lg">Nenhum dispositivo cadastrado</p>
              <p className="text-sm">Clique em "Adicionar Novo" para começar</p>
            </div>
          </Card>
        ) : (
          devices.map((device) => (
            <Card 
              key={device.id} 
              className={`cursor-pointer transition-all hover:bg-surface/80 ${
                selectedDeviceId === device.id ? 'ring-2 ring-primary bg-primary/10' : ''
              }`}
              onClick={() => onSelectDevice(device.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {device.isActive ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                        <path d="M17 18h1"/>
                        <path d="M12 18h1"/>
                        <path d="M7 18h1"/>
                      </svg>
                      <span>{device.lineName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="3" rx="2"/>
                        <line x1="8" x2="16" y1="21" y2="21"/>
                        <line x1="12" x2="12" y1="17" y2="21"/>
                      </svg>
                      <span>{device.equipmentId}</span>
                    </div>
                    
                    {device.lastConnection && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Última conexão: {new Date(device.lastConnection).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceList; 