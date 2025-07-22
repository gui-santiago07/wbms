import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Card from '../components/ui/Card';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();

  // Se já estiver autenticado, redirecionar para OEE
  if (isAuthenticated) {
    return <Navigate to="/oee" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Usuário ou senha incorretos');
    }
  };

  const mockCredentials = [
    { username: 'joao.operador', password: '123456', role: 'Operador' },
    { username: 'maria.supervisor', password: '123456', role: 'Supervisor' },
    { username: 'admin', password: 'admin123', role: 'Administrador' }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="bg-primary p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/assets/images/logo/option7-logo.svg" 
              alt="Option7" 
              className="h-6 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Option7</h1>
          <p className="text-muted">Sistema de Monitoramento de Produção</p>
        </div>

        {/* Formulário de Login */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Entrar no Sistema</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Usuário
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="seu.usuario"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Credenciais de Teste */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showCredentials ? 'Ocultar' : 'Mostrar'} credenciais de teste
            </button>
            
            {showCredentials && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted">Usuários para teste:</p>
                {mockCredentials.map((cred, index) => (
                  <div key={index} className="bg-surface/50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{cred.role}</span>
                      <button
                        onClick={() => {
                          setUsername(cred.username);
                          setPassword(cred.password);
                        }}
                        className="text-primary hover:text-primary/80 text-xs"
                      >
                        Usar
                      </button>
                    </div>
                    <div className="text-muted">
                      <div>Usuário: {cred.username}</div>
                      <div>Senha: {cred.password}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage; 