
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { MachineStatus } from '../../../types';

const StatusDisplay: React.FC = () => {
  const machineStatus = useProductionStore((state) => state.machineStatus);

  const statusConfig = {
    [MachineStatus.RUNNING]: {
      text: 'PRODUZINDO',
      bgClass: 'bg-success',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
    },
    [MachineStatus.DOWN]: {
      text: 'PARADA - INFORME O MOTIVO',
      bgClass: 'bg-danger',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
    },
    [MachineStatus.PAUSED]: {
      text: 'PAUSADO',
      bgClass: 'bg-warning',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pause"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
    },
    [MachineStatus.SETUP]: {
      text: 'EM SETUP',
      bgClass: 'bg-primary',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
    },
    [MachineStatus.STANDBY]: {
      text: 'EM ESPERA',
      bgClass: 'bg-warning',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
  };

  const currentStatus = statusConfig[machineStatus];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg text-white ${currentStatus.bgClass}`}>
      <div className="w-8 h-8 flex-shrink-0">{currentStatus.icon}</div>
      <h2 className="text-xl font-bold uppercase tracking-wider">{currentStatus.text}</h2>
    </div>
  );
};

export default StatusDisplay;
