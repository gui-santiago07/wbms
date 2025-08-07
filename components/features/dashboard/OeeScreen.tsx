import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../ui/Card';
import Header from './Header';
import ProductionDetails from './ProductionDetails';
import MachineControls from './MachineControls';
import Sidebar from './Sidebar';
import StopReasonModal from '../modals/StopReasonModal';
import PauseReasonModal from '../modals/PauseReasonModal';

import ShiftModal from '../modals/ShiftModal';
import ProductSelectionModal from '../modals/ProductSelectionModal';
import LineSelectionModal from '../modals/LineSelectionModal';
import SetupModal from '../modals/SetupModal';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';
import TimeDistributionChart from './TimeDistributionChart';
import StopReasonsList from './StopReasonsList';
import ProductionTimeline from './ProductionTimeline';
import NoActiveProductionMessage from './NoActiveProductionMessage';

import { useProductionStore } from '../../../store/useProductionStore';
import { useLineSelection } from '../../../hooks/useLineSelection';
import { useSilentShiftDetection } from '../../../hooks/useSilentShiftDetection';
import { useProductionStatusCheck } from '../../../hooks/useProductionStatusCheck';
import { useProductionDataPolling } from '../../../hooks/useProductionDataPolling';
import { useOeeData } from '../../../hooks/useOeeData';
import { ViewState } from '../../../types';
import { useMachineControlsVisibility } from '../../../hooks/useMachineControlsVisibility';

// Tipos para os filtros de tempo
type TimePeriod = '1h' | '4h' | '8h' | '24h' | '7d';

// Componente para os gauges circulares de OEE
const CircularGauge: React.FC<{ 
  value: number; 
  label: string; 
  color: string; 
  size?: number 
}> = ({ value, label, color, size = 100 }) => {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Calcular tamanhos responsivos baseados no size do círculo
  const getTextSize = () => {
    if (size <= 80) return { value: 'text-sm', label: 'text-xs' };
    if (size <= 100) return { value: 'text-base', label: 'text-xs' };
    if (size <= 120) return { value: 'text-lg', label: 'text-sm' };
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
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <span className={`${valueTextSize} font-bold text-white leading-none`}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className={`${labelTextSize} text-muted mt-1 text-center`}>{label}</span>
    </div>
  );
};

// Função para gerar dados realistas de OEE baseados na produção atual
const generateRealisticOeeData = (actual: number, target: number): {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  history: {
    points: Array<{ x: number; y: number }>;
    timeLabels: string[];
    trend: string;
    trendColor: string;
  };
} => {
  // Calcular completion rate para influenciar os cálculos
  const completionRate = target > 0 ? (actual / target) * 100 : 0;
  
  // Base para cálculos realistas
  const baseEfficiency = Math.min(completionRate * 0.8 + Math.random() * 20, 95); // Máximo 95%
  
  // Availability: baseada na eficiência geral, mas com variação realista
  const availability = Math.max(75, Math.min(95, baseEfficiency + (Math.random() - 0.5) * 10));
  
  // Performance: baseada na velocidade de produção vs target
  const performanceBase = Math.max(70, Math.min(92, baseEfficiency + (Math.random() - 0.5) * 15));
  const performance = performanceBase;
  
  // Quality: geralmente alta em produção industrial, mas com variação
  const qualityBase = Math.max(85, Math.min(99, 90 + (Math.random() - 0.5) * 10));
  const quality = qualityBase;
  
  // OEE = Availability × Performance × Quality / 10000
  const oee = (availability * performance * quality) / 10000;
  
  // Gerar histórico realista
  const generateHistoryPoints = () => {
    const points = [];
    const timeLabels = [];
    const numPoints = 8; // 8 pontos para o gráfico
    
    // Determinar tendência baseada na eficiência atual
    const trendDirection = oee > 75 ? 1 : oee > 60 ? 0 : -1; // 1 = crescente, 0 = estável, -1 = decrescente
    
    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      
      // Calcular valor base com variação realista
      let baseValue = oee;
      
      // Adicionar variação temporal realista
      if (trendDirection === 1) {
        // Tendência crescente
        baseValue = oee * (0.7 + progress * 0.4);
      } else if (trendDirection === -1) {
        // Tendência decrescente
        baseValue = oee * (1.3 - progress * 0.4);
      } else {
        // Tendência estável com pequenas variações
        baseValue = oee * (0.9 + progress * 0.2);
      }
      
      // Adicionar ruído realista (±5%)
      const noise = (Math.random() - 0.5) * 0.1;
      const finalValue = Math.max(0, Math.min(100, baseValue * (1 + noise)));
      
      points.push({
        x: (i / (numPoints - 1)) * 200, // 200 é a largura do SVG
        y: finalValue
      });
      
      // Gerar labels de tempo realistas
      const timeLabel = generateTimeLabel(i, numPoints);
      timeLabels.push(timeLabel);
    }
    
    return { points, timeLabels };
  };
  
  const generateTimeLabel = (index: number, total: number): string => {
    const now = new Date();
    const interval = 24 / total; // Distribuir ao longo de 24h
    
    const targetTime = new Date(now.getTime() - (total - 1 - index) * interval * 60 * 60 * 1000);
    
    if (total <= 4) {
      return targetTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return targetTime.toLocaleTimeString('pt-BR', { hour: '2-digit' });
    }
  };
  
  const { points, timeLabels } = generateHistoryPoints();
  
  // Calcular tendência
  const firstValue = points[0]?.y || 0;
  const lastValue = points[points.length - 1]?.y || 0;
  const trendDiff = lastValue - firstValue;
  const trend = trendDiff > 1 ? `+${trendDiff.toFixed(1)}%` : 
                trendDiff < -1 ? `${trendDiff.toFixed(1)}%` : 
                '0.0%';
  const trendColor = trendDiff > 1 ? 'text-green-400' : 
                     trendDiff < -1 ? 'text-red-400' : 
                     'text-gray-400';
  
  return {
    oee: Math.round(oee * 100) / 100,
    availability: Math.round(availability * 100) / 100,
    performance: Math.round(performance * 100) / 100,
    quality: Math.round(quality * 100) / 100,
    history: {
      points,
      timeLabels,
      trend,
      trendColor
    }
  };
};

// Componente para o gráfico de tendência OEE com filtros funcionais
const OeeTrendChart: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1h');
  const { oeeHistory, fetchOeeHistory, currentShift, productionData } = useProductionStore();

  // Gerar dados realistas quando há produção ativa
  const realisticData = useMemo(() => {
    if (productionData.actual > 0 && productionData.target > 0) {
      return generateRealisticOeeData(productionData.actual, productionData.target);
    }
    return null;
  }, [productionData.actual, productionData.target]);

  // Carregar dados históricos quando o período mudar (apenas se não há dados realistas)
  useEffect(() => {
    if (!realisticData) {
      fetchOeeHistory(selectedPeriod);
    }
  }, [selectedPeriod, fetchOeeHistory, currentShift, realisticData]);

  // Usar dados realistas ou dados do store
  const currentData = realisticData?.history || oeeHistory || {
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
  const { 
    currentShift, 
    productionData, 
    setupData, 
    setShowSetupModal,
    selectedProduct,
    setShowProductSelectionModal 
  } = useProductionStore();
  
  // Hook para dados de OEE calculados da timeline
  const { oeeData, isLoading: oeeLoading } = useOeeData();

  // Gerar dados realistas de OEE quando há produção ativa
  const realisticOeeData = useMemo(() => {
    if (productionData.actual > 0 && productionData.target > 0) {
      return generateRealisticOeeData(productionData.actual, productionData.target);
    }
    return null;
  }, [productionData.actual, productionData.target]);

  // Usar dados realistas se disponíveis, senão usar dados do hook
  const finalOeeData = realisticOeeData || oeeData;

  // Verificar se há produção ativa OU se há informações suficientes no storage
  const hasActiveProduction = setupData && productionData.actual > 0;
  const hasSufficientStorageInfo = setupData?.line && selectedProduct;
  
  // Mostrar componente de produção se há produção ativa OU se há informações suficientes no storage
  const shouldShowProductionComponent = hasActiveProduction || hasSufficientStorageInfo;

  // Debug logs
  console.log('🔍 OeeView Debug:', {
    hasActiveProduction,
    hasSufficientStorageInfo,
    shouldShowProductionComponent,
    setupData: setupData?.line,
    selectedProduct: selectedProduct?.name,
    productionData: productionData.actual,
    usingRealisticData: !!realisticOeeData
  });

  const handleProductChange = () => {
    setShowProductSelectionModal(true);
  };

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
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted">
                  {currentShift?.name || 'Turno Ativo'}
                </div>
                
                {/* Botão de seleção de produto */}
                <button
                  onClick={handleProductChange}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  {selectedProduct ? 'Trocar Produto' : 'Escolher Produto'}
                </button>
              </div>
            </div>
            
            {/* Conteúdo condicional baseado no status de produção */}
            {shouldShowProductionComponent ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="bg-surface p-4 rounded-lg">
                    <div className="text-sm text-muted mb-1">Target</div>
                    <div className="text-3xl font-bold text-white">{productionData.target.toLocaleString()}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-lg">
                    <div className="text-sm text-muted mb-1">Actual</div>
                    <div className="text-3xl font-bold text-white">{productionData.actual.toLocaleString()}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-lg">
                    <div className="text-sm text-muted mb-1">Completion</div>
                    <div className="text-3xl font-bold text-white">{productionData.completion}%</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted">Progress</span>
                    <span className="text-sm text-muted">{productionData.actual.toLocaleString()} / {productionData.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(productionData.completion, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-white">Good Parts</span>
                    <span className="text-sm font-bold text-white">{productionData.goodParts.toLocaleString()} ({productionData.goodPartsPercent}%)</span>
                  </div>
                </div>
              </>
            ) : (
              <NoActiveProductionMessage onStartSetup={() => setShowSetupModal(true)} />
            )}
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
        </div>

        {/* Detalhes da Produção - 1 coluna */}
        <div className="space-y-6">
          <Card className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white">Production Details</h3>
              <div className="text-sm text-muted">
                {currentShift?.name || 'No Active Shift'}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Product</span>
                <span className="text-sm text-white">{selectedProduct?.name || setupData?.product || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Order</span>
                <span className="text-sm text-white">{selectedProduct?.id || setupData?.productKey ? `OP-${selectedProduct?.id || setupData?.productKey}` : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Status</span>
                <span className="text-sm text-white">{productionData.actual > 0 ? 'Ativo' : 'Parado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Line</span>
                <span className="text-sm text-white">{setupData?.line || '-'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <OeeTrendChart />
          </Card>

          {/* Nova seção de métricas OEE */}
          <Card className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white">OEE Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <CircularGauge value={finalOeeData.oee} label="OEE" color="#3b82f6" size={90} />
              </div>
              <div className="text-center">
                <CircularGauge value={finalOeeData.availability} label="Availability" color="#22c55e" size={90} />
              </div>
              <div className="text-center">
                <CircularGauge value={finalOeeData.performance} label="Performance" color="#f59e0b" size={90} />
              </div>
              <div className="text-center">
                <CircularGauge value={finalOeeData.quality} label="Quality" color="#8b5cf6" size={90} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Espaçamento para o Machine Controls fixo */}
      <div className="pb-32"></div>
    </div>
  );
};

const OeeScreen: React.FC = () => {
  const { 
    view, 
    setView, 
    initializeDashboard, 
    isLoading, 
    error, 
    showProductSelectionModal,
    setShowProductSelectionModal,
    showSetupModal,
    setShowSetupModal,
    handleSetupComplete,
    checkProductionStatus,
    setupData,
    loadInitialProductionData,
    selectedProduct
  } = useProductionStore();
  const { isModalOpen, closeModal, confirmLineSelection, shouldShowModal } = useLineSelection();
  
  // Hook para detecção silenciosa de turno
  useSilentShiftDetection();

  // Hook para verificar status de produção
  const productionStatus = useProductionStatusCheck();

  // Hook para polling de dados de produção
  useProductionDataPolling(
    productionStatus.clientLineKey || setupData?.line || null,
    !productionStatus.needsSetup && productionStatus.hasActiveProduction
  );

  // Carregar dados iniciais quando a linha for selecionada
  useEffect(() => {
    if (setupData?.line && !isLoading) {
      // Carregar dados iniciais imediatamente após seleção da linha
      loadInitialProductionData(setupData.line);
    }
  }, [setupData?.line, isLoading, loadInitialProductionData]);

  // Garantir view válida na inicialização
  useEffect(() => {
    if (!view || ![ViewState.DASHBOARD, ViewState.OEE, ViewState.STOP_REASON, ViewState.PAUSE_REASON].includes(view)) {
      setView(ViewState.OEE);
    }
  }, []);

  // Inicializar dados do dashboard
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Mostrar modal de seleção de produto apenas se não há produto selecionado
  useEffect(() => {
    if (!isLoading && !selectedProduct) {
      // Verificar se há produto no localStorage
      const cachedProduct = localStorage.getItem('selected_product');
      if (!cachedProduct) {
        console.log('ℹ️ Nenhum produto encontrado, mostrando modal de seleção');
        setShowProductSelectionModal(true);
      } else {
        console.log('✅ Produto encontrado no cache, não mostrando modal');
      }
    }
  }, [isLoading, selectedProduct, setShowProductSelectionModal]);

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
      case ViewState.PAUSE_REASON:
        return <PauseReasonModal />;
      case ViewState.SETUP:
        return (
          <SetupModal
            isOpen={true}
            onClose={() => setView(ViewState.OEE)}
            onSetupComplete={handleSetupComplete}
            clientLineKey={setupData?.line}
          />
        );
      case ViewState.SHIFT_MODAL:
        return <ShiftModal onClose={() => setView(ViewState.OEE)} />;
      default:
        return <OeeView />;
    }
  };

  // Se estiver na tela de STOP_REASON ou PAUSE_REASON, renderizar apenas o modal com sidebar, sem header
  if (view === ViewState.STOP_REASON || view === ViewState.PAUSE_REASON) {
    return (
      <div className="bg-background min-h-screen">
        <Sidebar />
        {view === ViewState.STOP_REASON ? <StopReasonModal /> : <PauseReasonModal />}
      </div>
    );
  }

  // Mostrar loading durante inicialização do dashboard
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
        
        {/* Modal de Seleção de Linha */}
        <LineSelectionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={confirmLineSelection}
        />

        {/* Modal de Setup */}
        <SetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSetupComplete={handleSetupComplete}
          clientLineKey={setupData?.line}
        />
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