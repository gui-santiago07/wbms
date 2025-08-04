
import React, { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import { ViewState } from '../types';
import Header from '../components/features/dashboard/Header';
import KpiCard from '../components/features/dashboard/KpiCard';
import StatusDisplay from '../components/features/dashboard/StatusDisplay';
import OeeGauge from '../components/features/dashboard/OeeGauge';
import ProductionMetrics from '../components/features/dashboard/ProductionMetrics';
import ProductionDetails from '../components/features/dashboard/ProductionDetails';
import ProductionChart from '../components/features/dashboard/ProductionChart';
import MachineControls from '../components/features/dashboard/MachineControls';
import StopReasonModal from '../components/features/modals/StopReasonModal';
import SetupModal from '../components/features/modals/SetupModal';
import ShiftModal from '../components/features/modals/ShiftModal';
import { useLiveDataPolling } from '../hooks/useLiveDataPolling';
import { useMachineControlsVisibility } from '../hooks/useMachineControlsVisibility';
import { useShiftDetection } from '../hooks/useShiftDetection';
import Card from '../components/ui/Card';
import Sidebar from '../components/features/dashboard/Sidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

import { config } from '../config/environment';

const DashboardView: React.FC = () => {
  const { liveMetrics, currentJob } = useProductionStore();
  const goodPartsPercent = liveMetrics.total > 0 ? (liveMetrics.good / liveMetrics.total) * 100 : 100; // Sempre 100% (sem rejeitos)

  return (
    <div className="space-y-3">

      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* First Column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard title="TOTAL" value={liveMetrics.total} />
            <KpiCard title="BOAS" value={liveMetrics.good} />
          </div>
          <Card className="flex justify-between items-center p-3">
             <StatusDisplay />
             <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className="text-success">Good Parts</span>
                    <span className="font-bold text-base">{goodPartsPercent.toFixed(1)}%</span>
                </div>
             </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
                <OeeGauge />
            </div>
            <div className="md:col-span-2">
                <ProductionMetrics />
            </div>
          </div>
        </div>

        {/* Second Column */}
        <div className="lg:col-span-1 space-y-3">
            <ProductionDetails />
            <ProductionChart />
        </div>
      </div>
      
      {/* Espaçamento para o Machine Controls fixo */}
      <div className="pb-36"></div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { view, setView, initializeDashboard, isLoading, error, currentShift } = useProductionStore();
  const { deviceSettings } = useDeviceSettingsStore();
  const { currentShift: detectedShift, isLoading: shiftLoading } = useShiftDetection();
  
  useLiveDataPolling(config.pollingInterval);

  // Garantir view válida na inicialização
  useEffect(() => {
    if (!view || ![ViewState.DASHBOARD, ViewState.OEE, ViewState.STOP_REASON, ViewState.SETUP].includes(view)) {
      console.log('🔄 View inválida na inicialização, redirecionando para DASHBOARD');
      setView(ViewState.DASHBOARD);
    }
  }, []);

  // Inicializar dados do dashboard na primeira carga
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Hook personalizado para visibilidade do MachineControls
  const shouldShowMachineControls = useMachineControlsVisibility();

  // Debug: verificar renderização do MachineControls
  useEffect(() => {
    // console.log('🎯 DashboardPage: Renderizando MachineControls');
    // console.log('🎯 DashboardPage: View atual:', view);
  }, [view]);

  // Verificar se dispositivo está configurado
  if (!deviceSettings.isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Dispositivo Não Configurado
          </h2>
          <p className="text-gray-300 mb-4">
            É necessário configurar o dispositivo antes de usar o sistema.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80"
          >
            Ir para Login
          </button>
        </Card>
      </div>
    );
  }

  // Mostrar mensagem se não há turno ativo
  if (!shiftLoading && !detectedShift) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhum Turno Ativo
          </h2>
          <p className="text-gray-300 mb-4">
            Não há turnos ativos no momento. Verifique os horários de trabalho.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80"
          >
            Verificar Novamente
          </button>
        </Card>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case ViewState.DASHBOARD:
        return <DashboardView />;
      case ViewState.STOP_REASON:
        return <StopReasonModal />;
      case ViewState.SETUP:
        return <SetupModal />;
      case ViewState.SHIFT_MODAL:
        return <ShiftModal onClose={() => setView(ViewState.DASHBOARD)} />;
      default:
        return <DashboardView />;
    }
  };

  // Se estiver na tela de STOP_REASON, renderizar apenas o modal com sidebar, sem header
  if (view === ViewState.STOP_REASON) {
    return (
      <div className="bg-background min-h-screen">
        <Sidebar />
        <StopReasonModal />
      </div>
    );
  }

  // Mostrar loading durante inicialização
  if (isLoading || shiftLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen ml-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Não mostrar erro na interface - tratamento silencioso
  // Os erros são apenas logados no console

  return (
    <>
      <div className="bg-background min-h-screen ml-16">
        <div className="p-3 sm:p-4 lg:p-5">
          <Header />
          <main className="mt-4">
            <Sidebar />
            {renderView()}
          </main>
        </div>
      </div>
      
      {/* Machine Controls - apenas para view DASHBOARD */}
      {view === ViewState.DASHBOARD && (
        <div data-testid="machine-controls-container">
          <MachineControls isFixed={true} />
        </div>
      )}
    </>
  );
};

export default DashboardPage;
