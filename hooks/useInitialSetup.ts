import { useState, useEffect } from 'react';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para gerenciar a configuração inicial do sistema
 * Verifica se o usuário precisa configurar planta, setor, linha e turno
 */
export const useInitialSetup = () => {
  const { deviceSettings } = useDeviceSettingsStore();
  const { user, isAuthenticated } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkInitialSetup = () => {
      setIsChecking(true);
      
      // Verificar se o usuário está autenticado
      if (!isAuthenticated) {
        console.log('🔐 Usuário não autenticado, aguardando login...');
        setIsChecking(false);
        return;
      }

      // Verificar se o dispositivo está configurado
      if (!deviceSettings.isConfigured) {
        console.log('⚠️ Dispositivo não configurado, mostrando modal de configuração inicial...');
        setShowSetupModal(true);
      } else {
        console.log('✅ Dispositivo já configurado:', {
          plant: deviceSettings.plantName,
          sector: deviceSettings.sectorName,
          line: deviceSettings.lineName,
          lastSetup: deviceSettings.lastSetupDate
        });
        setShowSetupModal(false);
      }
      
      setIsChecking(false);
    };

    // Aguardar um pouco para garantir que os stores estão carregados
    const timer = setTimeout(checkInitialSetup, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, deviceSettings.isConfigured]);

  const handleSetupComplete = () => {
    console.log('✅ Configuração inicial concluída');
    setShowSetupModal(false);
  };

  const handleSetupClose = () => {
    console.log('❌ Configuração inicial cancelada');
    setShowSetupModal(false);
  };

  return {
    showSetupModal,
    isChecking,
    needsSetup: !deviceSettings.isConfigured,
    handleSetupComplete,
    handleSetupClose
  };
}; 