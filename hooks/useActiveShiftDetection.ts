import { useState, useEffect, useCallback } from 'react';
import { useProductionStore } from '../store/useProductionStore';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';
import { Shift } from '../types';

/**
 * Hook para detectar automaticamente o turno ativo baseado na hora atual
 * Atualiza o turno automaticamente quando a hora muda
 */
export const useActiveShiftDetection = () => {
  const { shifts, currentShift, setCurrentShift } = useProductionStore();
  const { deviceSettings } = useDeviceSettingsStore();
  const [isDetecting, setIsDetecting] = useState(false);

  // Função para detectar turno ativo baseado na hora
  const detectActiveShift = useCallback(() => {
    if (shifts.length === 0) {
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Converter para minutos
    

    // Encontrar turno ativo baseado no horário
    const activeShift = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      const shiftStartMinutes = startHour * 60 + startMin;
      const shiftEndMinutes = endHour * 60 + endMin;
      
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

    return () => clearInterval(interval);
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