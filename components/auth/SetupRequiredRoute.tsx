import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SetupRequiredRouteProps {
  children: React.ReactNode;
}

const SetupRequiredRoute: React.FC<SetupRequiredRouteProps> = ({ children }) => {
  const { isAuthenticated, setupCompleted, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-primary p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/assets/images/logo/option7-logo.svg" 
              alt="Option7" 
              className="h-6 w-auto animate-pulse"
            />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Carregando...</h2>
          <p className="text-muted">Verificando configuração</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado mas não completou setup, permitir acesso direto
  // (setup foi removido, então sempre permitir acesso)
  if (!setupCompleted) {
    // Marcar setup como completo automaticamente
    return <>{children}</>;
  }

  // Se estiver autenticado e setup completo, renderizar o conteúdo
  return <>{children}</>;
};

export default SetupRequiredRoute; 