import React, { useState } from 'react';
import { useProductionControlStore } from '../../../store/useProductionControlStore';
import { Timesheet, ProductionStatus as ProductionStatusType } from '../../../types';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface ProductionControlsProps {
  timesheet: Timesheet;
  status: ProductionStatusType | null;
}

const ProductionControls: React.FC<ProductionControlsProps> = ({ timesheet, status }) => {
  const {
    isLoading,
    startProduction,
    pauseProduction,
    resumeProduction,
    stopProduction
  } = useProductionControlStore();

  const [showStopModal, setShowStopModal] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [stopDescription, setStopDescription] = useState('');

  const handleStartProduction = async () => {
    try {
      await startProduction('Produção iniciada pelo operador');
    } catch (error) {
      console.error('Erro ao iniciar produção:', error);
    }
  };

  const handlePauseProduction = async () => {
    try {
      await pauseProduction('Produção pausada pelo operador');
    } catch (error) {
      console.error('Erro ao pausar produção:', error);
    }
  };

  const handleResumeProduction = async () => {
    try {
      await resumeProduction();
    } catch (error) {
      console.error('Erro ao retomar produção:', error);
    }
  };

  const handleStopProduction = async () => {
    if (!stopReason.trim()) {
      alert('Por favor, informe o motivo da parada');
      return;
    }

    try {
      await stopProduction({
        reason: stopReason,
        description: stopDescription
      });
      setShowStopModal(false);
      setStopReason('');
      setStopDescription('');
    } catch (error) {
      console.error('Erro ao parar produção:', error);
    }
  };

  const isRunning = status?.machine_status === 'RUNNING';
  const isPaused = status?.machine_status === 'PAUSED';
  const isSetup = status?.machine_status === 'SETUP';

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Controles de Produção
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Botão Iniciar Produção */}
          {isSetup && (
            <button
              onClick={handleStartProduction}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Iniciar Produção
                </>
              )}
            </button>
          )}

          {/* Botão Pausar Produção */}
          {isRunning && (
            <button
              onClick={handlePauseProduction}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pausar Produção
                </>
              )}
            </button>
          )}

          {/* Botão Retomar Produção */}
          {isPaused && (
            <button
              onClick={handleResumeProduction}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Retomar Produção
                </>
              )}
            </button>
          )}

          {/* Botão Parar Produção */}
          {(isRunning || isPaused || isSetup) && (
            <button
              onClick={() => setShowStopModal(true)}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Parar Produção
                </>
              )}
            </button>
          )}
        </div>

        {/* Status atual */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Status atual:</span> {status?.machine_status || 'Desconhecido'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Última atualização:</span> {status?.last_updated ? new Date(status.last_updated).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>
      </Card>

      {/* Modal de Parada */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parar Produção
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Parada *
                </label>
                <select
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um motivo</option>
                  <option value="Fim do Turno">Fim do Turno</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Falta de Material">Falta de Material</option>
                  <option value="Problema Técnico">Problema Técnico</option>
                  <option value="Parada Programada">Parada Programada</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Adicional
                </label>
                <textarea
                  value={stopDescription}
                  onChange={(e) => setStopDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalhes adicionais sobre a parada..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStopModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStopProduction}
                disabled={isLoading || !stopReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md font-medium transition-colors"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Confirmar Parada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductionControls; 