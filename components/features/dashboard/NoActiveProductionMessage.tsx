import React from 'react';
import Card from '../../ui/Card';

interface NoActiveProductionMessageProps {
  onStartSetup: () => void;
}

const NoActiveProductionMessage: React.FC<NoActiveProductionMessageProps> = ({ onStartSetup }) => {
  return (
    <div className="text-center py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
        </div>
        
        <h3 className="text-base font-medium text-white mb-2">
          Nenhuma Produção Ativa
        </h3>
        
        <p className="text-gray-400 mb-4 text-sm">
          Não há produção ativa no momento. Para iniciar uma nova produção, configure o setup da linha.
        </p>
        
        <button
          onClick={onStartSetup}
          className="inline-flex items-center px-3 py-2 bg-primary hover:bg-primary/80 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg 
            className="mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
          Iniciar Setup
        </button>
      </div>
    </div>
  );
};

export default NoActiveProductionMessage; 