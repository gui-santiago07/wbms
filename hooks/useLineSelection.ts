import { useState, useCallback } from 'react';
import { useDeviceSettingsStore } from '../store/useDeviceSettingsStore';

interface Line {
  id: string;
  name: string;
}

/**
 * Hook personalizado para gerenciar a seleção de linha
 * Controla a visibilidade do modal e a linha selecionada
 */
export const useLineSelection = () => {
  const { deviceSettings } = useDeviceSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

  // Verificar se o dispositivo está configurado
  const isConfigured = deviceSettings.isConfigured;

  // Abrir modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Fechar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Confirmar seleção de linha
  const confirmLineSelection = useCallback((line: Line) => {
    setSelectedLine(line);
  }, []);

  // Verificar se precisa mostrar o modal (dispositivo não configurado)
  const shouldShowModal = !isConfigured;

  return {
    isModalOpen,
    selectedLine,
    isConfigured,
    shouldShowModal,
    openModal,
    closeModal,
    confirmLineSelection
  };
}; 