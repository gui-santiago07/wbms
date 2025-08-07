import { useState, useEffect, useCallback, useRef } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import TimelineService, { TimelineFilters, FilterOption } from '../services/timelineService';

// Interface para cache de dados
interface CachedData {
  data: any;
  timestamp: number;
  filters: TimelineFilters;
}

// Interface para fila de requisições
interface RequestQueue {
  id: string;
  filters: TimelineFilters;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

// Sistema de cache global (fora do hook para persistir entre re-renders)
const dataCache = new Map<string, CachedData>();
const requestQueue: RequestQueue[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const DEBOUNCE_DELAY = 1000; // 1 segundo de debounce
const CACHE_DURATION = 30000; // 30 segundos de cache

// Função para gerar chave única do cache
const generateCacheKey = (filters: TimelineFilters): string => {
  return `${filters.start_period}_${filters.end_period}_${filters.filtros.linhas.sort().join(',')}`;
};

// Função para comparar dados (deep comparison otimizada)
const areDataEqual = (data1: any, data2: any): boolean => {
  if (data1 === data2) return true;
  if (!data1 || !data2) return false;
  
  try {
    // Comparação rápida por string (para dados JSON)
    const str1 = JSON.stringify(data1);
    const str2 = JSON.stringify(data2);
    return str1 === str2;
  } catch (error) {
    console.warn('Erro na comparação de dados:', error);
    return false;
  }
};

// Função para processar fila de requisições
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    const timelineService = new TimelineService();
    
    while (requestQueue.length > 0) {
      const request = requestQueue.shift();
      if (!request) continue;
      
      try {
        console.log('🔄 Processando requisição da fila:', request.id);
        
        // Verificar cache primeiro
        const cacheKey = generateCacheKey(request.filters);
        const cached = dataCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          console.log('✅ Dados encontrados no cache');
          request.resolve(cached.data);
          continue;
        }
        
        // Fazer requisição real
        const data = await timelineService.getTimelineData(request.filters);
        
        // Verificar se os dados são diferentes dos anteriores
        if (cached && areDataEqual(cached.data, data)) {
          console.log('✅ Dados idênticos aos anteriores, usando cache');
          request.resolve(cached.data);
        } else {
          console.log('✅ Novos dados, atualizando cache');
          dataCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            filters: request.filters
          });
          request.resolve(data);
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar requisição:', error);
        request.reject(error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
};

// Função para adicionar requisição à fila
const addToQueue = (filters: TimelineFilters): Promise<any> => {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}_${Math.random()}`;
    
    requestQueue.push({
      id: requestId,
      filters,
      resolve,
      reject
    });
    
    console.log('📋 Adicionado à fila:', requestId, 'Fila atual:', requestQueue.length);
    
    // Processar fila após um pequeno delay para agrupar requisições similares
    setTimeout(() => {
      processQueue();
    }, 100);
  });
};

export const useTimelineData = () => {
  const { fetchTimelineData } = useProductionStore();
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plants, setPlants] = useState<FilterOption[]>([]);
  const [sectors, setSectors] = useState<FilterOption[]>([]);
  const [lines, setLines] = useState<FilterOption[]>([]);
  
  // Refs para controle de debounce e estado anterior
  const lastFiltersRef = useRef<TimelineFilters | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any>(null);

  // Função otimizada para gerar timeline
  const generateTimeline = useCallback(async (filters: TimelineFilters) => {
    try {
      // Debounce para evitar requisições muito frequentes
      const now = Date.now();
      if (now - lastRequestTime < DEBOUNCE_DELAY) {
        console.log('⏳ Debounce: aguardando antes da próxima requisição');
        return;
      }
      
      // Verificar se os filtros são iguais aos últimos
      if (lastFiltersRef.current && areDataEqual(lastFiltersRef.current, filters)) {
        console.log('🔄 Filtros idênticos aos anteriores, pulando requisição');
        return;
      }
      
      lastRequestTime = now;
      lastFiltersRef.current = filters;
      
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Iniciando requisição otimizada para timeline');
      
      // Usar sistema de fila
      const data = await addToQueue(filters);
      
      // Verificar se os dados são diferentes dos anteriores
      if (lastDataRef.current && areDataEqual(lastDataRef.current, data)) {
        console.log('✅ Dados idênticos aos anteriores, mantendo estado atual');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Atualizando estado com novos dados');
      setTimelineData(data);
      lastDataRef.current = data;
      
    } catch (error) {
      console.error('❌ Erro ao gerar timeline:', error);
      setError('Erro ao carregar dados da timeline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função otimizada para buscar dados da timeline
  const fetchTimelineDataOptimized = useCallback(async () => {
    if (!lastFiltersRef.current) {
      console.log('⚠️ Nenhum filtro anterior encontrado');
      return;
    }
    
    await generateTimeline(lastFiltersRef.current);
  }, [generateTimeline]);

  // Funções para carregar opções de filtro (com cache)
  const loadPlants = useCallback(async () => {
    try {
      const timelineService = new TimelineService();
      const plantsData = await timelineService.getPlants();
      setPlants(plantsData);
    } catch (error) {
      console.error('❌ Erro ao carregar plantas:', error);
    }
  }, []);

  const loadSectors = useCallback(async (plantId: string) => {
    try {
      const timelineService = new TimelineService();
      const sectorsData = await timelineService.getSectors(plantId);
      setSectors(sectorsData);
    } catch (error) {
      console.error('❌ Erro ao carregar setores:', error);
    }
  }, []);

  const loadLines = useCallback(async (sectorId: string) => {
    try {
      const timelineService = new TimelineService();
      const linesData = await timelineService.getLines(sectorId);
      setLines(linesData);
    } catch (error) {
      console.error('❌ Erro ao carregar linhas:', error);
    }
  }, []);

  // Função para compartilhar timeline
  const shareTimeline = useCallback(async (data: any) => {
    try {
      const timelineService = new TimelineService();
      await timelineService.shareTimeline(data);
    } catch (error) {
      console.error('❌ Erro ao compartilhar timeline:', error);
      throw error;
    }
  }, []);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Função para limpar cache
  const clearCache = useCallback(() => {
    dataCache.clear();
    console.log('🗑️ Cache limpo');
  }, []);

  // Função para obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return {
      cacheSize: dataCache.size,
      queueSize: requestQueue.length,
      isProcessing: isProcessingQueue
    };
  }, []);

  return {
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
    fetchTimelineData: fetchTimelineDataOptimized,
    shareTimeline,
    clearError,
    clearCache,
    getCacheStats
  };
}; 