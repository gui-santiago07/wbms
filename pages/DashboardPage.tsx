
import React, { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';
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
import ProductionLineModal from '../components/features/modals/ProductionLineModal';
import ShiftModal from '../components/features/modals/ShiftModal';
import { useLiveDataPolling } from '../hooks/useLiveDataPolling';
import Card from '../components/ui/Card';
import Sidebar from '../components/features/dashboard/Sidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { config } from '../config/environment';

const DashboardView: React.FC = () => {
  const { liveMetrics, currentJob } = useProductionStore();
  const goodPartsPercent = liveMetrics.total > 0 ? (liveMetrics.good / liveMetrics.total) * 100 : 100; // Sempre 100% (sem rejeitos)

  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* First Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <KpiCard title="TOTAL" value={liveMetrics.total} />
            <KpiCard title="BOAS" value={liveMetrics.good} />
          </div>
          <Card className="flex justify-between items-center p-4">
             <StatusDisplay />
             <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className="text-success">Good Parts</span>
                    <span className="font-bold text-lg">{goodPartsPercent.toFixed(1)}%</span>
                </div>
             </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <OeeGauge />
            </div>
            <div className="md:col-span-2">
                <ProductionMetrics />
            </div>
          </div>
        </div>

        {/* Second Column */}
        <div className="lg:col-span-1 space-y-4">
            <ProductionDetails />
            <ProductionChart />
        </div>
      </div>
      
      {/* Espaçamento para o Machine Controls fixo */}
      <div className="pb-32"></div>
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const { view, setView, initializeDashboard, isLoading, error, currentShift } = useProductionStore();
  
  useLiveDataPolling(config.pollingInterval);

  // Inicializar dados do dashboard na primeira carga
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  const renderView = () => {
    switch (view) {
      case ViewState.DASHBOARD:
        return <DashboardView />;
      case ViewState.STOP_REASON:
        return <StopReasonModal />;
      case ViewState.SETUP:
        return <SetupModal />;
      case ViewState.PRODUCTION_LINE_MODAL:
        return <ProductionLineModal onClose={() => setView(ViewState.DASHBOARD)} />;
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
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen ml-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Não mostrar erro na interface - tratamento silencioso
  // Os erros são apenas logados no console



  return (
    <div className="bg-background min-h-screen ml-16">
      <div className="p-4 sm:p-6 lg:p-8">
        <Header />
        <main className="mt-6">
          <Sidebar />
          {renderView()}
        </main>
      </div>
      
      {/* Machine Controls Fixo - apenas para a view DASHBOARD */}
      {view === ViewState.DASHBOARD && <MachineControls isFixed={true} />}
    </div>
  );
};

export default DashboardPage;
