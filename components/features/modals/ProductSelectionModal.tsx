import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import AutoApontamentoService from '../../../services/autoApontamentoService';
import TimelineService from '../../../services/timelineService';
import Option7ApiService from '../../../services/option7ApiService';

interface Product {
  product_key: number;
  product: string;
}

interface ProductsResponse {
  success: boolean;
  client_line_key: string;
  products: Product[];
}

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

type SelectionStep = 'plants' | 'sectors' | 'lines' | 'products';

const ProductSelectionModal: React.FC = () => {
  const { 
    setupData,
    setSelectedProduct,
    setShowProductSelectionModal,
    setShowSetupModal,
    selectedProduct,
    setSetupData,
    loadRealShifts
  } = useProductionStore();
  const { setDeviceSettings, deviceSettings } = useDeviceSettingsStore();
  
  // Estados do modal
  const [currentStep, setCurrentStep] = useState<SelectionStep>('plants');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados da API
  const [plants, setPlants] = useState<Plant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Seleções do usuário
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const timelineService = new TimelineService();
  const option7Api = new Option7ApiService();

  // Carregar plantas ao abrir o modal
  useEffect(() => {
    if (currentStep === 'plants') {
      loadPlants();
    }
  }, [currentStep]);

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

  // Carregar produtos quando linha é selecionada
  useEffect(() => {
    if (currentStep === 'products' && selectedLine) {
      loadProducts(selectedLine.id);
    }
  }, [currentStep, selectedLine]);

  const loadPlants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Preferir permissões do usuário via /api/user
      const user = await option7Api.getUser();
      const userPlants = (user.plantas || []).map(p => ({ id: String(p.plant_key), name: p.plant_name }));
      if (userPlants.length > 0) {
        setPlants(userPlants);
      } else {
        // fallback para serviço existente
        const plantsData = await timelineService.getPlants();
        setPlants(plantsData);
      }
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
      const user = await option7Api.getUser();
      const allowedSectorIds = new Set((user.setores || []).filter(s => String(s.plant_key) === selectedPlants[0]).map(s => String(s.sector_key)));
      const allowedSectors = (user.setores || [])
        .filter(s => String(s.plant_key) === selectedPlants[0])
        .map(s => ({ id: String(s.sector_key), name: s.sector }));

      if (allowedSectors.length > 0) {
        setSectors(allowedSectors);
      } else {
        // fallback: carregar por planta e filtrar se houver ids permitidos
        const sectorsData = await timelineService.getSectors(selectedPlants[0]);
        const filtered = sectorsData.filter(s => allowedSectorIds.size === 0 || allowedSectorIds.has(s.id));
        setSectors(filtered);
      }
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
      const user = await option7Api.getUser();
      const allowedLines = (user.linhas || [])
        .filter(l => String(l.sector_key) === selectedSectors[0])
        .map(l => ({ id: String(l.client_line_key), name: l.line }));

      if (allowedLines.length > 0) {
        setLines(allowedLines);
      } else {
        // fallback: carregar por setor
        const linesData = await timelineService.getLines(selectedSectors[0]);
        setLines(linesData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar linhas:', error);
      setError('Erro ao carregar linhas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (clientLineKey: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: ProductsResponse = await AutoApontamentoService.getLineProducts(clientLineKey);
      
      if (response.success) {
        setProducts(response.products);
      } else {
        setError('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos. Tente novamente.');
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

  const handleProductSelect = (product: Product) => {
    setSelectedProduct({
      id: product.product_key.toString(),
      name: product.product,
      product_key: product.product_key.toString(),
      product: product.product,
      internal_code: product.product_key.toString(),
      units_per_package: 1,
      isSelected: true
    });
  };

  const handleNext = () => {
    if (currentStep === 'plants' && selectedPlants.length > 0) {
      setCurrentStep('sectors');
      setSelectedSectors([]); // Limpar seleção anterior
    } else if (currentStep === 'sectors' && selectedSectors.length > 0) {
      setCurrentStep('lines');
      setSelectedLine(null); // Limpar seleção anterior
    } else if (currentStep === 'lines' && selectedLine) {
      setCurrentStep('products');
    }
  };

  const handleBack = () => {
    if (currentStep === 'sectors') {
      setCurrentStep('plants');
      setSelectedSectors([]);
    } else if (currentStep === 'lines') {
      setCurrentStep('sectors');
      setSelectedLine(null);
    } else if (currentStep === 'products') {
      setCurrentStep('lines');
    }
  };

  const handleConfirm = async () => {
    if (selectedProduct && selectedLine) {
      // Salvar produto no cache
      localStorage.setItem('selected_product', JSON.stringify(selectedProduct));

      // Atualizar setup data com a linha selecionada
      const selectedPlantName = plants.find(p => p.id === selectedPlants[0])?.name || '';
      const selectedSectorName = sectors.find(s => s.id === selectedSectors[0])?.name || '';
      setSetupData({
        ...setupData,
        line: selectedLine.id,
        plant: selectedPlantName,
        sector: selectedSectorName
      });

      // Persistir configurações do dispositivo (usadas para buscar turnos)
      setDeviceSettings({
        ...deviceSettings,
        plantId: selectedPlants[0] || '',
        plantName: selectedPlantName,
        sectorId: selectedSectors[0] || '',
        sectorName: selectedSectorName,
        lineId: selectedLine.id,
        lineName: selectedLine.name,
        isConfigured: true
      });

      // Carregar turnos com base nas seleções salvas
      try {
        await loadRealShifts();
      } catch (_) {
        // silencioso
      }

      // Fechar modal de seleção de produto
      setShowProductSelectionModal(false);

      // Abrir modal de setup
      setShowSetupModal(true);
    }
  };

  const handleCancel = () => {
    setShowProductSelectionModal(false);
  };

  // Filtrar produtos baseado na busca
  const filteredProducts = products.filter(product =>
    product.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'plants': return 'Selecionar Planta';
      case 'sectors': return 'Selecionar Setor';
      case 'lines': return 'Selecionar Linha';
      case 'products': return 'Selecionar Produto';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'plants': return selectedPlants.length > 0;
      case 'sectors': return selectedSectors.length > 0;
      case 'lines': return selectedLine !== null;
      case 'products': return selectedProduct !== null;
      default: return false;
    }
  };

  const renderPlantsStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione uma planta para continuar:
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
                type="radio"
                name="plant"
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
        Selecione um setor para continuar:
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
                type="radio"
                name="sector"
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

  const renderProductsStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione um produto para continuar:
      </p>
      
      {/* Barra de pesquisa */}
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full p-3 bg-surface border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted ml-2">Carregando produtos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <label key={product.product_key} className="flex items-center p-3 bg-surface rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="product"
                  checked={selectedProduct?.id === product.product_key.toString()}
                  onChange={() => handleProductSelect(product)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm text-white">{product.product}</div>
                  <div className="text-xs text-muted">Código: {product.product_key}</div>
                </div>
              </label>
            ))
          ) : (
            <div className="text-center py-8 text-muted">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'plants': return renderPlantsStep();
      case 'sectors': return renderSectorsStep();
      case 'lines': return renderLinesStep();
      case 'products': return renderProductsStep();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{getStepTitle()}</h2>
          <button
            onClick={handleCancel}
            className="text-muted hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              currentStep === 'plants' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${
              currentStep === 'sectors' || currentStep === 'lines' || currentStep === 'products' ? 'bg-blue-600' : 'bg-gray-600'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              currentStep === 'sectors' ? 'bg-blue-600 text-white' : 
              currentStep === 'lines' || currentStep === 'products' ? 'bg-gray-600 text-gray-300' : 'bg-gray-600 text-gray-300'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${
              currentStep === 'lines' || currentStep === 'products' ? 'bg-blue-600' : 'bg-gray-600'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              currentStep === 'lines' ? 'bg-blue-600 text-white' : 
              currentStep === 'products' ? 'bg-gray-600 text-gray-300' : 'bg-gray-600 text-gray-300'
            }`}>
              3
            </div>
            <div className={`w-12 h-1 ${
              currentStep === 'products' ? 'bg-blue-600' : 'bg-gray-600'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              currentStep === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              4
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
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
            {currentStep === 'products' ? (
              <button
                onClick={handleConfirm}
                disabled={!selectedProduct}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Seleção
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductSelectionModal; 