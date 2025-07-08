import React, { useState } from 'react';
import Card from '../../ui/Card';
import Header from './Header';
import ProductionDetails from './ProductionDetails';
import MachineControls from './MachineControls';
import Sidebar from './Sidebar';
import StopReasonModal from '../modals/StopReasonModal';
import SetupModal from '../modals/SetupModal';
import { useProductionStore } from '../../../store/useProductionStore';
import { ViewState } from '../../../types';
import { useLiveDataPolling } from '../../../hooks/useLiveDataPolling';

// Tipos para os filtros de tempo
type TimePeriod = '1h' | '4h' | '8h' | '24h' | '7d';

// Dados mockados para diferentes períodos
const historicalData = {
  '1h': {
    points: [
      { x: 10, y: 78 },
      { x: 25, y: 80 },
      { x: 40, y: 82 },
      { x: 55, y: 79 },
      { x: 70, y: 85 },
      { x: 85, y: 83 },
      { x: 100, y: 87 },
      { x: 115, y: 84 },
      { x: 130, y: 89 },
      { x: 145, y: 86 },
      { x: 160, y: 91 },
      { x: 175, y: 88 },
      { x: 190, y: 90 },
    ],
    timeLabels: ['05:00 PM', '05:20 PM', '05:40 PM'],
    trend: '+12.0%',
    trendColor: 'text-green-400'
  },
  '4h': {
    points: [
      { x: 10, y: 75 },
      { x: 30, y: 78 },
      { x: 50, y: 82 },
      { x: 70, y: 79 },
      { x: 90, y: 85 },
      { x: 110, y: 83 },
      { x: 130, y: 87 },
      { x: 150, y: 84 },
      { x: 170, y: 88 },
      { x: 190, y: 90 },
    ],
    timeLabels: ['02:00 PM', '04:00 PM', '06:00 PM'],
    trend: '+15.0%',
    trendColor: 'text-green-400'
  },
  '8h': {
    points: [
      { x: 10, y: 70 },
      { x: 35, y: 73 },
      { x: 60, y: 76 },
      { x: 85, y: 79 },
      { x: 110, y: 82 },
      { x: 135, y: 85 },
      { x: 160, y: 87 },
      { x: 185, y: 90 },
    ],
    timeLabels: ['10:00 AM', '02:00 PM', '06:00 PM'],
    trend: '+20.0%',
    trendColor: 'text-green-400'
  },
  '24h': {
    points: [
      { x: 10, y: 65 },
      { x: 40, y: 68 },
      { x: 70, y: 72 },
      { x: 100, y: 75 },
      { x: 130, y: 78 },
      { x: 160, y: 82 },
      { x: 190, y: 85 },
    ],
    timeLabels: ['Ontem', 'Hoje 12h', 'Agora'],
    trend: '+20.0%',
    trendColor: 'text-green-400'
  },
  '7d': {
    points: [
      { x: 10, y: 60 },
      { x: 40, y: 65 },
      { x: 70, y: 70 },
      { x: 100, y: 75 },
      { x: 130, y: 78 },
      { x: 160, y: 82 },
      { x: 190, y: 85 },
    ],
    timeLabels: ['7 dias', '3 dias', 'Hoje'],
    trend: '+25.0%',
    trendColor: 'text-green-400'
  }
};

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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className="text-sm text-muted mt-2">{label}</span>
    </div>
  );
};

// Componente para o gráfico de tendência OEE com filtros funcionais
const OeeTrendChart: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1h');
  const currentData = historicalData[selectedPeriod];

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
  const { liveMetrics, currentJob } = useProductionStore();
  const goodPartsPercent = liveMetrics.total > 0 ? (liveMetrics.good / liveMetrics.total) * 100 : 98.6;
  const rejectsPercent = liveMetrics.total > 0 ? (liveMetrics.rejects / liveMetrics.total) * 100 : 1.4;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seção de Produção - 2 colunas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas de Produção */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
                  <path d="M7 11h8"/>
                  <path d="M7 16h12"/>
                  <path d="M7 6h12"/>
                </svg>
                Production
              </h2>
              <div className="text-sm text-muted">01:14 PM - 05:14 PM</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Target</div>
                <div className="text-3xl font-bold text-white">240</div>
              </div>
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Actual</div>
                <div className="text-3xl font-bold text-white">216</div>
              </div>
              <div className="bg-surface p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Completion</div>
                <div className="text-3xl font-bold text-white">90.0%</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted">Progress</span>
                <span className="text-sm text-muted">216 / 240</span>
              </div>
              <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500 ease-out"
                  style={{ width: '90%' }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-white">Good Parts</span>
                <span className="text-sm font-bold text-white">213 (98.6%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-white">Rejects</span>
                <span className="text-sm font-bold text-white">3 (1.4%)</span>
              </div>
            </div>
          </Card>

          {/* Métricas OEE */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <CircularGauge value={80.0} label="OEE" color="#3b82f6" />
            </Card>
            <Card className="p-4 text-center">
              <CircularGauge value={92.5} label="Availability" color="#22c55e" />
            </Card>
            <Card className="p-4 text-center">
              <CircularGauge value={87.3} label="Performance" color="#f59e0b" />
            </Card>
            <Card className="p-4 text-center">
              <CircularGauge value={99.1} label="Quality" color="#8b5cf6" />
            </Card>
          </div>
        </div>

        {/* Detalhes da Produção - 1 coluna */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Production Details</h3>
              <span className="text-sm font-semibold text-blue-400">Turno 2</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Ordem de Produção</span>
                <span className="text-sm font-semibold text-white">5207418</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Quantidade OP</span>
                <span className="text-sm font-semibold text-white">1241</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Product Code</span>
                <span className="text-sm font-semibold text-white">24004217</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Product ID</span>
                <span className="text-sm font-semibold text-white">Guarana 500ml</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <OeeTrendChart />
          </Card>
        </div>
      </div>

      {/* Controles da Máquina */}
      <MachineControls />
    </div>
  );
};

const OeeScreen: React.FC = () => {
  const { view } = useProductionStore();
  
  useLiveDataPolling(3000);

  const renderView = () => {
    switch (view) {
      case ViewState.OEE:
        return <OeeView />;
      case ViewState.STOP_REASON:
        return <StopReasonModal />;
      case ViewState.SETUP:
        return <SetupModal />;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen ml-16">
      <Sidebar />
      <Header />
      
      <main className="mt-6">
        {renderView()}
      </main>
    </div>
  );
};

export default OeeScreen; 