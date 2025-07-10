import React, { useState } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { Shift } from '../../../types';
import Card from '../../ui/Card';

interface ShiftModalProps {
  onClose: () => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ onClose }) => {
  const { 
    shifts, 
    currentShift, 
    setCurrentShift, 
    createShift 
  } = useProductionStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '',
    endTime: '',
    isActive: true
  });

  const handleSelectShift = (shift: Shift) => {
    setCurrentShift(shift);
    onClose();
  };

  const handleCreateShift = () => {
    if (newShift.name && newShift.startTime && newShift.endTime) {
      createShift(newShift);
      setNewShift({ name: '', startTime: '', endTime: '', isActive: true });
      setIsCreating(false);
    }
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Selecionar Turno</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Lista de Turnos */}
          <div className="space-y-3 mb-6">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                onClick={() => handleSelectShift(shift)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  currentShift?.id === shift.id
                    ? 'bg-primary bg-opacity-20 border-2 border-primary'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                } ${!shift.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{shift.name}</h3>
                    <p className="text-sm text-gray-400">
                      Horário: {formatTimeRange(shift.startTime, shift.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentShift?.id === shift.id && (
                      <span className="text-primary font-semibold">Selecionado</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      shift.isActive 
                        ? 'bg-green-500 bg-opacity-20 text-green-400' 
                        : 'bg-gray-500 bg-opacity-20 text-gray-400'
                    }`}>
                      {shift.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Seção de Criação */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Criar Novo Turno</span>
              </div>
            </button>
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Novo Turno</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Turno</label>
                  <input
                    type="text"
                    value={newShift.name}
                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="Ex: TURNO 4"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Início</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Término</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shiftActive"
                    checked={newShift.isActive}
                    onChange={(e) => setNewShift({ ...newShift, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                  />
                  <label htmlFor="shiftActive" className="text-sm text-gray-300">Turno ativo</label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateShift}
                    disabled={!newShift.name || !newShift.startTime || !newShift.endTime}
                    className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Criar Turno
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ShiftModal; 