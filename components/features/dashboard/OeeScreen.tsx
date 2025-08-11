import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import Card from '../../ui/Card';
import Header from './Header';
import MachineControls from './MachineControls';
import Sidebar from './Sidebar';
import StopReasonModal from '../modals/StopReasonModal';
import PauseReasonModal from '../modals/PauseReasonModal';
import ProductSelectionModal from '../modals/ProductSelectionModal';
import LineSelectionModal from '../modals/LineSelectionModal';
import SetupModal from '../modals/SetupModal';
import LoadingSpinner from '../../ui/LoadingSpinner';
// Removidos imports não utilizados
import ProductionTimeline from './ProductionTimeline';
import NoActiveProductionMessage from './NoActiveProductionMessage';

import { useProductionStore } from '../../../store/useProductionStore';
import { useLineSelection } from '../../../hooks/useLineSelection';

import { useProductionStatusCheck } from '../../../hooks/useProductionStatusCheck';
import { useProductionDataPolling } from '../../../hooks/useProductionDataPolling';
import { useOeeData } from '../../../hooks/useOeeData';
import { ViewState } from '../../../types';
import { useMachineControlsVisibility } from '../../../hooks/useMachineControlsVisibility';
// import Option7ApiService from '../../../services/option7ApiService';
import ApiClient from '../../../services/api';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';

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


// Componente para o gráfico de tendência OEE com filtros funcionais
const OeeTrendChart: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1h');
  const { oeeHistory, fetchOeeHistory } = useProductionStore();

  // Carregar dados históricos quando o período mudar
  useEffect(() => {
    fetchOeeHistory(selectedPeriod);
  }, [selectedPeriod, fetchOeeHistory]);

  // Usar dados do store
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
  const { 
    productionData, 
    setupData, 
    setShowSetupModal,
    selectedProduct,
    setShowProductSelectionModal,
    apiProductionStatus,
    currentJob,
    oeeFromStatus 
  } = useProductionStore();
  
  // Hook para dados de OEE calculados da timeline
  const { oeeData } = useOeeData();

  // Preferir dados da API local, senão cálculo por timeline
  const finalOeeData = oeeFromStatus || oeeData;

  // Verificar condições para exibir componente de produção
  const hasActiveProduction = !!setupData && productionData.actual > 0;
  // Tornar o critério mais flexível: se já houver linha ou produto selecionado, considerar suficiente
  const hasSufficientStorageInfo = !!setupData?.line || !!selectedProduct;
  // Se existe currentJob, isso já é uma forte indicação de produção ativa
  const hasApiActiveProduction = !!apiProductionStatus?.hasActiveProduction || !!currentJob;
  const hasCurrentJob = !!currentJob;
  const hasCachedProductionNumbers = (productionData?.target ?? 0) > 0 || (productionData?.actual ?? 0) > 0;
  
  // Mostrar componente de produção com critérios mais flexíveis
  // Exibir quando houver indícios fortes: job presente, API ativa, ou números de produção
  const shouldShowProductionComponent = 
    hasCurrentJob ||
    hasApiActiveProduction ||
    hasActiveProduction ||
    hasCachedProductionNumbers ||
    hasSufficientStorageInfo;

  // Debug logs
  console.log('🔍 OeeView Debug:', {
    hasActiveProduction,
    hasSufficientStorageInfo,
    shouldShowProductionComponent,
    setupData: setupData?.line,
    selectedProduct: selectedProduct?.name,
    productionData: productionData.actual,
    usingRealisticData: false,
    hasApiActiveProduction,
    hasCurrentJob,
    hasCachedProductionNumbers
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
                  Turno Ativo
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
                Turno Ativo
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
    showProductSelectionModal,
    setShowProductSelectionModal,
    showSetupModal,
    setShowSetupModal,
    handleSetupComplete,
    setupData,
    loadInitialProductionData,
    loadProductionDataFromCache,
    selectedProduct
  } = useProductionStore();
  const { isModalOpen, closeModal, confirmLineSelection } = useLineSelection();
  const { deviceSettings } = useDeviceSettingsStore();
  const apiClient = useMemo(() => new ApiClient(), []);
  // const option7Api = useMemo(() => new Option7ApiService(), []);
  


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
      // Pré-carregar rapidamente do cache local antes da chamada de rede
      loadProductionDataFromCache();
      // Carregar dados iniciais imediatamente após seleção da linha
      loadInitialProductionData(setupData.line);
    }
  }, [setupData?.line, isLoading, loadInitialProductionData, loadProductionDataFromCache]);

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

  // Carregar histórico diário consolidado (paradas e standby) quando abrir os modais
  useLayoutEffect(() => {
    const isDowntimeView = view === ViewState.STOP_REASON || view === ViewState.PAUSE_REASON || view === ViewState.DOWNTIME;
    if (!isDowntimeView) return;

    const clientLineKey = setupData?.line || deviceSettings.lineId || null;
    if (!clientLineKey) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const loadDailyDowntimes = async () => {
      try {
        // Novo endpoint consolidado
        const include = 'shifts,events,top_reasons,reasons';
        const types = 'STOP,STANDBY';
        const dailyUrl = `/wbms/auto-apontamento/${clientLineKey}/daily_downtimes?date=${dateStr}&types=${types}&include=${include}`;
        console.log(`Buscando daily_downtimes para a linha ${clientLineKey} em ${dateStr}...`);
        console.log(`URL: /api${dailyUrl}`);
        const dailyResp: any = await apiClient.get(dailyUrl);
        console.log('📝 Resposta /daily_downtimes:', dailyResp);
        const allEvents: any[] = Array.isArray(dailyResp?.events) ? dailyResp.events : [];

        // Passo 3: Filtrar por paradas (down) e standby
        const mapTypeToStateText = (type?: string) => {
          switch (type) {
            case 'STOP':
              return 'down_enum';
            case 'PAUSE':
              return 'standby_enum';
            case 'SETUP':
              return 'setup_enum';
            case 'RUN':
              return 'run_enum';
            default:
              return undefined;
          }
        };

        const filtered = allEvents.filter((ev: any) => {
          const raw = ev?.state_text || mapTypeToStateText(ev?.type);
          const stateText = typeof raw === 'string' ? raw : '';
          const norm = stateText.toLowerCase();
          const isDown = norm.includes('down') || norm.includes('stop');
          const isStandby = norm.includes('standby') || norm.includes('pause');
          return isDown || isStandby;
        });

        // Ordenar por start_time
        filtered.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        // Mapas de razão se vierem no payload
        const stopMap = new Map<number, string>();
        const pauseMap = new Map<number, string>();
        if (dailyResp?.reasons?.STOP) {
          dailyResp.reasons.STOP.forEach((r: any) => stopMap.set(Number(r.id), r.name));
        }
        if (dailyResp?.reasons?.STANDBY) {
          dailyResp.reasons.STANDBY.forEach((r: any) => pauseMap.set(Number(r.id), r.name));
        }

        // Converter para formato de downtimeHistory do store
        const toHHMMSS = (secondsTotal: number) => {
          const s = Math.max(0, Math.floor(secondsTotal));
          const hh = String(Math.floor(s / 3600)).padStart(2, '0');
          const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
          const ss = String(s % 60).padStart(2, '0');
          return `${hh}:${mm}:${ss}`;
        };

        const consolidatedHistory = filtered.map((ev: any) => {
          const start = new Date(ev.start_time);
          const end = ev.end_time ? new Date(ev.end_time) : null;
          const durationSec = end ? (end.getTime() - start.getTime()) / 1000 : 0;
          const stateText = (ev?.state_text || mapTypeToStateText(ev?.type) || '').toString().toLowerCase();
          const descId = Number(ev.description_id ?? ev.event_description_key ?? 0);
          const reasonFromEvent = ev.reason_text || ev.reason_description || '';

          let reasonText = '';
          if (stateText.includes('down') || stateText.includes('stop')) {
            reasonText = reasonFromEvent || stopMap.get(descId) || 'Parada';
          } else if (stateText.includes('standby') || stateText.includes('pause')) {
            reasonText = reasonFromEvent || pauseMap.get(descId) || 'Pausa';
          }

          return {
            id: String(ev.id ?? `${ev.shift_number_key}-${ev.start_time}`),
            operator: 'Operador',
            startDate: start.toISOString().split('T')[0],
            startTime: start.toLocaleTimeString(),
            endDate: end ? end.toISOString().split('T')[0] : null,
            endTime: end ? end.toLocaleTimeString() : null,
            totalTime: durationSec ? String(Math.floor(durationSec / 60)) : null,
            reason: reasonText || 'Evento',
          };
        });

        // Agregar Principais Paradas a partir dos eventos consolidados
        type AggregationKey = string; // `${kind}:${descId}`
        const aggregate = new Map<AggregationKey, { id: string; code: string; description: string; category: string; totalSec: number; occurrences: number }>();

        for (const ev of filtered) {
          const start = new Date(ev.start_time);
          const end = ev.end_time ? new Date(ev.end_time) : null;
          const durationSec = end ? (end.getTime() - start.getTime()) / 1000 : 0;
          const stateText = (ev?.state_text || mapTypeToStateText(ev?.type) || '').toString().toLowerCase();
          const isDown = stateText.includes('down') || stateText.includes('stop');
          const isStandby = stateText.includes('standby') || stateText.includes('pause');
          const descId = Number(ev.description_id ?? ev.event_description_key ?? 0) || 0;
          const reasonFromEvent = ev.reason_text || ev.reason_description || '';
          const motivo = isDown
            ? (reasonFromEvent || stopMap.get(descId) || 'Parada')
            : isStandby
              ? (reasonFromEvent || pauseMap.get(descId) || 'Pausa')
              : 'Evento';
          const category = isDown ? 'Paradas' : isStandby ? 'Pausas' : 'Eventos';
          const code = descId ? String(descId) : (isDown ? 'STOP' : isStandby ? 'PAUSE' : 'EVENT');
          const key = `${stateText}:${descId}`;

          if (!aggregate.has(key)) {
            aggregate.set(key, { id: key, code, description: motivo, category, totalSec: 0, occurrences: 0 });
          }
          const agg = aggregate.get(key)!;
          agg.totalSec += durationSec;
          agg.occurrences += 1;
        }

        const topStopReasons = Array.from(aggregate.values())
          .sort((a, b) => b.totalSec - a.totalSec)
          .map((item) => ({
            id: item.id,
            code: item.code,
            description: item.description,
            category: item.category,
            totalTime: toHHMMSS(item.totalSec),
            occurrences: item.occurrences,
          }));

        console.log('🧮 Consolidação diária (novo):', {
          totalEventos: allEvents.length,
          eventosFiltrados: filtered.length,
          topStopCount: topStopReasons.length
        });

        useProductionStore.setState({
          downtimeHistory: consolidatedHistory,
          topStopReasons,
        });
      } catch (error) {
        console.warn('⚠️ Erro ao consolidar histórico diário de paradas:', error);
        useProductionStore.setState({ downtimeHistory: [], topStopReasons: [] });
      }
    };

    // Substituir o método fetchDowntimeHistory do store, para que o modal utilize a nova lógica
    useProductionStore.setState({
      fetchDowntimeHistory: async () => {
        await loadDailyDowntimes();
      }
    } as any);

    // Executar imediatamente ao abrir o modal
    void loadDailyDowntimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, setupData?.line, deviceSettings.lineId]);

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