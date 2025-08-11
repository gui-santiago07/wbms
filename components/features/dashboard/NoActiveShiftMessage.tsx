import React from 'react';
import Card from '../../ui/Card';

const NoActiveShiftMessage: React.FC = () => {
  return (
    <Card className="text-center p-8">
      <div className="mb-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mx-auto text-yellow-500"
        >
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Nenhum Turno Ativo</h2>
      <p className="text-gray-400 mb-4">
        Não há turnos ativos no momento.
      </p>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-yellow-400 text-sm">
          <strong>Status:</strong> Aguardando início de um turno de produção
        </p>
      </div>
    </Card>
  );
};

export default NoActiveShiftMessage; 