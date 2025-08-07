import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiClient from '../services/api';
import { authErrorHandler } from '../services/api';
import { cleanPhpSerializedString, cleanPhpSerializedObject } from '../utils/stringUtils';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cliente da API para autenticação
const apiClient = new ApiClient();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função de logout que será registrada no sistema de logout automático
  const handleLogout = () => {
    console.log('🔧 AuthContext: Executando logout automático');
    
    // Limpar estado do usuário
    setUser(null);
    
    // Limpar localStorage
    localStorage.removeItem('oee_user');
    
    // Fazer logout no ApiClient
    apiClient.logout();
    
    console.log('✅ AuthContext: Logout automático concluído');
  };

  // Registrar callback de logout no sistema de erro 401
  useEffect(() => {
    authErrorHandler.registerLogoutCallback(handleLogout);
    
    // Cleanup: remover callback quando componente for desmontado
    return () => {
      authErrorHandler.unregisterLogoutCallback(handleLogout);
    };
  }, []);

  // Verificar se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('oee_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Verificar se o usuário salvo tem a estrutura antiga (com email)
        // e converter para a nova estrutura (com username)
        if (parsedUser.email && !parsedUser.username) {
          const updatedUser = {
            ...parsedUser,
            username: cleanPhpSerializedString(parsedUser.email), // Limpar string serializada
            email: undefined // Remover campo email
          };
          delete updatedUser.email;
          setUser(updatedUser);
          localStorage.setItem('oee_user', JSON.stringify(updatedUser));
        } else {
          // Limpar strings serializadas em dados existentes
          const cleanedUser = cleanPhpSerializedObject(parsedUser, ['name', 'username']);
          setUser(cleanedUser);
          localStorage.setItem('oee_user', JSON.stringify(cleanedUser));
        }
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error);
        localStorage.removeItem('oee_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Usar a API real para autenticação
      const response = await apiClient.login(username, password);
      
      const userToStore = {
        id: '1', // ID será fornecido pela API real
        name: cleanPhpSerializedString(response.nome), // Limpar nome serializado
        username: cleanPhpSerializedString(username), // Limpar username serializado
        role: 'Operador' // Role será fornecido pela API real
      };
      
      setUser(userToStore);
      localStorage.setItem('oee_user', JSON.stringify(userToStore));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('🔧 AuthContext: Executando logout manual');
    
    // Limpar estado do usuário
    setUser(null);
    
    // Limpar localStorage
    localStorage.removeItem('oee_user');
    
    // Fazer logout no ApiClient
    apiClient.logout();
    
    console.log('✅ AuthContext: Logout manual concluído');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 