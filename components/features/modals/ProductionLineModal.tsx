import React, { useState } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import { ProductionLine } from '../../../types';
import Card from '../../ui/Card';

interface ProductionLineModalProps {
  onClose: () => void;
}

const ProductionLineModal: React.FC<ProductionLineModalProps> = ({ onClose }) => {
  const { 
    productionLines, 
    currentProductionLine, 
    setCurrentProductionLine, 
    createProductionLine 
  } = useProductionStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newLine, setNewLine] = useState({
    line: '',
    description: '',
    is_active: true
  });

  const handleSelectLine = (line: ProductionLine) => {
    setCurrentProductionLine(line);
    onClose();
  };

  const handleCreateLine = () => {
    if (newLine.line) {
      createProductionLine(newLine);
      setNewLine({ line: '', description: '', is_active: true });
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Selecionar Linha de Produção</h2>
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

          {/* Lista de Linhas de Produção */}
          <div className="space-y-3 mb-6">
            {productionLines.map((line) => (
              <div
                key={line.client_line_key}
                onClick={() => handleSelectLine(line)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  currentProductionLine?.client_line_key === line.client_line_key
                    ? 'bg-primary bg-opacity-20 border-2 border-primary'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                } ${!line.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{line.line}</h3>
                    <p className="text-sm text-gray-400">Código: {line.client_line_key}</p>
                    <p className="text-sm text-gray-400">{line.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentProductionLine?.client_line_key === line.client_line_key && (
                      <span className="text-primary font-semibold">Selecionada</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      line.is_active 
                        ? 'bg-green-500 bg-opacity-20 text-green-400' 
                        : 'bg-gray-500 bg-opacity-20 text-gray-400'
                    }`}>
                      {line.is_active ? 'Ativa' : 'Inativa'}
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
                <span>Criar Nova Linha de Produção</span>
              </div>
            </button>
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Nova Linha de Produção</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Linha</label>
                  <input
                    type="text"
                    value={newLine.line}
                    onChange={(e) => setNewLine({ ...newLine, line: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="Ex: ENVASE 520741-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={newLine.description}
                    onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="Ex: Linha de Envase Terciária"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newLine.is_active}
                    onChange={(e) => setNewLine({ ...newLine, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">Linha ativa</label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateLine}
                    disabled={!newLine.line}
                    className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Criar Linha
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

export default ProductionLineModal; 