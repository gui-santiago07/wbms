
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DeviceSettingsPage from './pages/DeviceSettingsPage';
import ProductionControlPage from './pages/ProductionControlPage';
import OeeScreen from './components/features/dashboard/OeeScreen';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Routes>
          {/* Rota de login */}
          <Route path="/login" element={<LoginPage />} />
          

          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/oee" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/oee" element={
            <ProtectedRoute>
              <OeeScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/production" element={
            <ProtectedRoute>
              <ProductionControlPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/devices" element={
            <ProtectedRoute>
              <DeviceSettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen ml-16">
                <div className="bg-surface rounded-lg p-8 text-center">
                  <h1 className="text-2xl font-bold text-white mb-4">Configurações</h1>
                  <p className="text-muted">Página de configurações em desenvolvimento</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Rota de fallback */}
          <Route path="*" element={<Navigate to="/oee" replace />} />
        </Routes>
        

      </div>
    </AuthProvider>
  );
};

export default App;
