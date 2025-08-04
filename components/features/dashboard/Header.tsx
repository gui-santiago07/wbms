
import React, { useState, useEffect } from 'react';
import { useClock } from '../../../hooks/useClock';
import { useAuth } from '../../../contexts/AuthContext';
import { useProductionStore } from '../../../store/useProductionStore';
import { useLineSelection } from '../../../hooks/useLineSelection';
import ShiftModal from '../modals/ShiftModal';
import LineSelectionModal from '../modals/LineSelectionModal';
import StatusDisplay from './StatusDisplay';

const Header: React.FC = () => {
  const currentTime = useClock();
  const { user, logout } = useAuth();
  const { currentShift } = useProductionStore();
  const { isModalOpen, closeModal, confirmLineSelection, shouldShowModal } = useLineSelection();
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Mostrar modal de seleção de linha se necessário
  useEffect(() => {
    if (shouldShowModal) {
      console.log('🔄 Dispositivo não configurado, mostrando modal de seleção de linha');
    }
  }, [shouldShowModal]);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      logout();
    }
  };

  // Usar turno atual do store (detecção silenciosa)
  const displayShift = currentShift;

  return (
    <header className="flex justify-between items-center py-2">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-md flex items-center justify-center">
          <img 
            src="/assets/images/logo/option7-logo.svg" 
            alt="Option7" 
            className="h-6 w-auto"
          />
        </div>
        <div>
          <p className="text-xs text-muted">Production Monitoring Dashboard</p>
        </div>
      </div>
      
      {/* Status Display */}
      <StatusDisplay />
      
      <div className="flex items-center gap-4">
        <div className="text-center">
          <button
            onClick={() => setShowShiftModal(true)}
            className="text-sm font-semibold text-white hover:text-primary transition-colors cursor-pointer"
          >
            <span>{displayShift?.name || 'Turno'}</span>
          </button>
          {displayShift && (
            <p className="text-xs text-muted mt-1">
              {displayShift.startTime} - {displayShift.endTime}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm text-white">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-muted">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Informações do usuário */}
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg">
            <div className="bg-primary p-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
          
          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1.5 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            <span className="text-xs">Sair</span>
          </button>
          
          {/* Indicador de conectividade */}
          <div className="text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi">
              <path d="M5 12.55a8 8 0 0 1 14 0"/>
              <path d="M2 8.82a15 15 0 0 1 20 0"/>
              <path d="M8.5 16.42a4 4 0 0 1 7 0"/>
              <line x1="12" x2="12.01" y1="20" y2="20"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Modais */}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
      
      {/* Modal de Seleção de Linha */}
      <LineSelectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={confirmLineSelection}
      />
    </header>
  );
};

export default Header;
