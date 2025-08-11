import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import TimelineService, { OeeData } from '../services/timelineService';
import { pollingManager } from '../services/api';

interface UseOeeDataReturn {
  oeeData: OeeData;
  isLoading: boolean;
  error: string | null;
  refreshOeeData: () => Promise<void>;
  lastUpdate: number;
}

// Cache para dados de OEE
export const oeeCache = new Map<string, { data: OeeData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const generateOeeCacheKey = (lines: string[]): string => {
  return lines.sort().join(',');
};

const areOeeDataEqual = (data1: OeeData, data2: OeeData): boolean => {
  return data1.oee === data2.oee && 
         data1.availability === data2.availability && 
         data1.performance === data2.performance && 
         data1.quality === data2.quality;
};

export const useOeeData = (): UseOeeDataReturn => {
  const [oeeData, setOeeData] = useState<OeeData>({
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const { selectedLines, hasGeneratedTimeline } = useTimelineStore();
  const timelineService = new TimelineService();
  
  // Refs para controle de estado
  const lastOeeDataRef = useRef<OeeData>(oeeData);
  const lastLinesRef = useRef<string[]>([]);
  const lastCalculationTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  const maxConsecutiveErrors = 3;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateOeeFromTimeline = useCallback(async () => {
    if (!selectedLines.length || !hasGeneratedTimeline) {
      console.log('⏸️ useOeeData: Não há linhas selecionadas ou timeline não gerada');
      return;
    }

    // Verificar se as linhas mudaram
    const linesChanged = selectedLines.length !== lastLinesRef.current.length ||
                        !selectedLines.every((line, index) => line === lastLinesRef.current[index]);
    
    if (!linesChanged && lastCalculationTimeRef.current > 0) {
      const timeSinceLastCalculation = Date.now() - lastCalculationTimeRef.current;
      if (timeSinceLastCalculation < 5 * 60 * 1000) { // 5 minutos
        console.log('⏸️ useOeeData: Muito cedo para recalcular OEE');
        return;
      }
    }

    // Verificar cache
    const cacheKey = generateOeeCacheKey(selectedLines);
    const cachedData = oeeCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('✅ useOeeData: Usando dados do cache');
      setOeeData(cachedData.data);
      setLastUpdate(cachedData.timestamp);
      lastOeeDataRef.current = cachedData.data;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 useOeeData: Calculando OEE para linhas:', selectedLines);
      
      // Buscar dados da timeline para o período atual (últimas 24h)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const timelineFilters = {
        start_period: startDate,
        end_period: endDate,
        filtros: {
          linhas: selectedLines
        }
      };

      const timelineData = await timelineService.getTimelineData(timelineFilters);
      
      if (timelineData.success && timelineData.data) {
        const calculatedOee = timelineService.calculateOeeData(timelineData);
        
        // Verificar se os dados são diferentes dos anteriores
        if (areOeeDataEqual(lastOeeDataRef.current, calculatedOee)) {
          console.log('✅ useOeeData: Dados OEE idênticos aos anteriores, mantendo estado atual');
        } else {
          console.log('✅ useOeeData: OEE calculado com sucesso:', calculatedOee);
          setOeeData(calculatedOee);
          lastOeeDataRef.current = calculatedOee;
          setLastUpdate(Date.now());
          
          // Atualizar cache
          oeeCache.set(cacheKey, {
            data: calculatedOee,
            timestamp: Date.now()
          });
        }
        
        // Reset contador de erros
        consecutiveErrorsRef.current = 0;
        lastLinesRef.current = [...selectedLines];
        lastCalculationTimeRef.current = Date.now();
        
      } else {
        console.warn('⚠️ useOeeData: Nenhum dado de timeline disponível para cálculo OEE');
        setOeeData({
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 0
        });
      }
    } catch (error) {
      consecutiveErrorsRef.current++;
      console.error(`❌ useOeeData: Erro ao calcular OEE (${consecutiveErrorsRef.current}/${maxConsecutiveErrors}):`, error);
      setError('Erro ao calcular dados de OEE');
      setOeeData({
        oee: 0,
        availability: 0,
        performance: 0,
        quality: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [timelineService, selectedLines, hasGeneratedTimeline]);

  const refreshOeeData = useCallback(async () => {
    console.log('🔄 useOeeData: Forçando atualização manual');
    consecutiveErrorsRef.current = 0; // Reset contador de erros
    lastCalculationTimeRef.current = 0; // Reset tempo da última cálculo
    await calculateOeeFromTimeline();
  }, [calculateOeeFromTimeline]);

  // Calcular OEE quando linhas selecionadas ou status da timeline mudar
  useEffect(() => {
    calculateOeeFromTimeline();
  }, [calculateOeeFromTimeline]);

  // Atualizar OEE a cada 5 minutos apenas se houver dados válidos
  useEffect(() => {
    if (!selectedLines.length || !hasGeneratedTimeline) {
      return; // Não fazer polling se não há linhas selecionadas
    }
    
    const interval = setInterval(() => {
      // Só atualizar se passou tempo suficiente desde a última atualização
      const now = Date.now();
      if (now - lastCalculationTimeRef.current >= 5 * 60 * 1000) { // 5 minutos
        calculateOeeFromTimeline();
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Registrar intervalo no sistema centralizado
    intervalRef.current = interval;
    pollingManager.registerInterval(interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        pollingManager.unregisterInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [calculateOeeFromTimeline, selectedLines.length, hasGeneratedTimeline]);

  return {
    oeeData,
    isLoading,
    error,
    refreshOeeData,
    lastUpdate
  };
}; 