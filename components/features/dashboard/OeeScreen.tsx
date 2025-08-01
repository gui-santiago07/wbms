import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Header from './Header';
import ProductionDetails from './ProductionDetails';
import MachineControls from './MachineControls';
import Sidebar from './Sidebar';
import StopReasonModal from '../modals/StopReasonModal';
import SetupModal from '../modals/SetupModal';

import ShiftModal from '../modals/ShiftModal';
import ProductSelectionModal from '../modals/ProductSelectionModal';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';
import TimeDistributionChart from './TimeDistributionChart';
import StopReasonsList from './StopReasonsList';
import ProductionTimeline from './ProductionTimeline';

import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import { ViewState } from '../../../types';
import { useLiveDataPolling } from '../../../hooks/useLiveDataPolling';
import { useMachineControlsVisibility } from '../../../hooks/useMachineControlsVisibility';
import { useShiftDetection } from '../../../hooks/useShiftDetection';
import { config } from '../../../config/environment';

// Tipos para os filtros de tempo
type TimePeriod = '1h' | '4h' | '8h' | '24h' | '7d';

// Componente para os gauges circulares de OEE
const CircularGauge: React.FC<{ 
  value: number; 
  label: string; 
  color: string; 
  size?: number 
}> = ({ value, label, color, size = 120 }) => {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Calcular tamanhos responsivos baseados no size do círculo
  const getTextSize = () => {
    if (size <= 100) return { value: 'text-lg', label: 'text-xs' };
    if (size <= 140) return { value: 'text-xl', label: 'text-sm' };
    if (size <= 160) return { value: 'text-2xl', label: 'text-sm' };
    if (size <= 180) return { value: 'text-3xl', label: 'text-base' };
    return { value: 'text-4xl', label: 'text-base' };
  };

  const { value: valueTextSize, label: labelTextSize } = getTextSize();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
          <span className={`${valueTextSize} font-bold text-white leading-none`}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className={`${labelTextSize} text-muted mt-2 text-center`}>{label}</span>
    </div>
  );
};

// Componente para o gráfico de tendência OEE com filtros funcionais
const OeeTrendChart: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1h');
  const { oeeHistory, fetchOeeHistory, currentShift } = useProductionStore();

  // Carregar dados históricos quando o período mudar
  useEffect(() => {
    fetchOeeHistory(selectedPeriod);
  }, [selectedPeriod, fetchOeeHistory, currentShift]);

  // Usar dados do store ou dados vazios se não houver dados
  const currentData = oeeHistory || {
    points: [],
    timeLabels: [],
    trend: '0.0%',
    trendColor: 'text-gray-400'
  };

  const pathData = currentData.points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${100 - point.y}`
  ).join(' ');

  const periods: { key: TimePeriod; label: string }[] = [
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '8h', label: '8h' },
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-white">Historical Performance</h4>
        <div className="flex gap-2">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPeriod === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 L14 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-xs text-white">OEE Trend</span>
          <span className={`text-xs ml-auto ${currentData.trendColor}`}>
            {currentData.trend}
          </span>
        </div>
        <svg width="200" height="100" className="w-full">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none"/>
          {currentData.points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={100 - point.y}
              r="3"
              fill="#3b82f6"
            />
          ))}
        </svg>
        <div className="flex justify-between text-xs text-muted mt-1">
          {currentData.timeLabels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const OeeView: React.FC = () => {
  const { liveMetrics, currentJob, currentShift, setShowProductSelectionModal } = useProductionStore();
  const goodPartsPercent = liveMetrics.total > 0 ? (liveMetrics.good / liveMetrics.total) * 100 : 100; // Sempre 100% (sem rejeitos)

  // Calcular progresso da ordem de produção
  const productionProgress = liveMetrics.possibleProduction > 0 
    ? (liveMetrics.productionOrderProgress / liveMetrics.possibleProduction) * 100 
    : 90.0;

  // Calcular tempo decorrido no turno
  const timeProgress = liveMetrics.totalShiftTime > 0 
    ? (liveMetrics.timeInShift / liveMetrics.totalShiftTime) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Seção de Produção - 2 colunas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas de Produção */}
          <Card className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
                  <path d="M7 11h8"/>
                  <path d="M7 16h12"/>
                  <path d="M7 6h12"/>
                </svg>
                Production
              </h2>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted">
                  {currentShift?.name || 'Turno Ativo'}
                </div>
                <button
                  onClick={() => setShowProductSelectionModal(true)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Selecionar Produto
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Target</div>
                <div className="text-3xl font-bold text-white">{liveMetrics.possibleProduction}</div>
              </div>
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Actual</div>
                <div className="text-3xl font-bold text-white">{liveMetrics.productionOrderProgress}</div>
              </div>
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Completion</div>
                <div className="text-3xl font-bold text-white">{productionProgress.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted">Progress</span>
                <span className="text-sm text-muted">{liveMetrics.productionOrderProgress} / {liveMetrics.possibleProduction}</span>
              </div>
              <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(productionProgress, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-white">Good Parts</span>
                <span className="text-sm font-bold text-white">{liveMetrics.good} ({goodPartsPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </Card>

          {/* Timeline de Produção */}
          <Card className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted">
                Histórico de eventos
              </div>
            </div>
            <ProductionTimeline />
          </Card>

          {/* Métricas OEE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-5 text-center">
              <CircularGauge value={liveMetrics.oee} label="OEE" color="#3b82f6" size={140} />
            </Card>
            <Card className="p-5 text-center">
              <CircularGauge value={liveMetrics.availability} label="Availability" color="#22c55e" size={140} />
            </Card>
            <Card className="p-5 text-center">
              <CircularGauge value={liveMetrics.performance} label="Performance" color="#f59e0b" size={140} />
            </Card>
            <Card className="p-5 text-center">
              <CircularGauge value={liveMetrics.quality} label="Quality" color="#8b5cf6" size={140} />
            </Card>
          </div>
        </div>

        {/* Detalhes da Produção - 1 coluna */}
        <div className="space-y-6">
          <Card className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Production Details</h3>
              <span className="text-sm font-semibold text-blue-400">{currentShift?.name || 'Turno Ativo'}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Ordem de Produção</span>
                <span className="text-sm font-semibold text-white">{currentJob?.orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Quantidade OP</span>
                <span className="text-sm font-semibold text-white">{currentJob?.orderQuantity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Product Code</span>
                <span className="text-sm font-semibold text-white">{currentJob?.productId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Product ID</span>
                <span className="text-sm font-semibold text-white">{currentJob?.productName || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <OeeTrendChart />
          </Card>
        </div>
      </div>

      {/* Espaçamento para o Machine Controls fixo */}
      <div className="pb-32"></div>
    </div>
  );
};

const OeeScreen: React.FC = () => {
  const { view, setView, initializeDashboard, isLoading, error, showProductSelectionModal } = useProductionStore();
  
  useLiveDataPolling(3000);

  // Garantir view válida na inicialização
  useEffect(() => {
    if (!view || ![ViewState.DASHBOARD, ViewState.OEE, ViewState.STOP_REASON, ViewState.SETUP].includes(view)) {
      console.log('🔄 View inválida na inicialização, redirecionando para OEE');
      setView(ViewState.OEE);
    }
  }, []);

  // Inicializar dados do dashboard na primeira carga
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Hook personalizado para visibilidade do MachineControls
  const shouldShowMachineControls = useMachineControlsVisibility();

  const renderView = () => {
    switch (view) {
      case ViewState.OEE:
        return <OeeView />;
      case ViewState.DOWNTIME:
        return <StopReasonModal />;
      case ViewState.STOP_REASON:
        return <StopReasonModal />;
      case ViewState.SETUP:
        return <SetupModal />;

      case ViewState.SHIFT_MODAL:
        return <ShiftModal onClose={() => setView(ViewState.OEE)} />;
      default:
        return <OeeView />;
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
      <div className="p-3 sm:p-4 lg:p-5">
        <Sidebar />
        <Header />
        
        <main className="mt-4">
          {renderView()}
        </main>
        
        {/* Modal de Seleção de Produto */}
        {showProductSelectionModal && <ProductSelectionModal />}
      </div>
      
      {/* Machine Controls com lógica robusta */}
      {shouldShowMachineControls && (
        <div data-testid="machine-controls-container">
          <MachineControls isFixed={true} />
        </div>
      )}
    </div>
  );
};

export default OeeScreen; 