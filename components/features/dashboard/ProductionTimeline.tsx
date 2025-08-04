import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell
} from 'recharts';
import { useProductionStore } from '../../../store/useProductionStore';
import { useDeviceSettingsStore } from '../../../store/useDeviceSettingsStore';
import { useTimelineData } from '../../../hooks/useTimelineData';
import { TimelineFilters, ShareTimelineData } from '../../../services/timelineService';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorMessage from '../../ui/ErrorMessage';

// Tipos para filtros
interface FilterData {
  startDate: string;
  endDate: string;
  plant: string;
  sector: string;
  lines: string[];
}

// Tipos para dados processados dos gráficos
interface ProcessedTimelineData {
  shiftsData: any[];
  productsData: any[];
  eventsData: any[];
  timeDomain: [number, number];
}

// Função para transformar dados em linha única
function transformarParaLinhaUnica(eventos: any[], yLabel: string, minTime: number, getColor: (item: any) => string, getLabel: (item: any) => string) {
  if (!eventos || eventos.length === 0) {
    return [];
  }

  const linhaUnica: any = {
    yLabel: yLabel,
  };

  // 1. Calcula o espaçador inicial
  const primeiroEventoStartTime = new Date(eventos[0].start).getTime();
  const graficoMinTime = minTime;
  linhaUnica.spacer = primeiroEventoStartTime - graficoMinTime;

  // 2. Adiciona cada evento como uma propriedade única
  eventos.forEach((evento, index) => {
    const startTime = new Date(evento.start).getTime();
    const endTime = new Date(evento.end).getTime();
    const duracao = endTime - startTime;

    // Cria uma chave única para a duração e para a cor
    linhaUnica[`evento_${index}_duracao`] = duracao;
    linhaUnica[`evento_${index}_cor`] = getColor(evento);
    linhaUnica[`evento_${index}_label`] = getLabel(evento);
  });

  return [linhaUnica];
}

// Componente CustomTooltip que usa posição do mouse e lista original de dados
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  coordinate?: { x: number; y: number };
  originalData: any[];
  timeDomain: [number, number];
  chartWidth: number;
  type: 'shifts' | 'products' | 'events';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  coordinate, 
  originalData, 
  timeDomain, 
  chartWidth, 
  type 
}) => {
  if (!active || !coordinate || !originalData || originalData.length === 0) {
    return null;
  }

  // Converter posição X do mouse em timestamp
  const mouseX = coordinate.x;
  const [minTime, maxTime] = timeDomain;
  const timeRange = maxTime - minTime;
  const pixelsPerMs = chartWidth / timeRange;
  const mouseTimestamp = minTime + (mouseX / pixelsPerMs);

  // Encontrar o item que estava acontecendo naquele momento
  const currentItem = originalData.find(item => {
    const startTime = new Date(item.start).getTime();
    const endTime = new Date(item.end).getTime();
    return mouseTimestamp >= startTime && mouseTimestamp <= endTime;
  });

  if (!currentItem) {
    return null;
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const startTime = new Date(currentItem.start).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = new Date(currentItem.end).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const duration = new Date(currentItem.end).getTime() - new Date(currentItem.start).getTime();

  let title = '';
  let subtitle = '';

  switch (type) {
    case 'shifts':
      title = currentItem.shiftName;
      subtitle = 'Turno';
      break;
    case 'products':
      title = currentItem.productName;
      subtitle = 'Produto';
      break;
    case 'events':
      title = currentItem.status;
      subtitle = 'Evento';
      break;
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm shadow-lg">
      <p className="font-semibold text-blue-400">{subtitle}</p>
      <p className="font-bold text-lg">{title}</p>
      <div className="mt-2 space-y-1">
        <p><span className="text-gray-400">Início:</span> {startTime}</p>
        <p><span className="text-gray-400">Fim:</span> {endTime}</p>
        <p><span className="text-gray-400">Duração:</span> {formatDuration(duration)}</p>
        {currentItem.description && (
          <p><span className="text-gray-400">Descrição:</span> {currentItem.description}</p>
        )}
        {type === 'products' && currentItem.quantity && (
          <p><span className="text-gray-400">Quantidade:</span> {currentItem.quantity}</p>
        )}
      </div>
    </div>
  );
};

// Componente para o gráfico de Turnos
const ShiftsChart: React.FC<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}> = ({ data, timeDomain, originalData }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-800 rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Nenhum turno disponível</span>
      </div>
    );
  }

  // Pega as chaves dos eventos para renderizar as barras dinamicamente
  const chavesEventos = Object.keys(data[0] || {}).filter(key => key.includes('_duracao'));

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-white mb-2">Turnos</div>
      <div style={{ width: '100%', height: 80 }}>
        <ResponsiveContainer>
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            stackOffset="expand"
          >
            <XAxis 
              type="number" 
              domain={timeDomain} 
              hide={true}
              scale="time"
            />
            <YAxis type="category" dataKey="yLabel" width={80} />
            <Tooltip 
              content={({ active, coordinate }) => (
                <CustomTooltip 
                  active={active}
                  coordinate={coordinate}
                  originalData={originalData}
                  timeDomain={timeDomain}
                  chartWidth={800} // Valor aproximado, será ajustado pelo ResponsiveContainer
                  type="shifts"
                />
              )} 
            />
            
            {/* Barra de Espaçamento Inicial (Transparente) */}
            <Bar dataKey="spacer" stackId="timeline" fill="transparent" />
            
            {/* Mapeia as chaves para criar as barras coloridas */}
            {chavesEventos.map((chave, index) => {
              const cor = data[0][`evento_${index}_cor`];
              const label = data[0][`evento_${index}_label`];
              
              return (
                <Bar key={chave} dataKey={chave} stackId="timeline" fill={cor}>
                  <LabelList dataKey={() => label} position="center" fill="#fff" fontSize={11} fontWeight="bold" />
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente para o gráfico de Produtos
const ProductsChart: React.FC<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}> = ({ data, timeDomain, originalData }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-800 rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Nenhum produto disponível</span>
      </div>
    );
  }

  // Pega as chaves dos eventos para renderizar as barras dinamicamente
  const chavesEventos = Object.keys(data[0] || {}).filter(key => key.includes('_duracao'));

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-white mb-2">Produtos</div>
      <div style={{ width: '100%', height: 80 }}>
        <ResponsiveContainer>
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            stackOffset="expand"
          >
            <XAxis 
              type="number" 
              domain={timeDomain} 
              hide={true}
              scale="time"
            />
            <YAxis type="category" dataKey="yLabel" width={80} />
            <Tooltip 
              content={({ active, coordinate }) => (
                <CustomTooltip 
                  active={active}
                  coordinate={coordinate}
                  originalData={originalData}
                  timeDomain={timeDomain}
                  chartWidth={800} // Valor aproximado, será ajustado pelo ResponsiveContainer
                  type="products"
                />
              )} 
            />
            
            {/* Barra de Espaçamento Inicial (Transparente) */}
            <Bar dataKey="spacer" stackId="timeline" fill="transparent" />
            
            {/* Mapeia as chaves para criar as barras coloridas */}
            {chavesEventos.map((chave, index) => {
              const cor = data[0][`evento_${index}_cor`];
              const label = data[0][`evento_${index}_label`];
              
              return (
                <Bar key={chave} dataKey={chave} stackId="timeline" fill={cor}>
                  <LabelList dataKey={() => label} position="center" fill="#fff" fontSize={11} fontWeight="bold" />
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente para o gráfico de Eventos
const EventsChart: React.FC<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}> = ({ data, timeDomain, originalData }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-800 rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Nenhum evento disponível</span>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pega as chaves dos eventos para renderizar as barras dinamicamente
  const chavesEventos = Object.keys(data[0] || {}).filter(key => key.includes('_duracao'));

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-white mb-2">Eventos</div>
      <div style={{ width: '100%', height: 80 }}>
        <ResponsiveContainer>
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            stackOffset="expand"
          >
            <XAxis 
              type="number" 
              domain={timeDomain} 
              scale="time"
              tickFormatter={formatTime}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              interval="preserveStartEnd"
            />
            <YAxis type="category" dataKey="yLabel" width={80} />
            <Tooltip 
              content={({ active, coordinate }) => (
                <CustomTooltip 
                  active={active}
                  coordinate={coordinate}
                  originalData={originalData}
                  timeDomain={timeDomain}
                  chartWidth={800} // Valor aproximado, será ajustado pelo ResponsiveContainer
                  type="events"
                />
              )} 
            />
            
            {/* Barra de Espaçamento Inicial (Transparente) */}
            <Bar dataKey="spacer" stackId="timeline" fill="transparent" />
            
            {/* Mapeia as chaves para criar as barras coloridas */}
            {chavesEventos.map((chave, index) => {
              const cor = data[0][`evento_${index}_cor`];
              
              return (
                <Bar key={chave} dataKey={chave} stackId="timeline" fill={cor} />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente principal da Timeline
const TimelineChart: React.FC<{ 
  processedData: ProcessedTimelineData;
  originalData: {
    shifts: any[];
    products: any[];
    events: any[];
  };
}> = ({ processedData, originalData }) => {
  const { shiftsData, productsData, eventsData, timeDomain } = processedData;

  return (
    <div className="space-y-2">
      <ShiftsChart data={shiftsData} timeDomain={timeDomain} originalData={originalData.shifts} />
      <ProductsChart data={productsData} timeDomain={timeDomain} originalData={originalData.products} />
      <EventsChart data={eventsData} timeDomain={timeDomain} originalData={originalData.events} />
    </div>
  );
};

const ProductionTimeline: React.FC = () => {
  const { deviceSettings } = useDeviceSettingsStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState<FilterData>({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    plant: '',
    sector: '',
    lines: []
  });
  
  // Hook para gerenciar dados da timeline
  const { 
    timelineData,
    isLoading,
    error,
    plants,
    sectors,
    lines,
    loadPlants,
    loadSectors,
    loadLines,
    generateTimeline,
    shareTimeline,
    clearError
  } = useTimelineData();

  // Estados para modais
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  // Carregar opções de filtro apenas uma vez na montagem
  useEffect(() => {
    loadPlants();
  }, []);

  const handlePlantChange = (plantId: string) => {
    setFilterData(prev => ({ ...prev, plant: plantId, sector: '', lines: [] }));
    if (plantId) {
      loadSectors(plantId);
    }
  };

  const handleSectorChange = (sectorId: string) => {
    setFilterData(prev => ({ ...prev, sector: sectorId, lines: [] }));
    if (sectorId) {
      loadLines(sectorId);
    }
  };

  const handleLineChange = (lineIds: string[]) => {
    setFilterData(prev => ({ ...prev, lines: lineIds }));
  };

  const handleGenerateTimeline = async () => {
    if (!filterData.plant || !filterData.sector || filterData.lines.length === 0) {
      clearError();
      return;
    }

    try {
      const timelineFilters: TimelineFilters = {
        startDate: filterData.startDate,
        endDate: filterData.endDate,
        plant: filterData.plant,
        sector: filterData.sector,
        lines: filterData.lines
      };
      
      await generateTimeline(timelineFilters);
      setShowFilters(false);
    } catch (error) {
      console.error('Erro ao gerar timeline:', error);
    }
  };

  const handleShareTimeline = async () => {
    if (!shareEmail || !timelineData) return;

    setShareLoading(true);
    try {
      const shareData: ShareTimelineData = {
        email: shareEmail,
        chartImage: '',
        filters: {
          startDate: filterData.startDate,
          endDate: filterData.endDate,
          plant: filterData.plant,
          sector: filterData.sector,
          lines: filterData.lines
        }
      };
      
      await shareTimeline(shareData);
      
      console.log('Timeline compartilhada com sucesso');
      setShowShareModal(false);
      setShareEmail('');
    } catch (error) {
      console.error('Erro ao compartilhar timeline:', error);
    } finally {
      setShareLoading(false);
    }
  };

  // Função para obter cor baseada no OEE
  const getOeeColor = (oee: number): string => {
    if (oee >= 90) return '#22c55e'; // Verde - Excelente
    if (oee >= 70) return '#f59e0b'; // Laranja - Bom
    if (oee >= 50) return '#f97316'; // Laranja escuro - Regular
    return '#ef4444'; // Vermelho - Ruim
  };

  // Função para obter cor baseada no status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Run': return '#22c55e';
      case 'Standby': return '#f59e0b';
      case 'Down': return '#ef4444';
      case 'Setup': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Processar dados para os gráficos
  const processedData = useMemo((): ProcessedTimelineData => {
    if (!timelineData) {
      return {
        shiftsData: [],
        productsData: [],
        eventsData: [],
        timeDomain: [0, 1]
      };
    }

    try {
      // Passo 1: Definir o domínio de tempo
      const allTimestamps: number[] = [];
      
      // Coletar timestamps de todos os eventos
      timelineData.events?.forEach(event => {
        allTimestamps.push(new Date(event.start).getTime());
        allTimestamps.push(new Date(event.end).getTime());
      });
      
      timelineData.products?.forEach(product => {
        allTimestamps.push(new Date(product.start).getTime());
        allTimestamps.push(new Date(product.end).getTime());
      });
      
      timelineData.shifts?.forEach(shift => {
        allTimestamps.push(new Date(shift.start).getTime());
        allTimestamps.push(new Date(shift.end).getTime());
      });

      const minTime = Math.min(...allTimestamps);
      const maxTime = Math.max(...allTimestamps);
      const timeDomain: [number, number] = [minTime, maxTime];



      // Passo 2: Processar dados de Turnos usando linha única
      const shiftsData = transformarParaLinhaUnica(
        timelineData.shifts || [],
        'Turnos',
        minTime,
        (shift) => {
          // Calcular OEE baseado nos eventos do turno
          const startTime = new Date(shift.start).getTime();
          const endTime = new Date(shift.end).getTime();
          const duration = endTime - startTime;
          
          const shiftEvents = timelineData.events?.filter(event => {
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();
            return eventStart >= startTime && eventEnd <= endTime;
          }) || [];
          
          const runTime = shiftEvents
            .filter(event => event.status === 'Run')
            .reduce((total, event) => total + (event.duration * 1000), 0);
          
          const oee = duration > 0 ? (runTime / duration) * 100 : 0;
          return getOeeColor(oee);
        },
        (shift) => {
          // Calcular OEE para o label
          const startTime = new Date(shift.start).getTime();
          const endTime = new Date(shift.end).getTime();
          const duration = endTime - startTime;
          
          const shiftEvents = timelineData.events?.filter(event => {
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();
            return eventStart >= startTime && eventEnd <= endTime;
          }) || [];
          
          const runTime = shiftEvents
            .filter(event => event.status === 'Run')
            .reduce((total, event) => total + (event.duration * 1000), 0);
          
          const oee = duration > 0 ? (runTime / duration) * 100 : 0;
          return `${shift.shiftName} - ${oee.toFixed(2)}%`;
        }
      );

      // Passo 3: Processar dados de Produtos usando linha única
      const productsData = transformarParaLinhaUnica(
        timelineData.products || [],
        'Produtos',
        minTime,
        (product) => {
          // Calcular OEE baseado nos eventos do produto
          const startTime = new Date(product.start).getTime();
          const endTime = new Date(product.end).getTime();
          const duration = endTime - startTime;
          
          const productEvents = timelineData.events?.filter(event => {
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();
            return eventStart >= startTime && eventEnd <= endTime;
          }) || [];
          
          const runTime = productEvents
            .filter(event => event.status === 'Run')
            .reduce((total, event) => total + (event.duration * 1000), 0);
          
          const oee = duration > 0 ? (runTime / duration) * 100 : 0;
          return getOeeColor(oee);
        },
        (product) => {
          // Calcular OEE para o label
          const startTime = new Date(product.start).getTime();
          const endTime = new Date(product.end).getTime();
          const duration = endTime - startTime;
          
          const productEvents = timelineData.events?.filter(event => {
            const eventStart = new Date(event.start).getTime();
            const eventEnd = new Date(event.end).getTime();
            return eventStart >= startTime && eventEnd <= endTime;
          }) || [];
          
          const runTime = productEvents
            .filter(event => event.status === 'Run')
            .reduce((total, event) => total + (event.duration * 1000), 0);
          
          const oee = duration > 0 ? (runTime / duration) * 100 : 0;
          return `${product.productName} - ${oee.toFixed(2)}%`;
        }
      );

      // Passo 4: Processar dados de Eventos usando linha única
      const eventsData = transformarParaLinhaUnica(
        timelineData.events || [],
        'Eventos',
        minTime,
        (event) => getStatusColor(event.status),
        (event) => event.status
      );



      return {
        shiftsData,
        productsData,
        eventsData,
        timeDomain
      };
    } catch (error) {
      console.error('Erro ao processar dados da timeline:', error);
      return {
        shiftsData: [],
        productsData: [],
        eventsData: [],
        timeDomain: [0, 1]
      };
    }
  }, [timelineData]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Componente do Modal de Filtros (memoizado para evitar re-renders)
  const FiltersModal = memo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Filtros da Timeline</h2>
          <button
            onClick={() => setShowFilters(false)}
            className="text-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Período
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Data Início</label>
                <input
                  type="date"
                  value={filterData.startDate}
                  onChange={(e) => setFilterData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Data Fim</label>
                <input
                  type="date"
                  value={filterData.endDate}
                  onChange={(e) => setFilterData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          </div>

          {/* Planta */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Planta
            </label>
            <select
              value={filterData.plant}
              onChange={(e) => handlePlantChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Selecione uma planta</option>
              {plants.map(plant => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Setor
            </label>
            <select
              value={filterData.sector}
              onChange={(e) => handleSectorChange(e.target.value)}
              disabled={!filterData.plant}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
            >
              <option value="">Selecione um setor</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          {/* Linhas */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Linhas
            </label>
            <select
              multiple
              value={filterData.lines}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                handleLineChange(selectedOptions);
              }}
              disabled={!filterData.sector}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50 min-h-[100px]"
            >
              {lines.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              Pressione Ctrl (ou Cmd) para selecionar múltiplas linhas
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateTimeline}
              disabled={isLoading || !filterData.plant || !filterData.sector || filterData.lines.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Gerando...' : 'Gerar Timeline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ));

  // Componente do Modal de Compartilhamento (memoizado para evitar re-renders)
  const ShareModal = memo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-surface rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Compartilhar Timeline</h2>
          <button
            onClick={() => setShowShareModal(false)}
            className="text-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              E-mail do Destinatário
            </label>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => setShowShareModal(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleShareTimeline}
              disabled={shareLoading || !shareEmail}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {shareLoading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Timeline de Produção</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Filtros
          </button>
          {timelineData && (
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Compartilhar
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-white">Carregando timeline...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onDismiss={clearError} />
      )}

      {/* Conteúdo da Timeline */}
      {!isLoading && !error && timelineData && (
        <div className="space-y-6">
          {/* Gráfico */}
          <Card className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">Timeline de Produção</h4>
              <p className="text-sm text-muted">
                Visualização temporal de turnos, produtos e eventos
              </p>
            </div>
            
            <div className="w-full">
              <TimelineChart 
                processedData={processedData} 
                originalData={{
                  shifts: timelineData?.shifts || [],
                  products: timelineData?.products || [],
                  events: timelineData?.events || []
                }}
              />
            </div>
          </Card>

          {/* Tabela de Estatísticas */}
          <Card className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white">Estatísticas de Eventos</h4>
              <p className="text-sm text-muted">
                Resumo detalhado dos eventos de produção
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white">Status</th>
                    <th className="text-center py-3 px-4 text-white">Ocorrências</th>
                    <th className="text-center py-3 px-4 text-white">Tempo Total</th>
                    <th className="text-center py-3 px-4 text-white">Tempo Mín</th>
                    <th className="text-center py-3 px-4 text-white">Tempo Méd</th>
                    <th className="text-center py-3 px-4 text-white">Tempo Máx</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineData.status && Object.entries(timelineData.status).map(([status, stats]: [string, any]) => (
                    <tr key={status} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <span className="text-white">{status}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {stats.occurrences}
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {formatDuration(stats.totalTime)}
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {formatDuration(stats.minTime)}
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {formatDuration(stats.avgTime)}
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {formatDuration(stats.maxTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && !error && !timelineData && !showFilters && (
        <div className="text-center py-12">
          <div className="text-muted text-lg mb-2">Nenhum dado encontrado</div>
          <p className="text-sm text-muted mb-4">
            Selecione os filtros e gere uma timeline para visualizar os dados
          </p>
          <button
            onClick={() => setShowFilters(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Configurar Filtros
          </button>
        </div>
      )}

      {/* Modais */}
      {showFilters && <FiltersModal />}
      {showShareModal && <ShareModal />}
    </div>
  );
};

export default ProductionTimeline; 