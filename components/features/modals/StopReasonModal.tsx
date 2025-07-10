
import React, { useState } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useClock } from '../../../hooks/useClock';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../ui/Card';
import { DowntimeReasonCategory } from '../../../types';
import ProductionLineModal from './ProductionLineModal';
import ShiftModal from './ShiftModal';

// Componente para o gauge circular OEE
const CircularGauge: React.FC<{ 
  value: number; 
  label: string; 
  color: string; 
  size?: number 
}> = ({ value, label, color, size = 180 }) => {
  const radius = size / 2 - 15;
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
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{value.toFixed(1)}%</span>
          <span className="text-base text-white font-medium">{label}</span>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <div className="text-center">
          <div className="text-green-400 font-bold">Availability (92,5%)</div>
        </div>
        <div className="text-center">
          <div className="text-orange-400 font-bold">Performance (87,7%)</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-bold">Quality (98,1%)</div>
        </div>
      </div>
    </div>
  );
};

const StopReasonModal: React.FC = () => {
  const { liveMetrics, currentJob, downtimeReasons, registerStopReason, currentProductionLine, currentShift } = useProductionStore();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(downtimeReasons[0]?.category || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showProductionLineModal, setShowProductionLineModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const currentTime = useClock();
  const { user } = useAuth();

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    registerStopReason(reason);
    setShowReasonModal(false);
    setCustomReason(''); // Limpar campo customizado
  };

  const handleCustomReasonSubmit = () => {
    if (customReason.trim()) {
      handleReasonSelect(customReason.trim());
    }
  };

  const filteredReasons = downtimeReasons
    .find(cat => cat.category === activeCategory)?.reasons
    .filter(reason => reason.description.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  // Dados das barras de progresso
  const progressBars = [
    {
      label: 'Ordem de Produção',
      current: 213,
      target: 1240,
      percentage: (213 / 1240) * 100
    },
    {
      label: 'Prod. Possível',
      current: 275,
      target: 240,
      percentage: (275 / 240) * 100
    },
    {
      label: 'Tempo no Turno',
      current: '2,3hr',
      target: '7,8hr',
      percentage: (2.3 / 7.8) * 100
    },
    {
      label: 'Velocidade (Média)',
      current: '27,6/hr',
      target: '(Instantânea) 29,3/hr',
      percentage: (27.6 / 29.3) * 100
    }
  ];

  return (
    <div className="h-screen bg-background flex flex-col ml-16">
      {/* Header Vermelho - seguindo especificações exatas */}
      <header className="bg-red-600 h-16 flex items-center justify-between relative" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Logotipo e ENVASE (Lado Esquerdo) */}
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <img 
              src="/assets/images/logo/option7-logo.svg" 
              alt="Option7" 
              className="h-6 w-auto"
            />
          </div>
          <button
            onClick={() => setShowProductionLineModal(true)}
            className="text-2xl font-bold text-white ml-4 hover:text-gray-200 transition-colors cursor-pointer"
          >
            {currentProductionLine?.name || 'ENVASE 520741-8'}
          </button>
        </div>
        
        {/* PARADA: INFORME O MOTIVO (Centro) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-2xl font-bold text-white whitespace-nowrap">PARADA: INFORME O MOTIVO</h2>
        </div>
        
        {/* TURNO 2 e Ícones (Lado Direito) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowShiftModal(true)}
            className="text-2xl font-bold text-white mr-4 hover:text-gray-200 transition-colors cursor-pointer"
          >
            {currentShift?.name || 'TURNO 2'}
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-hidden">
        {/* Primeira Linha de Cards - 16px do header */}
        <div className="grid grid-cols-3 gap-4 mx-4 mt-4">
          {/* Card TOTAL */}
          <Card className="bg-gray-700 px-4 py-4">
            <div className="text-left">
              <div className="text-sm text-gray-400 mb-2">TOTAL</div>
              <div className="text-5xl font-bold text-white text-center">240</div>
            </div>
          </Card>
          
          {/* Card BOAS */}
          <Card className="bg-gray-700 px-4 py-4">
            <div className="text-left">
              <div className="text-sm text-gray-400 mb-2">BOAS</div>
              <div className="text-5xl font-bold text-white text-center">213</div>
            </div>
          </Card>
          
          {/* Card REJEITOS */}
          <Card className="bg-gray-700 px-4 py-4">
            <div className="text-left">
              <div className="text-sm text-gray-400 mb-2">REJEITOS</div>
              <div className="text-5xl font-bold text-white text-center">03</div>
            </div>
          </Card>
        </div>

        {/* Barra de Status PARADA - 16px dos cards */}
        <div className="mx-4 mt-4">
          <button 
            onClick={() => setShowReasonModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg text-xl font-bold transition-colors text-center"
          >
            PARADA -INFORME O MOTIVO
          </button>
        </div>

        {/* Seção Inferior - 16px da barra de status */}
        <div className="grid grid-cols-2 gap-4 mx-4 mt-4 flex-1">
          {/* Coluna Esquerda - Medidor OEE e Progresso */}
          <div className="space-y-4">
            {/* Medidor de OEE */}
            <Card className="p-4 text-center bg-gray-800">
              <CircularGauge value={80.1} label="OEE" color="#3b82f6" size={180} />
            </Card>

            {/* Informações de Progresso */}
            <Card className="p-4 bg-gray-800">
              <div className="space-y-2">
                {progressBars.map((bar, index) => (
                  <div key={index} className={index > 0 ? 'mt-2' : ''}>
                    <div className="flex justify-between text-sm text-white mb-1">
                      <span className="text-left">{bar.label}</span>
                      <span className="text-right font-bold">{bar.current}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(bar.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Good Parts e Rejects */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm">Good Parts</span>
                <span className="text-white font-bold text-sm">(98,6%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-white text-sm">Rejects</span>
                <span className="text-white font-bold text-sm">(0,4%)</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Detalhes e Gráfico */}
          <div className="space-y-4">
            {/* Título GUARANA 500ml */}
            <div>
              <h3 className="text-2xl font-bold text-white text-left mb-2">GUARANA 500ml</h3>
            </div>

            {/* Detalhes da Ordem de Produção */}
            <Card className="p-4 bg-gray-800">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">ORDEM DE PRODUÇÃO</span>
                  <span className="text-sm font-bold text-white">5207418</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">QUANTIDADE OP</span>
                  <span className="text-sm font-bold text-white">1241</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">No DO PRODUTO</span>
                  <span className="text-sm font-bold text-white">240042176</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">DESCRIÇÃO</span>
                  <span className="text-sm font-bold text-white">GUARANA 500ml</span>
                </div>
              </div>
            </Card>

            {/* Gráfico de Barras */}
            <Card className="p-4 bg-gray-800">
              <div className="flex items-end justify-center gap-3 h-24 mb-3">
                {[
                  { height: 70, good: true },
                  { height: 60, good: true },
                  { height: 80, good: true },
                  { height: 55, good: true }
                ].map((bar, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className="bg-green-500 w-8 rounded-t"
                        style={{ height: `${bar.height}px` }}
                      />
                      <div 
                        className="bg-red-500 w-8 rounded-b"
                        style={{ height: `${Math.random() * 10 + 5}px` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{index + 1}h</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white">Boas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white">Rejeitos</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Relógio */}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-base font-bold">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé Machine Controls - 24px da seção inferior */}
        <div className="mt-6 px-4 pb-4">
          <h3 className="text-white font-semibold mb-3 text-base">Machine Controls</h3>
          <div className="flex justify-between gap-4">
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span className="text-sm font-medium">Running</span>
            </button>
            
            <button className="flex-1 bg-red-600 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 ring-2 ring-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" x2="12" y1="9" y2="13"/>
                <line x1="12" x2="12.01" y1="17" y2="17"/>
              </svg>
              <span className="text-sm font-medium">Down</span>
            </button>
            
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span className="text-sm font-medium">Setup</span>
            </button>
            
            <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              <span className="text-sm font-medium">Pause</span>
            </button>
            
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
              <span className="text-sm font-medium">Call for Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Motivo */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Selecione o Motivo da Parada</h3>
              
              <div className="flex items-center gap-4">
                {/* Campo para motivo customizado */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o motivo da parada..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomReasonSubmit()}
                    className="w-80 bg-background p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  />
                  <button
                    onClick={handleCustomReasonSubmit}
                    disabled={!customReason.trim()}
                    className="bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowReasonModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="6" y1="6" y2="18"/>
                    <line x1="6" x2="18" y1="6" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <input
                  type="text"
                  placeholder="🔍 Pesquisar motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-background p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary mb-4 text-white"
                />
                
                <div className="flex flex-col space-y-2">
                  {downtimeReasons.map((cat: DowntimeReasonCategory) => (
                    <button
                      key={cat.category}
                      onClick={() => setActiveCategory(cat.category)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        activeCategory === cat.category 
                          ? 'bg-primary text-white font-semibold' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                {filteredReasons.map(reason => (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason.description)}
                    className="bg-background hover:bg-primary/50 text-white p-4 rounded-lg transition-colors text-center border border-gray-600 hover:border-primary"
                  >
                    <p className="font-semibold">{reason.description}</p>
                    <p className="text-xs text-muted">{reason.code}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Linha de Produção e Turno */}
      {showProductionLineModal && (
        <ProductionLineModal onClose={() => setShowProductionLineModal(false)} />
      )}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
    </div>
  );
};

export default StopReasonModal;
