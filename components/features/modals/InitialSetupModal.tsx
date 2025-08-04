import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import { useAuth } from '../../../contexts/AuthContext';
import { useProductionStore } from '../../../store/useProductionStore';
import ShiftsService from '../../../services/shiftsService';

interface Plant {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
}

interface Line {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type SetupStep = 'welcome' | 'plants' | 'sectors' | 'lines' | 'shifts' | 'complete';

const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const { deviceSettings, setDeviceSettings } = useDeviceSettingsStore();
  const { loadRealShifts } = useProductionStore();
  
  // Estados do modal
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados da API
  const [plants, setPlants] = useState<Plant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Seleções do usuário
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Carregar plantas ao abrir o modal
  useEffect(() => {
    if (isOpen && currentStep === 'plants') {
      loadPlants();
    }
  }, [isOpen, currentStep]);

  // Carregar setores quando plantas são selecionadas
  useEffect(() => {
    if (currentStep === 'sectors' && selectedPlants.length > 0) {
      loadSectors();
    }
  }, [currentStep, selectedPlants]);

  // Carregar linhas quando setores são selecionados
  useEffect(() => {
    if (currentStep === 'lines' && selectedSectors.length > 0) {
      loadLines();
    }
  }, [currentStep, selectedSectors]);

  // Carregar turnos quando linha é selecionada
  useEffect(() => {
    if (currentStep === 'shifts' && selectedLine) {
      loadShifts();
    }
  }, [currentStep, selectedLine]);

  // Detectar e pré-selecionar turno atual quando turnos são carregados
  useEffect(() => {
    if (shifts.length > 0 && !selectedShift) {
      const currentShift = detectCurrentShift(shifts);
      if (currentShift) {
        setSelectedShift(currentShift);
        console.log('✅ Turno atual pré-selecionado:', currentShift.name);
      }
    }
  }, [shifts, selectedShift]);

  const loadPlants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('mobile_api_token');
      const response = await fetch('/api/listar-plantas-completo?useIds=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar plantas: ${response.status}`);
      }

      const data = await response.json();
      setPlants(data);
      console.log('✅ Plantas carregadas:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar plantas:', error);
      setError('Erro ao carregar plantas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadSectors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('mobile_api_token');
      const params = new URLSearchParams({
        useIds: 'true',
        ...selectedPlants.reduce((acc, plantId) => {
          acc[`plantas[]`] = plantId;
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/listar-setores-submisso?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar setores: ${response.status}`);
      }

      const data = await response.json();
      setSectors(data);
      console.log('✅ Setores carregados:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar setores:', error);
      setError('Erro ao carregar setores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadLines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('mobile_api_token');
      const params = new URLSearchParams({
        useIds: 'true',
        ...selectedSectors.reduce((acc, sectorId) => {
          acc[`setores[]`] = sectorId;
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/listar-linhas-submisso?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar linhas: ${response.status}`);
      }

      const data = await response.json();
      setLines(data);
      console.log('✅ Linhas carregadas:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar linhas:', error);
      setError('Erro ao carregar linhas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para detectar turno atual baseado no horário
  const detectCurrentShift = (shiftsList: Shift[]): Shift | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return shiftsList.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      const shiftStartMinutes = startHour * 60 + startMin;
      const shiftEndMinutes = endHour * 60 + endMin;
      
      // Lidar com turnos que passam da meia-noite
      if (shiftEndMinutes < shiftStartMinutes) {
        return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
      } else {
        return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
      }
    }) || null;
  };

  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar o serviço de turnos para carregar dados
      const workshifts = await ShiftsService.loadShiftsForInitialSetup(
        selectedPlants[0], // Usar primeira planta selecionada
        selectedSectors[0], // Usar primeiro setor selecionado
        selectedLine?.id // Usar linha selecionada
      );
      
      // Mapear dados da API para o formato esperado pelo modal
      const mappedShifts = workshifts.map(workshift => ({
        id: workshift.id || workshift.shift_config_key,
        name: workshift.name,
        startTime: workshift.start_time || '08:00',
        endTime: workshift.end_time || '18:00'
      }));
      
      setShifts(mappedShifts);
      console.log('✅ Turnos carregados da API Juliia:', mappedShifts);
    } catch (error) {
      console.error('❌ Erro ao carregar turnos:', error);
      setError('Erro ao carregar turnos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlantToggle = (plantId: string) => {
    setSelectedPlants(prev => 
      prev.includes(plantId) 
        ? prev.filter(id => id !== plantId)
        : [...prev, plantId]
    );
  };

  const handleSectorToggle = (sectorId: string) => {
    setSelectedSectors(prev => 
      prev.includes(sectorId) 
        ? prev.filter(id => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  const handleLineSelect = (line: Line) => {
    setSelectedLine(line);
  };

  const handleShiftSelect = (shift: Shift) => {
    setSelectedShift(shift);
  };

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('plants');
    } else if (currentStep === 'plants' && selectedPlants.length > 0) {
      setCurrentStep('sectors');
      setSelectedSectors([]); // Limpar seleção anterior
    } else if (currentStep === 'sectors' && selectedSectors.length > 0) {
      setCurrentStep('lines');
      setSelectedLine(null); // Limpar seleção anterior
    } else if (currentStep === 'lines' && selectedLine) {
      setCurrentStep('shifts');
      setSelectedShift(null); // Limpar seleção anterior
    } else if (currentStep === 'shifts' && selectedShift) {
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    if (currentStep === 'sectors') {
      setCurrentStep('plants');
      setSelectedSectors([]);
    } else if (currentStep === 'lines') {
      setCurrentStep('sectors');
      setSelectedLine(null);
    } else if (currentStep === 'shifts') {
      setCurrentStep('lines');
      setSelectedShift(null);
    } else if (currentStep === 'complete') {
      setCurrentStep('shifts');
    }
  };

  const handleComplete = async () => {
    if (!selectedLine || !selectedShift) return;

    try {
      setLoading(true);
      
      // Atualizar configurações do dispositivo
      await setDeviceSettings({
        plantId: selectedPlants[0], // Usar primeira planta selecionada
        plantName: plants.find(p => p.id === selectedPlants[0])?.name || '',
        sectorId: selectedSectors[0], // Usar primeiro setor selecionado
        sectorName: sectors.find(s => s.id === selectedSectors[0])?.name || '',
        lineId: selectedLine.id,
        lineName: selectedLine.name,
        isConfigured: true
      });

      // Definir turno atual no store de produção
      const { setCurrentShift } = useProductionStore.getState();
      setCurrentShift({
        id: selectedShift.id,
        name: selectedShift.name,
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        isActive: true,
        shiftNumberKey: parseInt(selectedShift.id)
      });

      setLoading(false);
      
      // Fechar modal e chamar callback de conclusão
        onComplete();
      onClose();
      
      console.log('✅ Configuração inicial concluída:', {
        plant: selectedPlants[0],
        sector: selectedSectors[0],
        line: selectedLine,
        shift: selectedShift
      });
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      setError('Erro ao salvar configurações. Tente novamente.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetar estado ao fechar
    setCurrentStep('welcome');
    setSelectedPlants([]);
    setSelectedSectors([]);
    setSelectedLine(null);
    setSelectedShift(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const getStepTitle = () => {
    switch (currentStep) {
      case 'welcome': return 'Bem-vindo ao Sistema OEE';
      case 'plants': return 'Selecionar Plantas';
      case 'sectors': return 'Selecionar Setores';
      case 'lines': return 'Selecionar Linha';
      case 'shifts': return 'Selecionar Turno';
      case 'complete': return 'Configuração Concluída';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome': return true;
      case 'plants': return selectedPlants.length > 0;
      case 'sectors': return selectedSectors.length > 0;
      case 'lines': return selectedLine !== null;
      case 'shifts': return selectedShift !== null;
      case 'complete': return true;
      default: return false;
    }
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Olá, {user?.name || 'Usuário'}!
        </h3>
        <p className="text-muted">
          Vamos configurar seu ambiente de trabalho para começar a usar o sistema OEE.
        </p>
      </div>

      <div className="bg-surface p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">O que vamos configurar:</h4>
        <ul className="text-sm text-muted space-y-1">
          <li>• Planta de produção</li>
          <li>• Setor de trabalho</li>
          <li>• Linha de produção</li>
          <li>• Turno de trabalho</li>
        </ul>
      </div>
    </div>
  );

  const renderPlantsStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione uma ou mais plantas para continuar:
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted ml-2">Carregando plantas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {plants.map(plant => (
            <label key={plant.id} className="flex items-center p-3 bg-surface rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={selectedPlants.includes(plant.id)}
                onChange={() => handlePlantToggle(plant.id)}
                className="mr-3"
              />
              <span className="text-sm text-white">{plant.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const renderSectorsStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione um ou mais setores para continuar:
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted ml-2">Carregando setores...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {sectors.map(sector => (
            <label key={sector.id} className="flex items-center p-3 bg-surface rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={selectedSectors.includes(sector.id)}
                onChange={() => handleSectorToggle(sector.id)}
                className="mr-3"
              />
              <span className="text-sm text-white">{sector.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const renderLinesStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione uma linha para continuar:
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted ml-2">Carregando linhas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {lines.map(line => (
            <label key={line.id} className="flex items-center p-3 bg-surface rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="line"
                checked={selectedLine?.id === line.id}
                onChange={() => handleLineSelect(line)}
                className="mr-3"
              />
              <span className="text-sm text-white">{line.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const renderShiftsStep = () => {
    const currentShift = detectCurrentShift(shifts);
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Selecione seu turno de trabalho. O turno atual será pré-selecionado automaticamente:
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted ml-2">Carregando turnos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {shifts.map(shift => {
              const isCurrentShift = currentShift?.id === shift.id;
              const isSelected = selectedShift?.id === shift.id;
              
              return (
                <label 
                  key={shift.id} 
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary bg-opacity-20 border-2 border-primary' 
                      : isCurrentShift 
                        ? 'bg-green-500 bg-opacity-10 border-2 border-green-500' 
                        : 'bg-surface hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="shift"
                    checked={isSelected}
                    onChange={() => handleShiftSelect(shift)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{shift.name}</span>
                      {isCurrentShift && (
                        <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                          Atual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                </label>
              );
            })}
            
            {!currentShift && shifts.length > 0 && (
              <div className="p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⚠️ Nenhum turno ativo detectado para o horário atual. 
                  Selecione o turno apropriado para seu trabalho.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Configuração Concluída!
        </h3>
        <p className="text-muted">
          Seu ambiente está configurado e pronto para uso.
        </p>
      </div>

      <div className="bg-surface p-4 rounded-lg text-left">
        <h4 className="text-sm font-semibold text-white mb-2">Resumo da configuração:</h4>
        <div className="text-sm text-muted space-y-1">
          <div>• Planta: {plants.find(p => p.id === selectedPlants[0])?.name}</div>
          <div>• Setor: {sectors.find(s => s.id === selectedSectors[0])?.name}</div>
          <div>• Linha: {selectedLine?.name}</div>
          <div className="flex items-center gap-2">
            <span>• Turno: {selectedShift?.name}</span>
            {selectedShift && detectCurrentShift([selectedShift]) && (
              <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                Atual
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcomeStep();
      case 'plants': return renderPlantsStep();
      case 'sectors': return renderSectorsStep();
      case 'lines': return renderLinesStep();
      case 'shifts': return renderShiftsStep();
      case 'complete': return renderCompleteStep();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">{getStepTitle()}</h2>
            {currentStep !== 'welcome' && (
                <button
                onClick={handleClose}
                className="text-muted hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                </button>
            )}
          </div>

          {/* Progress Steps */}
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 'plants' ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  1
                </div>
                <div className={`w-8 h-1 ${
                  currentStep === 'sectors' || currentStep === 'lines' || currentStep === 'shifts' ? 'bg-primary' : 'bg-gray-600'
                }`}></div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 'sectors' ? 'bg-primary text-white' : 
                  currentStep === 'lines' || currentStep === 'shifts' ? 'bg-gray-600 text-gray-300' : 'bg-gray-600 text-gray-300'
                }`}>
                  2
                </div>
                <div className={`w-8 h-1 ${
                  currentStep === 'lines' || currentStep === 'shifts' ? 'bg-primary' : 'bg-gray-600'
                }`}></div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 'lines' ? 'bg-primary text-white' : 
                  currentStep === 'shifts' ? 'bg-gray-600 text-gray-300' : 'bg-gray-600 text-gray-300'
                }`}>
                  3
                </div>
                <div className={`w-8 h-1 ${
                  currentStep === 'shifts' ? 'bg-primary' : 'bg-gray-600'
                }`}></div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 'shifts' ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  4
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
          </div>
        )}

          {/* Content */}
          {renderCurrentStep()}

          {/* Actions */}
          {currentStep !== 'welcome' && (
            <div className="flex justify-between mt-6">
                <button
                onClick={handleBack}
                disabled={currentStep === 'plants'}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Voltar
                </button>
              
              <div className="flex gap-2">
                {currentStep === 'complete' ? (
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Salvando...
            </div>
                    ) : (
                      'Começar'
                    )}
                  </button>
                ) : (
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próximo
                </button>
                )}
              </div>
          </div>
        )}

          {/* Welcome step actions */}
          {currentStep === 'welcome' && (
            <div className="flex justify-center mt-6">
                <button
                onClick={handleNext}
                className="px-6 py-3 text-sm bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                >
                Começar Configuração
                </button>
          </div>
        )}
      </div>
      </Card>
    </div>
  );
};

export default InitialSetupModal; 