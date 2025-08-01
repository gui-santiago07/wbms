import React, { useState, useEffect, useRef, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line
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

// Componente wrapper para o chart que resolve problemas de ciclo de vida
const TimelineChart: React.FC<{
  data: any[];
  height: number;
}> = ({ data, height }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-800 rounded">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-800 rounded">
        <div className="text-center">
          <div className="text-gray-400 mb-2">Nenhum dado disponível</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
          axisLine={{ stroke: '#374151' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        <Legend />
        <Bar dataKey="events" fill="#22c55e" name="Eventos" />
        <Bar dataKey="products" fill="#8b5cf6" name="Produtos" />
        <Bar dataKey="shifts" fill="#3b82f6" name="Turnos" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const ProductionTimeline: React.FC = () => {
  const { deviceSettings } = useDeviceSettingsStore();
  const [showFilters, setShowFilters] = useState(true);
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
  }, []); // Remover dependência de loadPlants

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
      // Converter FilterData para TimelineFilters
      const timelineFilters: TimelineFilters = {
        startDate: filterData.startDate,
        endDate: filterData.endDate,
        plant: filterData.plant,
        sector: filterData.sector,
        lines: filterData.lines
      };
      
      // Buscar dados da timeline usando API real
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
      // Preparar dados para compartilhamento
      const shareData: ShareTimelineData = {
        email: shareEmail,
        chartImage: '', // Será gerada pelo backend
        filters: {
          startDate: filterData.startDate,
          endDate: filterData.endDate,
          plant: filterData.plant,
          sector: filterData.sector,
          lines: filterData.lines
        }
      };
      
      // Enviar via API real
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

  // Preparar dados para o Recharts
  const getChartData = () => {
    if (!timelineData) return [];
    
    try {
      const chartData: any[] = [];
      
      // Processar eventos
      if (timelineData.events && timelineData.events.length > 0) {
        timelineData.events.forEach((event: any) => {
          const timeSlot = new Date(event.start).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const existingSlot = chartData.find(item => item.time === timeSlot);
          if (existingSlot) {
            existingSlot.events = (existingSlot.events || 0) + 1;
          } else {
            chartData.push({
              time: timeSlot,
              events: 1,
              products: 0,
              shifts: 0
            });
          }
        });
      }
      
      // Processar produtos
      if (timelineData.products && timelineData.products.length > 0) {
        timelineData.products.forEach((product: any) => {
          const timeSlot = new Date(product.start).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const existingSlot = chartData.find(item => item.time === timeSlot);
          if (existingSlot) {
            existingSlot.products = (existingSlot.products || 0) + 1;
          } else {
            chartData.push({
              time: timeSlot,
              events: 0,
              products: 1,
              shifts: 0
            });
          }
        });
      }

      // Processar turnos
      if (timelineData.shifts && timelineData.shifts.length > 0) {
        timelineData.shifts.forEach((shift: any) => {
          const timeSlot = new Date(shift.start).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const existingSlot = chartData.find(item => item.time === timeSlot);
          if (existingSlot) {
            existingSlot.shifts = (existingSlot.shifts || 0) + 1;
          } else {
            chartData.push({
              time: timeSlot,
              events: 0,
              products: 0,
              shifts: 1
            });
          }
        });
      }
      
      // Ordenar por tempo
      return chartData.sort((a, b) => {
        const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
        const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
        return timeA - timeB;
      });
    } catch (error) {
      console.error('Erro ao processar dados do chart:', error);
      return [];
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Run': return '#22c55e';
      case 'Standby': return '#f59e0b';
      case 'Down': return '#ef4444';
      case 'Setup': return '#3b82f6';
      default: return '#6b7280';
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Visualização temporal de eventos, produtos e turnos
              </p>
            </div>
            
            <div className="w-full">
              <TimelineChart
                data={getChartData()}
                height={400}
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