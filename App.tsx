
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetupRequiredRoute from './components/auth/SetupRequiredRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
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
          

          
          {/* Rotas protegidas que requerem setup completo */}
          <Route path="/" element={
            <SetupRequiredRoute>
              <Navigate to="/oee" replace />
            </SetupRequiredRoute>
          } />
          
          <Route path="/oee" element={
            <SetupRequiredRoute>
              <OeeScreen />
            </SetupRequiredRoute>
          } />
          
          <Route path="/dashboard" element={
            <SetupRequiredRoute>
              <DashboardPage />
            </SetupRequiredRoute>
          } />
          
          <Route path="/production" element={
            <SetupRequiredRoute>
              <ProductionControlPage />
            </SetupRequiredRoute>
          } />
          
          <Route path="/settings/devices" element={
            <SetupRequiredRoute>
              <DeviceSettingsPage />
            </SetupRequiredRoute>
          } />
          
          <Route path="/settings" element={
            <SetupRequiredRoute>
              <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen ml-16">
                <div className="bg-surface rounded-lg p-8 text-center">
                  <h1 className="text-2xl font-bold text-white mb-4">Configurações</h1>
                  <p className="text-muted">Página de configurações em desenvolvimento</p>
                </div>
              </div>
            </SetupRequiredRoute>
          } />
          
          {/* Rota de fallback */}
          <Route path="*" element={<Navigate to="/oee" replace />} />
        </Routes>
        

      </div>
    </AuthProvider>
  );
};

export default App;
