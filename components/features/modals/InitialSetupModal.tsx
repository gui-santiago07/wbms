import React, { useState, useEffect } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import Option7ApiService from '../../../services/option7ApiService';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

// Interfaces baseadas na API Option7
interface Plant {
  id: number;
  name: string;
  plant_name: string;
  plant_key: number;
}

interface Sector {
  id: number;
  name: string;
  sector_key: number;
  sector: string;
}

interface Line {
  id: number;
  client_line_key: number;
  company: string;
  plant: string;
  sector: string;
  line: string;
  name: string;
  internal_code: string;
  plant_key: number;
  sector_key: number;
  company_key: number;
  cost_center: string | null;
  description: string | null;
  equipment_model: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Product {
  id: number;
  nome: string;
  codigo: string;
  linha_id: number;
  setor_id: number;
  planta_id: number;
}

const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<'loading' | 'plant' | 'sector' | 'line' | 'product' | 'complete'>('loading');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setCurrentProductionLine, setCurrentShift } = useProductionStore();
  const { setDeviceSettings } = useDeviceSettingsStore();
  const apiService = new Option7ApiService();

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // ✅ CORRETO - Carregar plantas usando getFactories
      const plantsData = await apiService.getFactories();
      setPlants(plantsData);
      setStep('plant');
    } catch (error) {
      setError('Erro ao carregar dados iniciais');
      console.error('Erro no setup inicial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlantSelect = async (plant: Plant) => {
    setSelectedPlant(plant);
    setSelectedSector(null);
    setSelectedLine(null);
    setSelectedProduct(null);
    
    try {
      setIsLoading(true);
      // ✅ CORRETO - Carregar setores com filtro por planta
      const sectorsData = await apiService.getSectors([plant.id]);
      setSectors(sectorsData);
      setStep('sector');
    } catch (error) {
      setError('Erro ao carregar setores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorSelect = async (sector: Sector) => {
    setSelectedSector(sector);
    setSelectedLine(null);
    setSelectedProduct(null);
    
    try {
      setIsLoading(true);
      // ✅ CORRETO - Carregar linhas com filtros
      const linesData = await apiService.getLines(
        selectedPlant ? [selectedPlant.id] : [],
        [sector.id]
      );
      setLines(linesData);
      setStep('line');
    } catch (error) {
      setError('Erro ao carregar linhas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineSelect = async (line: Line) => {
    setSelectedLine(line);
    setSelectedProduct(null);
    
    try {
      setIsLoading(true);
      // ✅ CORRETO - Carregar produtos com filtros
      const productsData = await apiService.getProducts(
        selectedPlant ? [selectedPlant.id] : [],
        selectedSector ? [selectedSector.id] : [],
        [line.id]
      );
      setProducts(productsData);
      setStep('product');
    } catch (error) {
      setError('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    
    try {
      setIsLoading(true);
      
      // Salvar configurações no device settings
      await setDeviceSettings({
        plantId: selectedPlant!.plant_key.toString(),
        plantName: selectedPlant!.name,
        sectorId: selectedSector!.id.toString(),
        sectorName: selectedSector!.name,
        lineId: selectedLine!.client_line_key.toString(),
        lineName: selectedLine!.line,
        productId: product.id.toString(),
        productName: product.nome,
        isConfigured: true
      });

      // Configurar linha atual
      setCurrentProductionLine({
        client_line_key: selectedLine!.client_line_key.toString(),
        line: selectedLine!.line,
        description: selectedLine!.line,
        is_active: true
      });

      setStep('complete');
      
      // Aguardar um momento e completar
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      setError('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Configuração Inicial
          </h2>
          <p className="text-gray-300">
            Configure sua linha de produção para começar
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-white">Carregando...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {step === 'plant' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Selecione a Planta</h3>
            <div className="grid gap-3">
              {plants.map(plant => (
                <button
                  key={plant.id}
                  onClick={() => handlePlantSelect(plant)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <p className="font-bold text-white">{plant.name}</p>
                  <p className="text-sm text-gray-300">Código: {plant.plant_key}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'sector' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Selecione o Setor</h3>
            <div className="grid gap-3">
              {sectors.map(sector => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorSelect(sector)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <p className="font-bold text-white">{sector.name}</p>
                  <p className="text-sm text-gray-300">Código: {sector.sector_key}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'line' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Selecione a Linha</h3>
            <div className="grid gap-3">
              {lines.map(line => (
                <button
                  key={line.id}
                  onClick={() => handleLineSelect(line)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <p className="font-bold text-white">{line.line}</p>
                  <p className="text-sm text-gray-300">Código: {line.client_line_key}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'product' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Selecione o Produto</h3>
            <div className="grid gap-3">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <p className="font-bold text-white">{product.nome}</p>
                  <p className="text-sm text-gray-300">Código: {product.codigo}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Configuração Concluída!
            </h3>
            <p className="text-gray-300">
              Redirecionando para o dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialSetupModal; 