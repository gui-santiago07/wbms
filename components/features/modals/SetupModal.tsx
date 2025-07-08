
import React, { useState } from 'react';
import { useProductionStore } from '../../../store/useProductionStore';
import Card from '../../ui/Card';
import { ProductionOrder, Product } from '../../../types';

const SetupModal: React.FC = () => {
  const { productionOrders, products, selectProductionOrder, startProduction, currentJob } = useProductionStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSelectOrder = (order: ProductionOrder) => {
    setSelectedOrderId(order.id);
    selectProductionOrder(order);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="text-center">
        <h2 className="text-3xl font-bold text-white">Setup em Progresso</h2>
        <p className="text-5xl font-mono font-black text-primary mt-2">00:29:57</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-3">Ordens de Produção</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {productionOrders.map(order => (
              <button
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedOrderId === order.id ? 'bg-primary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <p className="font-bold">{order.name}</p>
                <p className="text-sm">{order.product}</p>
                <p className="text-xs text-muted">Qtd: {order.quantity} - Due: {order.dueDate}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-3">Produto Selecionado</h3>
          {currentJob ? (
            <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-muted">{currentJob.productId}</p>
                <p className="text-lg font-bold text-white">{currentJob.productName}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-700/50 rounded-lg">
                <p className="text-muted">Selecione uma ordem</p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={startProduction}
          disabled={!currentJob}
          className="w-full max-w-md bg-success text-white font-bold text-xl py-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-500"
        >
          Iniciar Produção
        </button>
      </div>
    </div>
  );
};

export default SetupModal;
