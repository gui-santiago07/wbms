import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useClock } from '../../../hooks/useClock';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../ui/Card';
import { DowntimeReasonCategory } from '../../../types';
import ProductionLineModal from './ProductionLineModal';
import ShiftModal from './ShiftModal';
import { ViewState } from '../../../types';
import StopReasonsList from '../dashboard/StopReasonsList';

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
  const { liveMetrics, currentJob, downtimeReasons, downtimeHistory, registerStopReason, currentProductionLine, currentShift, fetchStopReasons, fetchDowntimeHistory, isLoading, error, setView } = useProductionStore();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(downtimeReasons[0]?.category || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showProductionLineModal, setShowProductionLineModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentTime = useClock();
  const { user } = useAuth();

  // Carregar motivos de parada e histórico quando o modal for montado
  useEffect(() => {
    if (downtimeReasons.length === 0) {
      console.log('🛑 Modal: Carregando motivos de parada...');
      fetchStopReasons();
    }
    
    // Carregar histórico de paradas
    console.log('🛑 Modal: Carregando histórico de paradas...');
    fetchDowntimeHistory();
  }, [downtimeReasons.length, fetchStopReasons, fetchDowntimeHistory]);

  const handleReasonSelect = async (reason: string, reasonId?: string) => {
    if (isSubmitting) {
      console.log('⚠️ Já está processando uma seleção de motivo...');
      return;
    }
    
    console.log('🔄 Selecionando motivo da parada:', { reason, reasonId });
    setIsSubmitting(true);
    setSelectedReason(reason);
    
    try {
      await registerStopReason(reason, reasonId);
      console.log('✅ Motivo registrado com sucesso, redirecionando para o dashboard...');
      
      // Feedback visual de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <span>✅</span>
        <span>Motivo registrado: ${reason}</span>
      `;
      document.body.appendChild(successMessage);
      
      // Limpar estados locais
      setCustomReason('');
      setShowReasonModal(false);
      
      // Aguardar um pequeno delay para garantir que os estados foram atualizados
      setTimeout(() => {
        // Remover mensagem de sucesso
        if (successMessage.parentNode) {
          successMessage.parentNode.removeChild(successMessage);
        }
        // Redirecionar para o dashboard
        setView(ViewState.DASHBOARD);
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao registrar motivo:', error);
      
      // Adicionar erro ao DebugPanel
      const debugLog = (window as any).addDebugLog;
      if (debugLog) {
        debugLog('error', '❌ Erro ao registrar motivo da parada', {
          reason,
          reasonId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomReasonSubmit = async () => {
    if (customReason.trim() && !isSubmitting) {
      await handleReasonSelect(customReason.trim());
    }
  };

  const filteredReasons = downtimeReasons
    .find(cat => cat.category === activeCategory)?.reasons
    .filter(reason => reason.description.toLowerCase().includes(searchTerm.toLowerCase())) || [];

      return (
      <div className="min-h-screen bg-background flex flex-col ml-16 overflow-y-auto">
      {/* Header Vermelho - seguindo especificações exatas */}
      <header className="bg-red-600 h-16 flex items-center justify-between relative" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Logotipo e Linha de Produção (Lado Esquerdo) */}
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
            {currentProductionLine?.line || 'Linha de Produção'}
          </button>
        </div>
        
        {/* PARADA: INFORME O MOTIVO (Centro) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-2xl font-bold text-white whitespace-nowrap">PARADA: INFORME O MOTIVO</h2>
        </div>
        
        {/* Turno e Ícones (Lado Direito) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowShiftModal(true)}
            className="text-2xl font-bold text-white mr-4 hover:text-gray-200 transition-colors cursor-pointer"
          >
            {currentShift?.name || 'Turno'}
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
      <div className="flex-1 overflow-y-auto">
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
        <div className="grid grid-cols-2 gap-4 mx-4 mt-4">
          {/* Coluna Esquerda - Análise de Paradas */}
          <div className="space-y-4">
            {/* Métricas OEE e Disponibilidade */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center bg-gray-800">
                <CircularGauge value={liveMetrics.oee} label="OEE" color="#3b82f6" size={120} />
              </Card>
              <Card className="p-4 text-center bg-gray-800">
                <CircularGauge value={liveMetrics.availability} label="Disponibilidade" color="#22c55e" size={120} />
              </Card>
            </div>

            {/* Estatísticas de Tempo */}
            <Card className="p-4 bg-gray-800">
              <h4 className="text-lg font-semibold text-white mb-4">Distribuição de Tempo</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Tempo Produzindo</span>
                  <span className="text-sm font-bold text-green-400">6h 23m</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Tempo Parado</span>
                  <span className="text-sm font-bold text-red-400">1h 12m</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Setup</span>
                  <span className="text-sm font-bold text-blue-400">25m</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '3%' }} />
                </div>
              </div>
            </Card>

            {/* Good Parts */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm">Good Parts</span>
                <span className="text-white font-bold text-sm">(100%)</span>
              </div>
            </div>
          </div>

                       {/* Coluna Direita - Histórico de Paradas */}
             <div className="space-y-4">
               {/* Título da Seção */}
               <div>
                 <h3 className="text-2xl font-bold text-white text-left mb-2">Histórico de Paradas</h3>
                 <p className="text-sm text-gray-400">Análise dos motivos e tempos de parada</p>
               </div>

                         {/* Principais Paradas */}
             <Card className="p-4 bg-gray-800">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-lg font-semibold text-white">Principais Paradas</h4>
                 <div className="text-sm text-gray-400">Hoje</div>
               </div>
               <StopReasonsList />
             </Card>

             {/* Histórico Detalhado de Paradas */}
             <Card className="p-4 bg-gray-800">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-lg font-semibold text-white">Histórico de Paradas</h4>
                 <div className="text-sm text-gray-400">Últimas ocorrências</div>
               </div>
               <div className="space-y-3 max-h-48 overflow-y-auto">
                 {downtimeHistory.length > 0 ? (
                   downtimeHistory.slice(0, 5).map((event, index) => (
                     <div key={event.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-xs font-bold">
                           {index + 1}
                         </div>
                         <div>
                           <div className="text-sm font-semibold text-white">
                             {event.reason}
                           </div>
                           <div className="text-xs text-gray-400">
                             {event.startTime} - {event.endTime || 'Em andamento'}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-semibold text-white">
                           {event.totalTime || '--:--:--'}
                         </div>
                         <div className="text-xs text-gray-400">Tempo</div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-4">
                     <div className="text-gray-400 text-sm">Nenhuma parada registrada</div>
                   </div>
                 )}
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

        {/* Espaçamento para o Machine Controls fixo */}
        <div className="pb-32"></div>
      </div>

      {/* Modal de Seleção de Motivo */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Selecione o Motivo da Parada</h3>
              
              {error && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button
                      onClick={() => fetchStopReasons()}
                      className="ml-2 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
              
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
                    disabled={!customReason.trim() || isSubmitting}
                    className="bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </>
                    ) : (
                      'Confirmar'
                    )}
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
                
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm">Carregando motivos de parada...</span>
                    </div>
                  </div>
                ) : downtimeReasons.length > 0 ? (
                  <div className="flex flex-col space-y-2">
                    {downtimeReasons.map((cat: DowntimeReasonCategory) => {
                      // Definir ícone baseado na categoria
                      const getCategoryIcon = (category: string) => {
                        switch (category) {
                          case 'Manutenção': return '🔧';
                          case 'Falhas': return '⚠️';
                          case 'Paradas': return '⏸️';
                          case 'Ajustes': return '⚙️';
                          case 'Falta de Material': return '📦';
                          case 'Trocas': return '🔄';
                          case 'Aguardando': return '⏳';
                          case 'Limpeza': return '🧹';
                          case 'Produção': return '🏭';
                          case 'Energia': return '⚡';
                          case 'Operacional': return '👷';
                          case 'Retrabalho': return '🔄';
                          case 'Correções': return '🔧';
                          case 'Testes': return '🧪';
                          case 'Material': return '📋';
                          default: return '📋';
                        }
                      };
                      
                      return (
                        <button
                          key={cat.category}
                          onClick={() => setActiveCategory(cat.category)}
                          className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                            activeCategory === cat.category 
                              ? 'bg-primary text-white font-semibold' 
                              : 'bg-gray-700 hover:bg-gray-600 text-white'
                          }`}
                        >
                          <span className="text-lg">{getCategoryIcon(cat.category)}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-xs opacity-75">{cat.reasons.length} motivos</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-gray-400 text-lg mb-2">⚠️</div>
                      <p className="text-white text-sm mb-1">Nenhuma categoria disponível</p>
                      <p className="text-gray-400 text-xs">Verifique a conexão com a API</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                {searchTerm && (
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-white text-sm">
                      🔍 Encontrados <span className="font-bold text-primary">{filteredReasons.length}</span> motivos para "{searchTerm}"
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                  {isLoading ? (
                    <div className="col-span-full flex items-center justify-center p-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white text-sm">Carregando motivos...</span>
                      </div>
                    </div>
                  ) : filteredReasons.length > 0 ? (
                    filteredReasons.map(reason => (
                      <button
                        key={reason.id}
                        onClick={() => handleReasonSelect(reason.description, reason.id)}
                        disabled={isSubmitting}
                        className="bg-background hover:bg-primary/50 text-white p-4 rounded-lg transition-colors text-left border border-gray-600 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed h-full"
                      >
                        <div className="flex flex-col h-full">
                          <p className="font-semibold text-sm leading-tight mb-2 flex-1">{reason.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">#{reason.code}</span>
                            <span className="text-xs text-gray-400">Clique para selecionar</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="text-gray-400 text-lg mb-2">📋</div>
                        <p className="text-white text-sm mb-1">Nenhum motivo encontrado</p>
                        <p className="text-gray-400 text-xs">Tente ajustar sua pesquisa ou use o campo personalizado acima</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Machine Controls Fixo */}
      <div className="fixed bottom-0 left-16 right-0 bg-background border-t border-gray-700 px-4 py-4 z-50">
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
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
