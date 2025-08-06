import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import AutoApontamentoService from '../../../services/autoApontamentoService';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (setupData: SetupData) => void;
  clientLineKey?: string;
}

interface SetupData {
  plant: string;
  sector: string;
  line: string;
  product: string;
  productKey: string;
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
  client_line_key: string;
  line_name: string;
  plant: string;
  sector: string;
}

interface Product {
  product_key: number;
  product: string;
}

const SetupModal: React.FC<SetupModalProps> = ({ 
  isOpen, 
  onClose, 
  onSetupComplete,
  clientLineKey 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos seletores
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  // Estados dos dados
  const [plants, setPlants] = useState<Plant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estado de busca de produtos
  const [productSearch, setProductSearch] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Carregar plantas disponíveis
  useEffect(() => {
    const loadPlants = async () => {
      try {
        // Buscar todas as linhas para extrair plantas únicas
        const allDevices = await AutoApontamentoService.getAllDevices();
        const uniquePlants = new Map<string, Plant>();
        
        allDevices.devices.forEach(device => {
          const plantName = device.line.plant;
          if (!uniquePlants.has(plantName)) {
            uniquePlants.set(plantName, {
              id: plantName,
              name: plantName
            });
          }
        });
        
        setPlants(Array.from(uniquePlants.values()));
      } catch (error) {
        console.error('❌ Erro ao carregar plantas:', error);
        setError('Erro ao carregar plantas');
      }
    };

    if (isOpen) {
      loadPlants();
    }
  }, [isOpen]);

  // Carregar setores quando planta for selecionada
  useEffect(() => {
    const loadSectors = async () => {
      if (!selectedPlant) {
        setSectors([]);
        return;
      }

      try {
        const allDevices = await AutoApontamentoService.getAllDevices();
        const uniqueSectors = new Map<string, Sector>();
        
        allDevices.devices
          .filter(device => device.line.plant === selectedPlant)
          .forEach(device => {
            const sectorName = device.line.sector;
            if (!uniqueSectors.has(sectorName)) {
              uniqueSectors.set(sectorName, {
                id: sectorName,
                name: sectorName
              });
            }
          });
        
        setSectors(Array.from(uniqueSectors.values()));
      } catch (error) {
        console.error('❌ Erro ao carregar setores:', error);
        setError('Erro ao carregar setores');
      }
    };

    loadSectors();
  }, [selectedPlant]);

  // Carregar linhas quando setor for selecionado
  useEffect(() => {
    const loadLines = async () => {
      if (!selectedPlant || !selectedSector) {
        setLines([]);
        return;
      }

      try {
        const allDevices = await AutoApontamentoService.getAllDevices();
        const filteredLines = allDevices.devices
          .filter(device => 
            device.line.plant === selectedPlant && 
            device.line.sector === selectedSector
          )
          .map(device => ({
            client_line_key: device.line.client_line_key,
            line_name: device.line.line_name,
            plant: device.line.plant,
            sector: device.line.sector
          }));
        
        setLines(filteredLines);
      } catch (error) {
        console.error('❌ Erro ao carregar linhas:', error);
        setError('Erro ao carregar linhas');
      }
    };

    loadLines();
  }, [selectedPlant, selectedSector]);

  // Carregar produtos quando linha for selecionada
  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedLine) {
        setProducts([]);
        return;
      }

      try {
        const productsResponse = await AutoApontamentoService.getLineProducts(selectedLine);
        setProducts(productsResponse.products);
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        setError('Erro ao carregar produtos');
      }
    };

    loadProducts();
  }, [selectedLine]);

  // Filtrar produtos baseado na busca
  useEffect(() => {
    if (!productSearch) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.product.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, productSearch]);

  // Inicializar seleções se clientLineKey for fornecido
  useEffect(() => {
    if (clientLineKey && isOpen) {
      const initializeFromClientLineKey = async () => {
        try {
          const allDevices = await AutoApontamentoService.getAllDevices();
          const device = allDevices.devices.find(d => d.line.client_line_key === clientLineKey);
          
          if (device) {
            setSelectedPlant(device.line.plant);
            setSelectedSector(device.line.sector);
            setSelectedLine(device.line.client_line_key);
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar seleções:', error);
        }
      };

      initializeFromClientLineKey();
    }
  }, [clientLineKey, isOpen]);

  const handleIniciarSetup = async () => {
    if (!selectedPlant || !selectedSector || !selectedLine || !selectedProduct) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar o product_key do produto selecionado
      const selectedProductData = products.find(p => p.product === selectedProduct);
      if (!selectedProductData) {
        throw new Error('Produto não encontrado');
      }

      // Iniciar produção
      await AutoApontamentoService.startProduction(
        selectedLine,
        selectedProductData.product_key.toString()
      );

      // Preparar dados do setup
      const setupData: SetupData = {
        plant: selectedPlant,
        sector: selectedSector,
        line: selectedLine,
        product: selectedProduct,
        productKey: selectedProductData.product_key.toString()
      };

      // Armazenar em cache no cliente
      localStorage.setItem('setup_data', JSON.stringify(setupData));

      onSetupComplete(setupData);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao iniciar setup:', error);
      setError('Erro ao iniciar setup. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Setup de Produção</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Formulário de Setup */}
          <div className="space-y-6">
            {/* Seletor de Planta */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Planta *
              </label>
              <select
                value={selectedPlant}
                onChange={(e) => {
                  setSelectedPlant(e.target.value);
                  setSelectedSector('');
                  setSelectedLine('');
                  setSelectedProduct('');
                }}
                disabled={isLoading}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">Selecione uma planta</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Setor *
              </label>
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setSelectedLine('');
                  setSelectedProduct('');
                }}
                disabled={isLoading || !selectedPlant}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">Selecione um setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Linha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Linha *
              </label>
              <select
                value={selectedLine}
                onChange={(e) => {
                  setSelectedLine(e.target.value);
                  setSelectedProduct('');
                }}
                disabled={isLoading || !selectedSector}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">Selecione uma linha</option>
                {lines.map((line) => (
                  <option key={line.client_line_key} value={line.client_line_key}>
                    {line.line_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Produto *
              </label>
              
              {/* Barra de pesquisa */}
              <div className="mb-3">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  disabled={isLoading || !selectedLine}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Lista de produtos */}
              <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.product_key}
                      onClick={() => setSelectedProduct(product.product)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedProduct === product.product
                          ? 'bg-primary bg-opacity-20 border-l-4 border-primary'
                          : 'hover:bg-gray-700 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="text-sm text-white font-medium">
                        {product.product}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {product.product_key}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-400 text-sm">
                    {productSearch ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                  </div>
                )}
              </div>
            </div>

            {/* Botão de ação */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleIniciarSetup}
                disabled={isLoading || !selectedPlant || !selectedSector || !selectedLine || !selectedProduct}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    </svg>
                    Iniciar Setup
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SetupModal; 