
import React from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { MachineStatus, ViewState } from '../../../types';
import Card from '../../ui/Card';

interface ControlButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass: string;
  isActive?: boolean;
}

interface MachineControlsProps {
  isFixed?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ label, icon, onClick, colorClass, isActive }) => {
  const activeClasses = isActive ? 'ring-4 ring-offset-2 ring-offset-background' : '';
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-white font-bold uppercase tracking-wider transition-transform transform hover:scale-105 focus:outline-none ${colorClass} ${activeClasses}`}
    >
      {icon}
      <span className="mt-1.5 text-xs">{label}</span>
    </button>
  );
};

const MachineControls: React.FC<MachineControlsProps> = ({ isFixed = false }) => {
  const { setMachineStatus, startSetup, setView, machineStatus } = useProductionStore();
  
  const setPaused = () => {
    setView(ViewState.PAUSE_REASON);
    setMachineStatus(MachineStatus.PAUSED);
  };
  
  const setDown = async () => {
    try {
      // Apenas feedback visual; não registra evento até escolher o motivo
      setMachineStatus(MachineStatus.DOWN);
      setView(ViewState.STOP_REASON);
    } catch (error) {
      console.error('❌ Erro inesperado no setDown:', error);
      setView(ViewState.STOP_REASON);
    }
  };

  if (isFixed) {
    return (
      <div className="fixed bottom-0 left-16 right-0 bg-background border-t border-gray-700 px-3 py-3 z-[9999] min-h-[140px] shadow-lg">
        <h3 className="text-base font-semibold text-white mb-3">Machine Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          <ControlButton 
            label="Running" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
            onClick={() => setMachineStatus(MachineStatus.RUNNING)}
            colorClass="bg-green-500 hover:bg-green-600"
            isActive={machineStatus === MachineStatus.RUNNING}
          />
          <ControlButton 
            label="Down" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>}
            onClick={setDown}
            colorClass="bg-red-500 hover:bg-red-600"
            isActive={machineStatus === MachineStatus.DOWN}
          />
          <ControlButton 
            label="Setup" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
            onClick={startSetup}
            colorClass="bg-blue-500 hover:bg-blue-600"
            isActive={machineStatus === MachineStatus.SETUP}
          />
          <ControlButton 
            label="Pause" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}
            onClick={setPaused}
            colorClass="bg-orange-500 hover:bg-orange-600"
            isActive={machineStatus === MachineStatus.PAUSED}
          />
          <ControlButton 
            label="Call for Help" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>}
            onClick={() => alert('Support has been notified!')}
            colorClass="bg-purple-500 hover:bg-purple-600"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3 md:p-4">
        <h3 className="text-base font-semibold text-white mb-3">Machine Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            <ControlButton 
                label="Running" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
                onClick={() => setMachineStatus(MachineStatus.RUNNING)}
                colorClass="bg-green-500 hover:bg-green-600"
                isActive={machineStatus === MachineStatus.RUNNING}
            />
            <ControlButton 
                label="Down" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>}
                onClick={setDown}
                colorClass="bg-red-500 hover:bg-red-600"
                isActive={machineStatus === MachineStatus.DOWN}
            />
            <ControlButton 
                label="Setup" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                onClick={startSetup}
                colorClass="bg-blue-500 hover:bg-blue-600"
                isActive={machineStatus === MachineStatus.SETUP}
            />
            <ControlButton 
                label="Pause" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}
                onClick={() => {
                  console.log('🔄 MachineControls: Botão Pause clicado (não-fixo)!');
                  setPaused();
                }}
                colorClass="bg-orange-500 hover:bg-orange-600"
                isActive={machineStatus === MachineStatus.PAUSED}
            />
            <ControlButton 
                label="Call for Help" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>}
                onClick={() => alert('Support has been notified!')}
                colorClass="bg-purple-500 hover:bg-purple-600"
            />
        </div>
    </Card>
  );
};

export default MachineControls;
