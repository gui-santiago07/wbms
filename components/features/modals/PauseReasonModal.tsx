import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useAuth } from '../../../contexts/AuthContext';
import { useClock } from '../../../hooks/useClock';
import { ViewState } from '../../../types';
import Card from '../../ui/Card';

const CircularGauge: React.FC<{ 
  value: number; 
  label: string; 
  color: string; 
  size?: number 
}> = ({ value, label, color, size = 180 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-bold text-white text-2xl">
          {Math.round(value)}%
        </div>
        <div className="text-xs text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  );
};

const PauseReasonModal: React.FC = () => {
  console.log('🔄 PauseReasonModal: Componente montado');
  const { liveMetrics, currentJob, pauseReasons, downtimeHistory, topStopReasons, registerStopReason, registerStopReasonWithAutoApontamento, addToTopStopReasons, currentShift, fetchStopReasons, fetchPauseReasons, fetchDowntimeHistory, isLoading, error, setView } = useProductionStore();
  
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(pauseReasons[0]?.category || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localDowntimeHistory, setLocalDowntimeHistory] = useState(downtimeHistory);
  const [localTopStopReasons, setLocalTopStopReasons] = useState(topStopReasons);
  const currentTime = useClock();
  const { user } = useAuth();

  useEffect(() => {
    if (pauseReasons.length === 0) {
      fetchPauseReasons();
    }
    fetchDowntimeHistory();
  }, [pauseReasons.length, fetchPauseReasons, fetchDowntimeHistory]);

  useEffect(() => {
    setLocalDowntimeHistory(downtimeHistory);
  }, [downtimeHistory]);

  useEffect(() => {
    setLocalTopStopReasons(topStopReasons);
  }, [topStopReasons]);

  const handleReasonSelect = async (reason: string, reasonId?: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSelectedReason(reason);
    
    try {
      setShowReasonModal(false);
      setCustomReason('');
      
      const newEvent = {
        id: Date.now().toString(),
        operator: 'Sistema',
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString(),
        endDate: new Date().toISOString().split('T')[0],
        endTime: new Date().toLocaleTimeString(),
        totalTime: '0',
        reason: reasonId ? `${reason} (ID: ${reasonId})` : reason
      };
      
      setLocalDowntimeHistory(prev => [newEvent, ...prev]);
      addToTopStopReasons(reason, reasonId);
      
      setLocalTopStopReasons(prev => {
        const existingReason = prev.find(r => 
          r.description === reason || r.id === reasonId
        );

        if (existingReason) {
          return prev.map(r => {
            if (r.description === reason || r.id === reasonId) {
              const currentOccurrences = r.occurrences + 1;
              const currentTimeInSeconds = r.totalTime.split(':').reduce((acc, time) => acc * 60 + parseInt(time), 0);
              const newTimeInSeconds = currentTimeInSeconds + 60;
              const hours = Math.floor(newTimeInSeconds / 3600);
              const minutes = Math.floor((newTimeInSeconds % 3600) / 60);
              const seconds = newTimeInSeconds % 60;
              const newTotalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              
              return {
                ...r,
                occurrences: currentOccurrences,
                totalTime: newTotalTime
              };
            }
            return r;
          });
        } else {
          const newStopReason = {
            id: reasonId || Date.now().toString(),
            code: reasonId ? `ID-${reasonId}` : 'NOVO',
            description: reason,
            category: 'Pausa',
            totalTime: '00:01:00',
            occurrences: 1
          };
          
          return [newStopReason, ...prev];
        }
      });
      
      registerStopReasonWithAutoApontamento(reason, reasonId).catch(error => {
        console.error('❌ Erro ao registrar motivo na API:', error);
      });
      
    } catch (error) {
      console.error('❌ Erro ao processar seleção de motivo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomReasonSubmit = async () => {
    if (!customReason.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      setShowReasonModal(false);
      
      const newEvent = {
        id: Date.now().toString(),
        operator: user?.name || 'Operador',
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString(),
        endDate: new Date().toISOString().split('T')[0],
        endTime: new Date().toLocaleTimeString(),
        totalTime: '0',
        reason: `Personalizado: ${customReason}`
      };
      
      setLocalDowntimeHistory(prev => [newEvent, ...prev]);
      addToTopStopReasons(customReason);
      await registerStopReasonWithAutoApontamento(customReason);
      
      setCustomReason('');
    } catch (error) {
      console.error('❌ Erro ao registrar motivo personalizado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReasons = pauseReasons.flatMap(cat => 
    cat.reasons.filter(reason => 
      reason.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Manutenção': return '🔧';
      case 'Falhas': return '⚠️';
      case 'Paradas': return '🛑';
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
      default: return '📝';
    }
  };

  console.log('🔄 PauseReasonModal: Renderizando componente');
  return (
    <div className="min-h-screen bg-background flex flex-col ml-16 overflow-y-auto">
      {/* Header Laranja */}
      <header className="bg-orange-600 h-16 flex items-center justify-between relative" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <img 
              src="/assets/images/logo/option7-logo.svg" 
              alt="Option7" 
              className="h-6 w-auto"
            />
          </div>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-xl font-bold text-white whitespace-nowrap">INFORMAÇÕES DE PAUSAS</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-orange-100">Turno Atual</div>
            <div className="text-lg font-bold text-white">
              {currentShift?.name || 'N/A'}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-orange-100">Horário</div>
            <div className="text-lg font-bold text-white">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          
          <button
            onClick={() => setView(ViewState.DASHBOARD)}
            className="bg-orange-700 hover:bg-orange-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Voltar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-4 mt-4">
          <button 
            onClick={() => setShowReasonModal(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg text-xl font-bold transition-colors text-center"
          >
            PAUSA - INFORME O MOTIVO
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mx-4 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-6 text-center bg-gray-800">
                <CircularGauge value={liveMetrics.oee} label="OEE" color="#3b82f6" size={160} />
              </Card>
              <Card className="p-6 text-center bg-gray-800">
                <CircularGauge value={liveMetrics.availability} label="Disponibilidade" color="#22c55e" size={160} />
              </Card>
            </div>

            <Card className="p-4 bg-gray-800">
              <h4 className="text-lg font-semibold text-white mb-4">Estatísticas de Tempo</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {liveMetrics.timeInShift}
                  </div>
                  <div className="text-sm text-gray-400">Tempo no Turno</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {liveMetrics.totalShiftTime}
                  </div>
                  <div className="text-sm text-gray-400">Tempo Total</div>
                </div>
              </div>
            </Card>

            {currentJob && (
              <Card className="p-4 bg-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Job Atual</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ordem:</span>
                    <span className="text-white font-medium">{currentJob.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Produto:</span>
                    <span className="text-white font-medium">{currentJob.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantidade:</span>
                    <span className="text-white font-medium">{currentJob.orderQuantity}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white text-left mb-2">Histórico de Pausas</h3>
              <p className="text-sm text-gray-400">Análise dos motivos e tempos de pausa</p>
            </div>

            <Card className="p-4 bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Principais Pausas</h4>
                <div className="text-sm text-gray-400">Hoje</div>
              </div>
              <div className="space-y-3">
                {localTopStopReasons.length > 0 ? (
                  localTopStopReasons.slice(0, 5).map((reason, index) => (
                    <div 
                      key={reason.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {reason.code}: {reason.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            Categoria: {reason.category}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white">
                            {reason.occurrences}
                          </div>
                          <div className="text-xs text-gray-400">Qtd.</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-semibold text-orange-400">
                            {reason.totalTime}
                          </div>
                          <div className="text-xs text-gray-400">Tempo Pausado</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">⏸️</div>
                    <p className="text-white text-sm mb-1">Nenhuma pausa registrada hoje</p>
                    <p className="text-gray-400 text-xs">As pausas aparecerão aqui quando registradas</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gray-800">
              <h4 className="text-lg font-semibold text-white mb-4">Histórico Detalhado</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localDowntimeHistory.length > 0 ? (
                  localDowntimeHistory.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-white">{event.reason}</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {event.startTime}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">Nenhum histórico disponível</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Motivo */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Selecione o Motivo da Pausa</h3>
              
              {error && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button
                      onClick={() => fetchPauseReasons()}
                      className="ml-2 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-3">Motivo Personalizado</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Digite um motivo personalizado..."
                  className="flex-1 bg-background p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomReasonSubmit()}
                />
                <button
                  onClick={handleCustomReasonSubmit}
                  disabled={!customReason.trim() || isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
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
                  className="w-full bg-background p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-white"
                />
                
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm">Carregando motivos de pausa...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pauseReasons.length > 0 ? (
                      pauseReasons.map(cat => {
                        const categoryReasons = cat.reasons.filter(reason => 
                          reason.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reason.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.category.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        
                        if (categoryReasons.length === 0) return null;
                        
                        return (
                          <button
                            key={cat.category}
                            onClick={() => setActiveCategory(cat.category)}
                            className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                              activeCategory === cat.category 
                                ? 'bg-orange-500 text-white font-semibold' 
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                          >
                            <span className="text-lg">{getCategoryIcon(cat.category)}</span>
                            <div className="flex flex-col">
                              <span className="font-medium">{cat.category}</span>
                              <span className="text-xs opacity-75">{categoryReasons.length} motivos</span>
                            </div>
                          </button>
                        );
                      })
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
                )}
              </div>
              <div className="md:col-span-2">
                {searchTerm && (
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-white text-sm">
                      🔍 Encontrados <span className="font-bold text-orange-400">{filteredReasons.length}</span> motivos para "{searchTerm}"
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                  {isLoading ? (
                    <div className="col-span-full flex items-center justify-center p-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white text-sm">Carregando motivos...</span>
                      </div>
                    </div>
                  ) : filteredReasons.length > 0 ? (
                    filteredReasons.map(reason => (
                      <button
                        key={reason.id}
                        onClick={() => handleReasonSelect(reason.description, reason.id)}
                        disabled={isSubmitting}
                        className="bg-background hover:bg-orange-500/50 text-white p-4 rounded-lg transition-colors text-left border border-gray-600 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed h-full"
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
          
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
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
          
          <button className="flex-1 bg-orange-600 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 ring-2 ring-orange-400">
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
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
            <span className="text-sm font-medium">Help</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseReasonModal; 