import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiClient from '../services/api';
import { cleanPhpSerializedString, cleanPhpSerializedObject } from '../utils/stringUtils';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  setupCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupCompleted: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  markSetupComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cliente da API para autenticação
const apiClient = new ApiClient();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('oee_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Verificar se o usuário salvo tem a estrutura antiga (com email)
        // e converter para a nova estrutura (com username)
        if (parsedUser.email && !parsedUser.username) {
          console.log('Convertendo usuário antigo para nova estrutura');
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
        role: 'Operador', // Role será fornecido pela API real
        setupCompleted: true // Setup sempre completo (tela removida)
      };
      
      setUser(userToStore);
      localStorage.setItem('oee_user', JSON.stringify(userToStore));
      localStorage.setItem('oee_setup_completed', 'true'); // Setup sempre completo
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oee_user');
    localStorage.removeItem('oee_setup_completed');
  };

  const markSetupComplete = () => {
    if (user) {
      const updatedUser = { ...user, setupCompleted: true };
      setUser(updatedUser);
      localStorage.setItem('oee_user', JSON.stringify(updatedUser));
      localStorage.setItem('oee_setup_completed', 'true');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setupCompleted: user?.setupCompleted || localStorage.getItem('oee_setup_completed') === 'true',
    login,
    logout,
    markSetupComplete
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