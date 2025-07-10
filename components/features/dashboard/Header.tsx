
import React, { useState } from 'react';
import { useClock } from '../../../hooks/useClock';
import { useAuth } from '../../../contexts/AuthContext';
import { useProductionStore } from '../../../store/useProductionStore';
import ProductionLineModal from '../modals/ProductionLineModal';
import ShiftModal from '../modals/ShiftModal';

const Header: React.FC = () => {
  const currentTime = useClock();
  const { user, logout } = useAuth();
  const { currentProductionLine, currentShift } = useProductionStore();
  const [showProductionLineModal, setShowProductionLineModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      logout();
    }
  };

  return (
    <header className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-md flex items-center justify-center">
          <img 
            src="/assets/images/logo/option7-logo.svg" 
            alt="Option7" 
            className="h-8 w-auto"
          />
        </div>
        <div>
          <button
            onClick={() => setShowProductionLineModal(true)}
            className="text-2xl md:text-3xl font-bold text-white tracking-tight hover:text-primary transition-colors cursor-pointer"
          >
            {currentProductionLine?.name || 'ENVASE 520741-8'}
          </button>
          <p className="text-sm text-muted">Production Monitoring Dashboard</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <button
            onClick={() => setShowShiftModal(true)}
            className="text-xl font-semibold text-white hover:text-primary transition-colors cursor-pointer"
          >
            {currentShift?.name || 'TURNO 2'}
          </button>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg text-white">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-sm text-muted">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Informações do usuário */}
          <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-lg">
            <div className="bg-primary p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
          
          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            <span className="text-sm">Sair</span>
          </button>
          
          {/* Indicador de conectividade */}
          <div className="text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi">
              <path d="M5 12.55a8 8 0 0 1 14 0"/>
              <path d="M2 8.82a15 15 0 0 1 20 0"/>
              <path d="M8.5 16.42a4 4 0 0 1 7 0"/>
              <line x1="12" x2="12.01" y1="20" y2="20"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Modais */}
      {showProductionLineModal && (
        <ProductionLineModal onClose={() => setShowProductionLineModal(false)} />
      )}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
    </header>
  );
};

export default Header;
