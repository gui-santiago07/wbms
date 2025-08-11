import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import { useAuth } from '../../../contexts/AuthContext';

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



interface LineSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (line: Line) => void;
}

type SelectionStep = 'plants' | 'sectors' | 'lines';

const LineSelectionModal: React.FC<LineSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { user } = useAuth();
  const { deviceSettings, setDeviceSettings } = useDeviceSettingsStore();
  
  // Estados do modal
  const [currentStep, setCurrentStep] = useState<SelectionStep>('plants');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados da API
  const [plants, setPlants] = useState<Plant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  
  // Seleções do usuário
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

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

  const loadPlants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
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
      const token = localStorage.getItem('auth_token');
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
      const token = localStorage.getItem('auth_token');
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
    } catch (error) {
      console.error('❌ Erro ao carregar linhas:', error);
      setError('Erro ao carregar linhas. Tente novamente.');
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

  const handleNext = () => {
    if (currentStep === 'plants' && selectedPlants.length > 0) {
      setCurrentStep('sectors');
      setSelectedSectors([]); // Limpar seleção anterior
    } else if (currentStep === 'sectors' && selectedSectors.length > 0) {
      setCurrentStep('lines');
      setSelectedLine(null); // Limpar seleção anterior
    }
  };

  const handleBack = () => {
    if (currentStep === 'sectors') {
      setCurrentStep('plants');
      setSelectedSectors([]);
    } else if (currentStep === 'lines') {
      setCurrentStep('sectors');
      setSelectedLine(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLine) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Modal: Dados selecionados para buscar turnos:', {
        selectedPlants,
        selectedSectors,
        selectedLine,
        plantId: selectedPlants[0],
        sectorId: selectedSectors[0],
        lineId: selectedLine.id
      });

      // Buscar turnos usando a API fornecida
      console.log('🔄 Modal: Buscando turnos para:', {
        plantId: selectedPlants[0],
        sectorId: selectedSectors[0],
        lineId: selectedLine.id
      });

      // Atualizar configurações do dispositivo
      setDeviceSettings({
        ...deviceSettings,
        plantId: selectedPlants[0], // Usar primeira planta selecionada
        sectorId: selectedSectors[0], // Usar primeiro setor selecionado
        lineId: selectedLine.id,
        isConfigured: true
      });

      // Configuração concluída
      console.log('✅ Modal: Configuração salva com sucesso');

      // Confirmar seleção
      onConfirm(selectedLine);
      onClose();
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetar estado ao fechar
    setCurrentStep('plants');
    setSelectedPlants([]);
    setSelectedSectors([]);
    setSelectedLine(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const getStepTitle = () => {
    switch (currentStep) {
      case 'plants': return 'Selecionar Plantas';
      case 'sectors': return 'Selecionar Setores';
      case 'lines': return 'Selecionar Linha';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'plants': return selectedPlants.length > 0;
      case 'sectors': return selectedSectors.length > 0;
      case 'lines': return selectedLine !== null;
      default: return false;
    }
  };

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
        Selecione uma linha para finalizar:
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'plants': return renderPlantsStep();
      case 'sectors': return renderSectorsStep();
      case 'lines': return renderLinesStep();
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
            <button
              onClick={handleClose}
              className="text-muted hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 'plants' ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${
                currentStep === 'sectors' || currentStep === 'lines' ? 'bg-primary' : 'bg-gray-600'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 'sectors' ? 'bg-primary text-white' : 
                currentStep === 'lines' ? 'bg-gray-600 text-gray-300' : 'bg-gray-600 text-gray-300'
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${
                currentStep === 'lines' ? 'bg-primary' : 'bg-gray-600'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 'lines' ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <ErrorMessage message={error} />
          )}

          {/* Content */}
          {renderCurrentStep()}

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 'plants'}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Voltar
            </button>
            
            <div className="flex gap-2">
              {currentStep === 'lines' ? (
                <button
                  onClick={handleConfirm}
                  disabled={!selectedLine || loading}
                  className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  Confirmar
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
        </div>
      </Card>
    </div>
  );
};

export default LineSelectionModal; 