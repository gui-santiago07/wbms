import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { useTimelineStore } from '../../../store/useTimelineStore';
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

// Função para transformar dados em linha única (OTIMIZADA)
function transformarParaLinhaUnica(eventos: any[], yLabel: string, minTime: number, getColor: (item: any) => string, getLabel: (item: any) => string) {
  if (!eventos || eventos.length === 0) {
    return [];
  }

  try {
    const linhaUnica: any = {
      yLabel: yLabel,
    };

    // 1. Removido espaçador para eliminar espaço em branco no início
    // Os dados agora começam exatamente no início do gráfico
    // linhaUnica.spacer = 0; // Não é mais necessário

    // 2. Adiciona cada evento como uma propriedade única (LIMITADO A 50 EVENTOS)
    const eventosLimitados = eventos.slice(0, 50); // Limitar para evitar travamento
    
    eventosLimitados.forEach((evento, index) => {
      try {
        const startTime = new Date(evento.start).getTime();
        const endTime = new Date(evento.end).getTime();
        const duracao = Math.max(0, endTime - startTime); // Evitar durações negativas

        // Cria uma chave única para a duração e para a cor
        linhaUnica[`evento_${index}_duracao`] = duracao;
        linhaUnica[`evento_${index}_cor`] = getColor(evento);
        linhaUnica[`evento_${index}_label`] = getLabel(evento);
      } catch (error) {
        console.warn('Erro ao processar evento:', error);
      }
    });

    return [linhaUnica];
  } catch (error) {
    console.error('Erro na transformação de dados:', error);
    return [];
  }
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
  // Verificar se originalData é um array válido
  if (!active || !coordinate || !originalData || !Array.isArray(originalData) || originalData.length === 0) {
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
    try {
      if (!item || !item.start || !item.end) {
        return false;
      }
      const startTime = new Date(item.start).getTime();
      const endTime = new Date(item.end).getTime();
      return mouseTimestamp >= startTime && mouseTimestamp <= endTime;
    } catch (error) {
      console.warn('Erro ao processar item no tooltip:', error);
      return false;
    }
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

// Componente para o gráfico de Turnos (OTIMIZADO)
const ShiftsChart = memo<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}>(({ data, timeDomain, originalData }) => {
  // Memoizar chaves dos eventos para evitar recálculo
  const chavesEventos = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0] || {}).filter(key => key.includes('_duracao'));
  }, [data]);

  // Memoizar dados processados
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-800 rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Nenhum turno disponível</span>
      </div>
    );
  }

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
});

// Componente para o gráfico de Produtos (OTIMIZADO)
const ProductsChart = memo<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}>(({ data, timeDomain, originalData }) => {
  // Memoizar chaves dos eventos para evitar recálculo
  const chavesEventos = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0] || {}).filter(key => key.includes('_duracao'));
  }, [data]);

  // Memoizar dados processados
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-800 rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Nenhum produto disponível</span>
      </div>
    );
  }

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
});

// Componente para o gráfico de Eventos (OTIMIZADO)
const EventsChart = memo<{ 
  data: any[]; 
  timeDomain: [number, number]; 
  originalData: any[];
}>(({ data, timeDomain, originalData }) => {
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
});

// Componente principal da Timeline
const TimelineChart = memo<{ 
  processedData: ProcessedTimelineData;
  originalData: {
    shifts: any[];
    products: any[];
    events: any[];
  };
}>(({ processedData, originalData }) => {
  const { shiftsData, productsData, eventsData, timeDomain } = processedData;

  // Memoizar os componentes de gráfico para evitar re-renderização desnecessária
  const memoizedShiftsChart = useMemo(() => (
    <ShiftsChart data={shiftsData} timeDomain={timeDomain} originalData={originalData.shifts} />
  ), [shiftsData, timeDomain, originalData.shifts]);

  const memoizedProductsChart = useMemo(() => (
    <ProductsChart data={productsData} timeDomain={timeDomain} originalData={originalData.products} />
  ), [productsData, timeDomain, originalData.products]);

  const memoizedEventsChart = useMemo(() => (
    <EventsChart data={eventsData} timeDomain={timeDomain} originalData={originalData.events} />
  ), [eventsData, timeDomain, originalData.events]);

  return (
    <div className="space-y-2">
      {memoizedShiftsChart}
      {memoizedProductsChart}
      {memoizedEventsChart}
    </div>
  );
});

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
  
  // Store para gerenciar linhas selecionadas
  const { setSelectedLines, setHasGeneratedTimeline } = useTimelineStore();
  
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
    clearError,
    getCacheStats
  } = useTimelineData();

  // Estados para modais
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Estatísticas do cache
  const [cacheStats, setCacheStats] = useState({ cacheSize: 0, queueSize: 0, isProcessing: false });
  
  // Estado para estabilizar os charts e evitar piscamento
  const [stableTimelineData, setStableTimelineData] = useState<any>(null);
  const [isChartStable, setIsChartStable] = useState(false);

  // Atualizar estatísticas do cache periodicamente
  useEffect(() => {
    const updateCacheStats = () => {
      const stats = getCacheStats();
      setCacheStats(stats);
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 2000); // Atualizar a cada 2 segundos

    return () => clearInterval(interval);
  }, [getCacheStats]);

  // Estabilizar dados dos charts para evitar piscamento
  useEffect(() => {
    if (timelineData && timelineData.success && timelineData.data) {
      // Aguardar um pequeno delay para estabilizar
      const timer = setTimeout(() => {
        setStableTimelineData(timelineData);
        setIsChartStable(true);
      }, 100); // 100ms de delay para estabilizar

      return () => clearTimeout(timer);
    } else {
      setIsChartStable(false);
    }
  }, [timelineData]);

  // Carregar opções de filtro apenas uma vez na montagem
  useEffect(() => {
    loadPlants();
    
    // Limpeza ao desmontar o componente
    return () => {
      setSelectedLines([]);
      setHasGeneratedTimeline(false);
    };
  }, []);

  const handlePlantChange = (plantId: string) => {
    setFilterData(prev => ({ ...prev, plant: plantId, sector: '', lines: [] }));
    // Limpar linhas selecionadas e status da timeline
    setSelectedLines([]);
    setHasGeneratedTimeline(false);
    if (plantId) {
      loadSectors(plantId);
    }
  };

  const handleSectorChange = (sectorId: string) => {
    setFilterData(prev => ({ ...prev, sector: sectorId, lines: [] }));
    // Limpar linhas selecionadas e status da timeline
    setSelectedLines([]);
    setHasGeneratedTimeline(false);
    if (sectorId) {
      loadLines(sectorId);
    }
  };

  const handleLineChange = (lineIds: string[]) => {
    setFilterData(prev => ({ ...prev, lines: lineIds }));
    // Atualizar linhas selecionadas no store
    setSelectedLines(lineIds);
  };

  const handleGenerateTimeline = async () => {
    if (!filterData.plant || !filterData.sector || filterData.lines.length === 0) {
      clearError();
      return;
    }

    try {
      const timelineFilters: TimelineFilters = {
        start_period: filterData.startDate,
        end_period: filterData.endDate,
        filtros: {
          linhas: filterData.lines
        }
      };
      
      await generateTimeline(timelineFilters);
      // Marcar que a timeline foi gerada com sucesso
      setHasGeneratedTimeline(true);
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
          start_period: filterData.startDate,
          end_period: filterData.endDate,
          filtros: {
            linhas: filterData.lines
          }
        }
      };
      
      await shareTimeline(shareData);
      
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

  // Processar dados para os gráficos (OTIMIZADO COM MEMOIZAÇÃO AVANÇADA)
  const processedData = useMemo((): ProcessedTimelineData => {
    console.log('🔄 Processando dados da timeline...');
    
    // Timeout para evitar travamento
    const startTime = Date.now();
    const TIMEOUT_MS = 5000; // 5 segundos
    
    // Usar dados estáveis para evitar piscamento
    const dataToProcess = isChartStable ? stableTimelineData : timelineData;
    
    if (!dataToProcess || !dataToProcess.success || !dataToProcess.data) {
      console.log('⚠️ Nenhum dado de timeline disponível');
      return {
        shiftsData: [],
        productsData: [],
        eventsData: [],
        timeDomain: [0, 1]
      };
    }

    try {
      // Passo 1: Definir o domínio de tempo (SIMPLIFICADO)
      const allTimestamps: number[] = [];
      
      // Coletar timestamps apenas da primeira linha (para simplificar)
      const firstLineData = Object.values(dataToProcess.data)[0];
      if (firstLineData) {
        // Eventos
        firstLineData.events?.forEach(event => {
          allTimestamps.push(new Date(event.start_time).getTime());
          allTimestamps.push(new Date(event.end_time).getTime());
        });
        
        // Produtos
        firstLineData.products?.forEach(product => {
          allTimestamps.push(new Date(product.start_time).getTime());
          allTimestamps.push(new Date(product.end_time).getTime());
        });
        
        // Turnos
        firstLineData.shifts?.forEach(shift => {
          allTimestamps.push(new Date(shift.start_time).getTime());
          allTimestamps.push(new Date(shift.end_time).getTime());
        });
      }

      if (allTimestamps.length === 0) {
        console.log('⚠️ Nenhum timestamp encontrado');
        return {
          shiftsData: [],
          productsData: [],
          eventsData: [],
          timeDomain: [0, 1]
        };
      }

      // Domínio de tempo otimizado para eliminar espaço em branco
      const minTime = Math.min(...allTimestamps);
      const maxTime = Math.max(...allTimestamps);
      
      // Usar domínio exato sem margens para eliminar espaço em branco
      const timeDomain: [number, number] = [minTime, maxTime];

      console.log('📊 Domínio de tempo:', { minTime, maxTime, range: maxTime - minTime });

      // Passo 2: Consolidar dados (SIMPLIFICADO - apenas primeira linha)
      const allEvents: any[] = [];
      const allProducts: any[] = [];
      const allShifts: any[] = [];

      const firstLine = Object.entries(timelineData.data)[0];
      if (firstLine) {
        const [lineName, lineData] = firstLine;
        
        // Converter eventos para formato compatível (COM TIMEOUT)
        lineData.events?.forEach((event, index) => {
          // Verificar timeout a cada 10 eventos
          if (index % 10 === 0 && Date.now() - startTime > TIMEOUT_MS) {
            console.warn('⚠️ Timeout durante processamento de eventos');
            return;
          }
          
          allEvents.push({
            start: event.start_time,
            end: event.end_time,
            status: event.state_text === 'run_enum' ? 'Run' : 
                   event.state_text === 'down_enum' ? 'Down' : 
                   event.state_text === 'setup_enum' ? 'Setup' : 'Standby',
            description: event.events_name || 'Evento',
            duration: (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 1000
          });
        });

        // Converter produtos para formato compatível (COM TIMEOUT)
        lineData.products?.forEach((product, index) => {
          // Verificar timeout a cada 5 produtos
          if (index % 5 === 0 && Date.now() - startTime > TIMEOUT_MS) {
            console.warn('⚠️ Timeout durante processamento de produtos');
            return;
          }
          
          allProducts.push({
            start: product.start_time,
            end: product.end_time,
            productName: product.product_id,
            quantity: product.total_count,
            duration: (new Date(product.end_time).getTime() - new Date(product.start_time).getTime()) / 1000
          });
        });

        // Converter turnos para formato compatível (COM TIMEOUT)
        lineData.shifts?.forEach((shift, index) => {
          // Verificar timeout a cada 3 turnos
          if (index % 3 === 0 && Date.now() - startTime > TIMEOUT_MS) {
            console.warn('⚠️ Timeout durante processamento de turnos');
            return;
          }
          
          allShifts.push({
            start: shift.start_time,
            end: shift.end_time,
            shiftName: shift.shift_id,
            duration: (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 1000
          });
        });
      }

      console.log('📊 Dados consolidados:', {
        events: allEvents.length,
        products: allProducts.length,
        shifts: allShifts.length
      });

      // Passo 3: Processar dados de Turnos (SIMPLIFICADO)
      let shiftsData: any[] = [];
      try {
        shiftsData = transformarParaLinhaUnica(
          allShifts,
          'Turnos',
          minTime,
          (shift) => '#3b82f6', // Cor fixa para simplificar
          (shift) => shift.shiftName
        );
      } catch (error) {
        console.warn('⚠️ Erro ao processar turnos, usando fallback:', error);
        shiftsData = [];
      }

      // Passo 4: Processar dados de Produtos (SIMPLIFICADO)
      let productsData: any[] = [];
      try {
        productsData = transformarParaLinhaUnica(
          allProducts,
          'Produtos',
          minTime,
          (product) => '#22c55e', // Cor fixa para simplificar
          (product) => product.productName
        );
      } catch (error) {
        console.warn('⚠️ Erro ao processar produtos, usando fallback:', error);
        productsData = [];
      }

      // Passo 5: Processar dados de Eventos (SIMPLIFICADO)
      let eventsData: any[] = [];
      try {
        eventsData = transformarParaLinhaUnica(
          allEvents,
          'Eventos',
          minTime,
          (event) => getStatusColor(event.status),
          (event) => event.status
        );
      } catch (error) {
        console.warn('⚠️ Erro ao processar eventos, usando fallback:', error);
        eventsData = [];
      }

      const processingTime = Date.now() - startTime;
      console.log('✅ Processamento concluído em', processingTime, 'ms:', {
        shiftsData: shiftsData.length,
        productsData: productsData.length,
        eventsData: eventsData.length
      });

      // Verificar timeout
      if (processingTime > TIMEOUT_MS) {
        console.warn('⚠️ Processamento demorou muito tempo:', processingTime, 'ms');
      }

      return {
        shiftsData,
        productsData,
        eventsData,
        timeDomain
      };
    } catch (error) {
      console.error('❌ Erro ao processar dados da timeline:', error);
      return {
        shiftsData: [],
        productsData: [],
        eventsData: [],
        timeDomain: [0, 1]
      };
    }
  }, [timelineData, stableTimelineData, isChartStable]);

  // Processar dados originais para o tooltip (OTIMIZADO)
  const originalData = useMemo(() => {
    console.log('🔄 Processando dados originais para tooltip...');
    
    if (!timelineData || !timelineData.success || !timelineData.data) {
      console.log('⚠️ Nenhum dado de timeline disponível para originalData');
      return {
        shifts: [],
        products: [],
        events: []
      };
    }

    try {
      const allEvents: any[] = [];
      const allProducts: any[] = [];
      const allShifts: any[] = [];

      const firstLine = Object.entries(timelineData.data)[0];
      if (firstLine) {
        const [lineName, lineData] = firstLine;
        
        // Converter eventos para formato compatível
        lineData.events?.forEach(event => {
          allEvents.push({
            start: event.start_time,
            end: event.end_time,
            status: event.state_text === 'run_enum' ? 'Run' : 
                   event.state_text === 'down_enum' ? 'Down' : 
                   event.state_text === 'setup_enum' ? 'Setup' : 'Standby',
            description: event.events_name || 'Evento',
            duration: (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 1000
          });
        });

        // Converter produtos para formato compatível
        lineData.products?.forEach(product => {
          allProducts.push({
            start: product.start_time,
            end: product.end_time,
            productName: product.product_id,
            quantity: product.total_count,
            duration: (new Date(product.end_time).getTime() - new Date(product.start_time).getTime()) / 1000
          });
        });

        // Converter turnos para formato compatível
        lineData.shifts?.forEach(shift => {
          allShifts.push({
            start: shift.start_time,
            end: shift.end_time,
            shiftName: shift.shift_id,
            duration: (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 1000
          });
        });
      }

      console.log('✅ Dados originais processados:', {
        shifts: allShifts.length,
        products: allProducts.length,
        events: allEvents.length
      });

      return {
        shifts: allShifts,
        products: allProducts,
        events: allEvents
      };
    } catch (error) {
      console.error('❌ Erro ao processar dados originais:', error);
      return {
        shifts: [],
        products: [],
        events: []
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
                originalData={originalData}
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
                  {timelineData.data && Object.values(timelineData.data).map((lineData, lineIndex) => 
                    lineData.status && Object.entries(lineData.status).map(([status, stats]: [string, any]) => (
                      <tr key={`${lineIndex}-${status}`} className="border-b border-gray-800 hover:bg-gray-800">
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
                          {formatDuration(stats.duration)}
                        </td>
                        <td className="text-center py-3 px-4 text-white">
                          {formatDuration(stats.min)}
                        </td>
                        <td className="text-center py-3 px-4 text-white">
                          {formatDuration(stats.duration / stats.occurrences)}
                        </td>
                        <td className="text-center py-3 px-4 text-white">
                          {formatDuration(stats.max)}
                        </td>
                      </tr>
                    ))
                  )}
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

      {/* Debug Info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-white z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Cache Debug</span>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-gray-400 hover:text-white"
            >
              {showDebugInfo ? '−' : '+'}
            </button>
          </div>
          
          {showDebugInfo && (
            <div className="space-y-1">
              <div>Cache: {cacheStats.cacheSize} items</div>
              <div>Fila: {cacheStats.queueSize} requests</div>
              <div>Processando: {cacheStats.isProcessing ? 'Sim' : 'Não'}</div>
              <div>Timeline: {timelineData ? 'Carregada' : 'Vazia'}</div>
              <div>Linhas: {selectedLines.length}</div>
              <div>Gerada: {hasGeneratedTimeline ? 'Sim' : 'Não'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionTimeline; 