import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProductionStore } from '../store/useProductionStore';
import { useProductionControlStore } from '../store/useProductionControlStore';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ProductionOrder } from '../types';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, markSetupComplete } = useAuth();
  const { 
    productionOrders, 
    selectProductionOrder, 
    startProduction, 
    currentJob, 
    loadRealProductionOrders,
    loadJobProducts,
    isLoading: storeLoading,
    error: storeError 
  } = useProductionStore();
  const { availableProducts, loadAvailableProducts, isLoading, error } = useProductionControlStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  // Carregar ordens de produção reais quando a página for carregada
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 SetupPage: Carregando ordens de produção...');
        await loadRealProductionOrders();
        console.log('✅ SetupPage: Ordens carregadas com sucesso');
      } catch (error) {
        console.error('❌ SetupPage: Erro ao carregar ordens:', error);
      }
    };
    
    loadData();
  }, [loadRealProductionOrders]);

  const handleSelectOrder = async (order: ProductionOrder) => {
    setSelectedOrderId(order.id);
    selectProductionOrder(order);
    
    // Carregar produtos específicos para este job
    try {
      console.log('🎯 SetupPage: Carregando produtos para o job:', order.id);
      await loadJobProducts(order.id);
      console.log('✅ SetupPage: Produtos do job carregados');
    } catch (error) {
      console.error('❌ SetupPage: Erro ao carregar produtos do job:', error);
    }
  };

  const handleCompleteSetup = async () => {
    if (!currentJob) return;

    setIsCompletingSetup(true);
    
    try {
      // Iniciar produção
      await startProduction();
      
      // Marcar setup como completo
      markSetupComplete();
      
      // Redirecionar para o dashboard/OEE
      navigate('/oee', { replace: true });
    } catch (error) {
      console.error('Erro ao completar setup:', error);
    } finally {
      setIsCompletingSetup(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header da página */}
        <div className="text-center mb-8">
          <div className="bg-primary p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/assets/images/logo/option7-logo.svg" 
              alt="Option7" 
              className="h-6 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Configuração Inicial</h1>
          <p className="text-muted text-lg">Bem-vindo, {user?.name}! Configure sua primeira produção</p>
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-6">
          {/* Timer do setup */}
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-white">Setup em Progresso</h2>
            <p className="text-4xl font-mono font-black text-primary mt-2">00:00:00</p>
            <p className="text-muted mt-2">Selecione uma ordem de produção para começar</p>
          </Card>

          {/* Seleção de ordem e produto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ordens de Produção */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Ordens de Produção Disponíveis</h3>
              
              {storeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="sm" />
                  <span className="ml-3 text-muted">Carregando ordens de produção...</span>
                </div>
              ) : storeError ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm">Erro: {storeError}</p>
                  </div>
                </div>
              ) : productionOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                  <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-muted text-center">Nenhuma ordem de produção<br />disponível no turno atual</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {productionOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-2 ${
                        selectedOrderId === order.id 
                          ? 'bg-primary border-primary text-white shadow-lg scale-105' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                      disabled={storeLoading}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{order.name}</p>
                          <p className="text-sm opacity-75">{order.product}</p>
                          <p className="text-xs opacity-60 mt-1">
                            Quantidade: {order.quantity} | Entrega: {order.dueDate}
                          </p>
                        </div>
                        {selectedOrderId === order.id && (
                          <div className="bg-white text-primary rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Produto Selecionado */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Produto Selecionado</h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="sm" />
                  <span className="ml-3 text-muted">Carregando produtos...</span>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm">Erro: {error}</p>
                  </div>
                </div>
              ) : currentJob ? (
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center mb-3">
                    <div className="bg-primary rounded-full p-2 mr-3">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted">{currentJob.productId}</p>
                      <p className="text-xl font-bold text-white">{currentJob.productName}</p>
                    </div>
                  </div>
                                     <div className="mt-4 p-3 bg-gray-800 rounded">
                     <p className="text-sm text-muted">Ordem selecionada:</p>
                     <p className="text-white font-semibold">{currentJob.orderId}</p>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                  <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="text-muted text-center">Selecione uma ordem de produção<br />para visualizar o produto</p>
                </div>
              )}
            </Card>
          </div>

          {/* Botão de conclusão */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleCompleteSetup}
              disabled={!currentJob || isCompletingSetup}
              className="w-full max-w-lg bg-success hover:bg-green-500 text-white font-bold text-xl py-4 px-8 rounded-lg transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {isCompletingSetup ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-3">Configurando...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Concluir Setup e Iniciar Produção
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage; 