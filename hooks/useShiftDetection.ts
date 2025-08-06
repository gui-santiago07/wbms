import { useState, useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import Option7ApiService from '../services/option7ApiService';
import { Shift } from '../types';

interface ShiftData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  shiftNumberKey: number;
}

export const useShiftDetection = () => {
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { deviceSettings } = useDeviceSettingsStore();
  const { setCurrentShift: setStoreShift } = useProductionStore();
  const apiService = new Option7ApiService();

  const detectCurrentShift = async () => {
    if (!deviceSettings.isConfigured) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // ✅ CORRETO - Buscar turnos sem filtros
      const workshifts = await apiService.getWorkshifts([], [], []);

      // Detectar turno atual baseado no horário
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Mapear turnos para horários padrão baseado no nome/código
      const activeShift = workshifts.find(shift => {
        // Determinar horários baseado no nome do turno
        let shiftStartMinutes: number;
        let shiftEndMinutes: number;

        if (shift.nome.toLowerCase().includes('1') || shift.codigo.includes('1')) {
          // Turno 1: 08:00 - 16:00
          shiftStartMinutes = 8 * 60; // 08:00
          shiftEndMinutes = 16 * 60;  // 16:00
        } else if (shift.nome.toLowerCase().includes('2') || shift.codigo.includes('2')) {
          // Turno 2: 16:00 - 00:00
          shiftStartMinutes = 16 * 60; // 16:00
          shiftEndMinutes = 24 * 60;   // 00:00
        } else if (shift.nome.toLowerCase().includes('3') || shift.codigo.includes('3')) {
          // Turno 3: 00:00 - 08:00
          shiftStartMinutes = 0;       // 00:00
          shiftEndMinutes = 8 * 60;    // 08:00
        } else {
          // Turno padrão: 08:00 - 16:00
          shiftStartMinutes = 8 * 60;
          shiftEndMinutes = 16 * 60;
        }
        
        // Lidar com turnos que passam da meia-noite
        if (shiftEndMinutes < shiftStartMinutes) {
          return currentTime >= shiftStartMinutes || currentTime < shiftEndMinutes;
        } else {
          return currentTime >= shiftStartMinutes && currentTime < shiftEndMinutes;
        }
      });

      if (activeShift) {
        // Determinar horários para o turno ativo
        let startTime: string;
        let endTime: string;

        if (activeShift.nome.toLowerCase().includes('1') || activeShift.codigo.includes('1')) {
          startTime = '08:00';
          endTime = '16:00';
        } else if (activeShift.nome.toLowerCase().includes('2') || activeShift.codigo.includes('2')) {
          startTime = '16:00';
          endTime = '00:00';
        } else if (activeShift.nome.toLowerCase().includes('3') || activeShift.codigo.includes('3')) {
          startTime = '00:00';
          endTime = '08:00';
        } else {
          startTime = '08:00';
          endTime = '16:00';
        }

        const shiftData: ShiftData = {
          id: activeShift.id.toString(),
          name: activeShift.nome,
          startTime,
          endTime,
          isActive: true,
          shiftNumberKey: activeShift.id
        };

        setCurrentShift(shiftData);
        setStoreShift(shiftData as Shift);
        
      } else {
        setCurrentShift(null);
        // Não definir turno no store se não há turno ativo
      }

    } catch (error) {
      console.error('❌ Erro na detecção de turno:', error);
      setError('Erro ao detectar turno atual');
    } finally {
      setIsLoading(false);
    }
  };

  // Detectar turno na inicialização e a cada hora
  useEffect(() => {
    detectCurrentShift();
    
    const interval = setInterval(() => {
      detectCurrentShift();
    }, 60 * 60 * 1000); // Verificar a cada hora

    return () => clearInterval(interval);
  }, [deviceSettings.isConfigured]);

  return {
    currentShift,
    isLoading,
    error,
    detectCurrentShift
  };
}; 