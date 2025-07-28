import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProductionStore } from '../../../store/useProductionStore';
import { ViewState } from '../../../types';

const Sidebar: React.FC = () => {
  const setView = useProductionStore((state) => state.setView);
  const location = useLocation();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  const isSettingsActive = location.pathname.startsWith('/settings');

  const settingsItems = [
    {
      path: '/settings/devices',
      label: 'Dispositivos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="3" rx="2"/>
          <line x1="8" x2="16" y1="21" y2="21"/>
          <line x1="12" x2="12" y1="17" y2="21"/>
        </svg>
      )
    },
    {
      path: '/settings',
      label: 'Gerais',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-surface p-4 flex flex-col items-center space-y-4 z-40">
      <NavLink 
        to="/oee" 
        className={({ isActive }) => 
          `p-3 rounded-lg transition-colors ${
            isActive ? 'text-white bg-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`
        } 
        onClick={() => setView(ViewState.OEE)}
        title="OEE"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </NavLink>
      {/* <NavLink 
        to="/dashboard" 
        className={({ isActive }) => 
          `p-3 rounded-lg transition-colors ${
            isActive ? 'text-white bg-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`
        } 
        onClick={() => setView(ViewState.DASHBOARD)}
        title="Dashboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      </NavLink> */}
      
      {/* Item de Configurações Unificado */}
      <div className="relative">
        <button
          className={`p-3 rounded-lg transition-colors ${
            isSettingsActive ? 'text-white bg-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          title="Configurações"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        
        {/* Submenu de Configurações */}
        {showSettingsMenu && (
          <div className="absolute left-full ml-2 top-0 bg-surface rounded-lg shadow-lg border border-gray-600 py-2 min-w-[160px] z-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-600 mb-2">
              Configurações
            </div>
            {settingsItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'text-white bg-blue-500/20 border-r-2 border-blue-500'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`
                }
                onClick={() => setShowSettingsMenu(false)}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 