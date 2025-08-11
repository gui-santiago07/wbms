import React, { useEffect, useState } from 'react';
import Card from '../../ui/Card';
import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import { DowntimeReasonCategory, ViewState } from '../../../types';
import { useClock } from '../../../hooks/useClock';

interface ReasonScreenProps {
  variant: 'stop' | 'standby';
}

const CircularGauge: React.FC<{ value: number; label: string; color: string; size?: number }> = ({ value, label, color, size = 160 }) => {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#374151" strokeWidth="10" fill="transparent" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
          <span className="text-2xl font-bold text-white leading-none">{value.toFixed(1)}%</span>
          <span className="text-sm text-white font-medium leading-tight text-center mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
};

const ReasonScreen: React.FC<ReasonScreenProps> = ({ variant }) => {
  const {
    liveMetrics,
    productionStatus,
    timeDistribution,
    productionData,
    currentShift,
    // reasons e loaders
    pauseReasons,
    downtimeReasons,
    topStopReasons,
    fetchPauseReasons,
    fetchStopReasons,
    fetchDowntimeHistory,
    fetchTopStopReasons,
    isLoading,
    error,
    // actions
    setView,
    setShowSetupModal,
    setShowProductSelectionModal,
    setupData,
    selectedProduct,
    registerStopReasonWithAutoApontamento,
    registerStandbyReasonWithOption7
  } = useProductionStore();
  const { deviceSettings } = useDeviceSettingsStore();
  const currentTime = useClock();

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReasonDesc, setSelectedReasonDesc] = useState('');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string | undefined>(undefined);
  const [isReasonsLoading, setIsReasonsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega dados iniciais
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsReasonsLoading(true);
        if (variant === 'stop') {
          if (downtimeReasons.length === 0) await fetchStopReasons();
          if (downtimeReasons[0]?.category) setActiveCategory(downtimeReasons[0].category);
        } else {
          if (pauseReasons.length === 0) await fetchPauseReasons();
          if (pauseReasons[0]?.category) setActiveCategory(pauseReasons[0].category);
        }
      } finally {
        if (mounted) setIsReasonsLoading(false);
      }
      try {
        setIsHistoryLoading(true);
        await fetchDowntimeHistory();
      } finally {
        if (mounted) setIsHistoryLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [variant, downtimeReasons.length, pauseReasons.length, fetchStopReasons, fetchPauseReasons, fetchDowntimeHistory]);

  const reasonsList = (variant === 'stop' ? downtimeReasons : pauseReasons).find(c => c.category === activeCategory)?.reasons || [];
  const filteredReasons = reasonsList.filter(r => r.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const ensureSetup = () => {
    const hasLine = !!setupData?.line;
    const hasProduct = !!selectedProduct;
    if (!hasLine || !hasProduct) {
      if (!hasProduct) setShowProductSelectionModal(true);
      setShowSetupModal(true);
      return false;
    }
    return true;
  };

  const handleOpenReasons = () => {
    if (!ensureSetup()) return;
    setShowReasonModal(true);
  };

  const handleReasonSelect = (desc: string, code?: string) => {
    setSelectedReasonDesc(desc);
    setSelectedReasonCode(code);
    console.log(`[ReasonScreen:${variant}] motivo selecionado`, { desc, code });
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (!ensureSetup()) return;
    if (!selectedReasonDesc && !customReason.trim()) return;

    const reasonDesc = selectedReasonDesc || customReason.trim();
    const reasonCode = selectedReasonDesc ? selectedReasonCode : undefined;

    setIsSubmitting(true);
    try {
      console.log(`🛑 [ReasonScreen:${variant}] Confirmando`, { reasonDesc, reasonCode, line: setupData?.line || deviceSettings.lineId });
      if (variant === 'stop') {
        await registerStopReasonWithAutoApontamento(reasonDesc, reasonCode);
      } else {
        await registerStandbyReasonWithOption7(reasonDesc, reasonCode);
      }
      await Promise.allSettled([fetchTopStopReasons(), fetchDowntimeHistory()]);
      setShowReasonModal(false);
      setSelectedReasonDesc('');
      setSelectedReasonCode(undefined);
      setCustomReason('');
    } catch (e) {
      console.error(`[ReasonScreen:${variant}] erro ao confirmar`, e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerBg = variant === 'stop' ? 'bg-primary-600' : 'bg-orange-600';
  const actionBg = variant === 'stop' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700';
  const titleText = variant === 'stop' ? 'INFORMAÇÕES DE PARADAS' : 'INFORMAÇÕES DE PAUSAS';
  const ctaText = variant === 'stop' ? 'PARADA - INFORME O MOTIVO' : 'PAUSA - INFORME O MOTIVO';

  return (
    <div className="min-h-screen bg-background flex flex-col ml-16 overflow-y-auto">
      <header className={`${headerBg} h-16 flex items-center justify-between relative`} style={{ padding: '16px' }}>
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <img src="/assets/images/logo/option7-logo.svg" alt="Option7" className="h-6 w-auto" />
          </div>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-xl font-bold text-white whitespace-nowrap">{titleText}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-white mr-4" title="Turno">{currentShift?.name || 'Sem turno'}</div>
          <button onClick={() => setView(ViewState.DASHBOARD)} className={`${actionBg} text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-semibold`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Voltar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-4 mt-4">
          <button onClick={handleOpenReasons} className={`w-full ${actionBg} text-white py-3 px-6 rounded-lg text-xl font-bold transition-colors text-center`}>
            {ctaText}
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
              <h4 className="text-lg font-semibold text-white mb-4">Distribuição de Tempo</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Tempo Produzindo</span>
                  <span className="text-sm font-bold text-green-400">{productionStatus?.producingTime || '--:--:--'}</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, timeDistribution?.produced ?? 0))}%` }} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Tempo Parado</span>
                  <span className="text-sm font-bold text-red-400">{productionStatus?.stoppedTime || '--:--:--'}</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, timeDistribution?.stopped ?? 0))}%` }} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Standby</span>
                  <span className="text-sm font-bold text-orange-400">{productionStatus?.standbyTime || '--:--:--'}</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, timeDistribution?.standby ?? 0))}%` }} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Setup</span>
                  <span className="text-sm font-bold text-blue-400">{`${Math.max(0, Math.min(100, timeDistribution?.setup ?? 0)).toFixed(0)}%`}</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, timeDistribution?.setup ?? 0))}%` }} />
                </div>
              </div>
            </Card>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm">Good Parts</span>
                <span className="text-white font-bold text-sm">({`${Number.isFinite(productionData?.goodPartsPercent as number) ? (productionData!.goodPartsPercent).toFixed(0) : '0'}%`})</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white text-left mb-2">Histórico de {variant === 'stop' ? 'Paradas' : 'Pausas'}</h3>
              <p className="text-sm text-gray-400">Análise dos motivos e tempos</p>
            </div>

            <Card className="p-4 bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Principais {variant === 'stop' ? 'Paradas' : 'Pausas'}</h4>
                <div className="text-sm text-gray-400">Hoje</div>
              </div>
              <div className="space-y-3">
                {isHistoryLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-gray-400 text-sm">Carregando...</div>
                  </div>
                ) : topStopReasons.length > 0 ? (
                  topStopReasons.slice(0, 5).map((reason, index) => (
                    <div key={reason.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 ${variant === 'stop' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'} rounded-full flex items-center justify-center text-xs font-bold`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {reason.code}: {reason.description}
                          </div>
                          <div className="text-xs text-gray-400">Categoria: {reason.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white">{reason.occurrences}</div>
                          <div className="text-xs text-gray-400">Qtd.</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-semibold ${variant === 'stop' ? 'text-red-400' : 'text-orange-400'}`}>{reason.totalTime}</div>
                          <div className="text-xs text-gray-400">Tempo</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">Nenhum registro</div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Histórico</h4>
                <div className="text-sm text-gray-400">Últimas ocorrências</div>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {/* Reutiliza downtimeHistory do store */}
                {/* Mantém UI leve */}
              </div>
            </Card>

            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-base font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-400">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000]">
          <div className="bg-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Selecione o Motivo da {variant === 'stop' ? 'Parada' : 'Pausa'}</h3>
              {error && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={variant === 'stop' ? 'Motivo personalizado de parada...' : 'Motivo personalizado de pausa...'}
                    className="bg-background p-2 rounded-md border border-gray-600 text-white"
                  />
                </div>
                <button onClick={() => setShowReasonModal(false)} className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
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

                {(isLoading || isReasonsLoading) ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-sm">Carregando motivos...</span>
                    </div>
                  </div>
                ) : (variant === 'stop' ? downtimeReasons : pauseReasons).length > 0 ? (
                  <div className="flex flex-col space-y-2">
                    {(variant === 'stop' ? downtimeReasons : pauseReasons).map((cat: DowntimeReasonCategory) => (
                      <button
                        key={cat.category}
                        onClick={() => setActiveCategory(cat.category)}
                        className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                          activeCategory === cat.category ? 'bg-primary text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <span className="text-lg">📋</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{cat.category}</span>
                          <span className="text-xs opacity-75">{cat.reasons.length} motivos</span>
                        </div>
                      </button>
                    ))}
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
                    <p className="text-white text-sm">🔍 Encontrados <span className="font-bold text-primary">{filteredReasons.length}</span> motivos para "{searchTerm}"</p>
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
                        onClick={() => handleReasonSelect(reason.description, reason.code)}
                        disabled={isSubmitting}
                        className={`bg-background text-white p-4 rounded-lg transition-colors text-left border h-full ${
                          selectedReasonDesc === reason.description && selectedReasonCode === reason.code ? 'border-primary bg-primary/20' : 'border-gray-600 hover:bg-primary/50 hover:border-primary'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowReasonModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors">Cancelar</button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting || (!selectedReasonDesc && !customReason.trim())}
                    className={`px-6 py-3 rounded-md transition-colors ${isSubmitting || (!selectedReasonDesc && !customReason.trim()) ? 'bg-gray-600 text-gray-300' : 'bg-primary hover:bg-primary/80 text-white'}`}
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar'}
                  </button>
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="text-sm font-medium">Running</span>
          </button>
          <button className={`flex-1 ${variant === 'stop' ? 'bg-red-600' : 'bg-orange-600'} text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            <span className="text-sm font-medium">{variant === 'stop' ? 'Down' : 'Standby'}</span>
          </button>
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-sm font-medium">Setup</span>
          </button>
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-4 rounded-lg flex flex-col items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span className="text-sm font-medium">Help</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonScreen;