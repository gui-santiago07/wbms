import { useState, useEffect, useCallback } from 'react';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import { useProductionStore } from '../store/useProductionStore';
import { Shift } from '../types';
import { pollingManager } from '../services/api';

export const useActiveShiftDetection = () => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const deviceSettings = useDeviceSettingsStore((state) => state.deviceSettings);
  const shifts = useProductionStore((state) => state.shifts);

  // Função para detectar turno ativo baseado no horário atual
  const detectActiveShift = useCallback(() => {
    if (!shifts || shifts.length === 0) {
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const activeShift = shifts.find(shift => {
      // Determinar horários baseado no nome do turno
      let shiftStartMinutes: number;
      let shiftEndMinutes: number;

      if (shift.name.toLowerCase().includes('1') || shift.code?.includes('1')) {
        // Turno 1: 08:00 - 16:00
        shiftStartMinutes = 8 * 60; // 08:00
        shiftEndMinutes = 16 * 60;  // 16:00
      } else if (shift.name.toLowerCase().includes('2') || shift.code?.includes('2')) {
        // Turno 2: 16:00 - 00:00
        shiftStartMinutes = 16 * 60; // 16:00
        shiftEndMinutes = 24 * 60;   // 00:00
      } else if (shift.name.toLowerCase().includes('3') || shift.code?.includes('3')) {
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
      return activeShift;
    }

    return null;
  }, [shifts]);

  // Função para buscar turno ativo da API
  const fetchActiveShiftFromAPI = useCallback(async () => {
    if (!deviceSettings.isConfigured || !deviceSettings.lineId) {
      return null;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/shifts/active?line=${deviceSettings.lineId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar turno ativo: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.shift) {
        return data.shift;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar turno ativo da API:', error);
      return null;
    }
  }, [deviceSettings]);

  // Função principal para atualizar turno ativo
  const updateActiveShift = useCallback(async () => {
    setIsDetecting(true);
    
    try {
      // Primeiro tentar buscar da API
      let activeShift = await fetchActiveShiftFromAPI();
      
      // Se não conseguir da API, usar detecção local
      if (!activeShift) {
        activeShift = detectActiveShift();
      }
      
      // Se encontrou um turno ativo e é diferente do atual
      if (activeShift && (!currentShift || currentShift.id !== activeShift.id)) {
        console.log('🔄 useActiveShiftDetection: Turno ativo mudou:', {
          from: currentShift?.name || 'Nenhum',
          to: activeShift.name
        });
        setCurrentShift(activeShift);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar turno ativo:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [currentShift, detectActiveShift, fetchActiveShiftFromAPI, setCurrentShift]);

  // Atualizar turno quando shifts mudarem
  useEffect(() => {
    if (shifts.length > 0) {
      updateActiveShift();
    }
  }, [shifts, updateActiveShift]);

  // Verificar turno a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      updateActiveShift();
    }, 60000); // 1 minuto

    // Registrar intervalo no sistema centralizado
    pollingManager.registerInterval(interval);

    return () => {
      clearInterval(interval);
      pollingManager.unregisterInterval(interval);
    };
  }, [updateActiveShift]);

  // Verificar turno quando a linha mudar
  useEffect(() => {
    if (deviceSettings.isConfigured && deviceSettings.lineId) {
      updateActiveShift();
    }
  }, [deviceSettings.lineId, deviceSettings.isConfigured, updateActiveShift]);

  return {
    currentShift,
    isDetecting,
    updateActiveShift,
    detectActiveShift
  };
}; 