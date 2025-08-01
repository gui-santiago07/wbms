import { useState, useCallback, useMemo } from 'react';
import TimelineService, { 
  TimelineData, 
  TimelineFilters, 
  FilterOption, 
  ShareTimelineData 
} from '../services/timelineService';

interface UseTimelineDataReturn {
  // Estados
  timelineData: TimelineData | null;
  isLoading: boolean;
  error: string | null;
  plants: FilterOption[];
  sectors: FilterOption[];
  lines: FilterOption[];
  
  // Ações
  loadPlants: () => Promise<void>;
  loadSectors: (plantId: string) => Promise<void>;
  loadLines: (sectorId: string) => Promise<void>;
  generateTimeline: (filters: TimelineFilters) => Promise<void>;
  shareTimeline: (data: ShareTimelineData) => Promise<void>;
  clearError: () => void;
  clearTimelineData: () => void;
}

export const useTimelineData = (): UseTimelineDataReturn => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plants, setPlants] = useState<FilterOption[]>([]);
  const [sectors, setSectors] = useState<FilterOption[]>([]);
  const [lines, setLines] = useState<FilterOption[]>([]);
  
  // Criar uma única instância do serviço
  const timelineService = useMemo(() => new TimelineService(), []);

  const loadPlants = useCallback(async () => {
    try {
      setError(null);
      const plantsData = await timelineService.getPlants();
      setPlants(plantsData);
      
      // Se não há plantas, não é necessariamente um erro
      if (plantsData.length === 0) {
        console.warn('Nenhuma planta encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
      setError('Erro ao carregar plantas');
    }
  }, [timelineService]);

  const loadSectors = useCallback(async (plantId: string) => {
    try {
      setError(null);
      const sectorsData = await timelineService.getSectors(plantId);
      setSectors(sectorsData);
      
      // Se não há setores, não é necessariamente um erro
      if (sectorsData.length === 0) {
        console.warn('Nenhum setor encontrado para a planta:', plantId);
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setError('Erro ao carregar setores');
    }
  }, [timelineService]);

  const loadLines = useCallback(async (sectorId: string) => {
    try {
      setError(null);
      const linesData = await timelineService.getLines(sectorId);
      setLines(linesData);
      
      // Se não há linhas, não é necessariamente um erro
      if (linesData.length === 0) {
        console.warn('Nenhuma linha encontrada para o setor:', sectorId);
      }
    } catch (error) {
      console.error('Erro ao carregar linhas:', error);
      setError('Erro ao carregar linhas');
    }
  }, [timelineService]);

  const generateTimeline = useCallback(async (filters: TimelineFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await timelineService.getTimelineData(filters);
      setTimelineData(data);
    } catch (error) {
      console.error('Erro ao gerar timeline:', error);
      setError('Erro ao carregar dados da timeline');
    } finally {
      setIsLoading(false);
    }
  }, [timelineService]);

  const shareTimeline = useCallback(async (data: ShareTimelineData) => {
    try {
      setError(null);
      await timelineService.shareTimeline(data);
    } catch (error) {
      console.error('Erro ao compartilhar timeline:', error);
      setError('Erro ao compartilhar timeline');
      throw error;
    }
  }, [timelineService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearTimelineData = useCallback(() => {
    setTimelineData(null);
  }, []);

  return {
    // Estados
    timelineData,
    isLoading,
    error,
    plants,
    sectors,
    lines,
    
    // Ações
    loadPlants,
    loadSectors,
    loadLines,
    generateTimeline,
    shareTimeline,
    clearError,
    clearTimelineData
  };
}; 