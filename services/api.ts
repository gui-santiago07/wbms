import { config } from '../config/environment';
import { cleanPhpSerializedString } from '../utils/stringUtils';

// Configuração base da API
const API_BASE_URL = config.apiBaseUrl;

// Sistema global para gerenciar intervalos de polling
class PollingManager {
  private intervals: Set<NodeJS.Timeout> = new Set();
  private isClearing = false;

  // Registrar um intervalo de polling
  registerInterval(interval: NodeJS.Timeout): void {
    if (!this.isClearing) {
      this.intervals.add(interval);
    }
  }

  // Remover um intervalo específico
  unregisterInterval(interval: NodeJS.Timeout): void {
    this.intervals.delete(interval);
  }

  // Limpar todos os intervalos de polling
  clearAllIntervals(): void {
    console.log('🛑 PollingManager: Limpando todos os intervalos de polling...');
    this.isClearing = true;
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals.clear();
    this.isClearing = false;
    console.log('✅ PollingManager: Todos os intervalos foram limpos');
  }

  // Obter quantidade de intervalos ativos
  getActiveIntervalsCount(): number {
    return this.intervals.size;
  }
}

// Instância global do gerenciador de polling
export const pollingManager = new PollingManager();

// Sistema de callbacks para logout automático
class AuthErrorHandler {
  private logoutCallbacks: Set<() => void> = new Set();

  // Registrar callback de logout
  registerLogoutCallback(callback: () => void): void {
    this.logoutCallbacks.add(callback);
  }

  // Remover callback de logout
  unregisterLogoutCallback(callback: () => void): void {
    this.logoutCallbacks.delete(callback);
  }

  // Executar logout automático
  executeLogout(): void {
    console.log('🚨 AuthErrorHandler: Executando logout automático devido a erro 401');
    
    // Limpar todos os intervalos de polling primeiro
    pollingManager.clearAllIntervals();
    
    // Executar todos os callbacks de logout
    this.logoutCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Erro ao executar callback de logout:', error);
      }
    });
    
    // Limpar callbacks após execução
    this.logoutCallbacks.clear();
  }
}

// Instância global do handler de erros de autenticação
export const authErrorHandler = new AuthErrorHandler();

// Função para detectar se estamos em desenvolvimento (com proxy)
const isDevelopmentWithProxy = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Função para obter headers de origem baseados no ambiente
const getOriginHeaders = (): Partial<{ Origin: string; Referer: string }> => {
  if (isDevelopmentWithProxy()) {
    // Em desenvolvimento com proxy, não precisamos dos headers de origem
    // pois o proxy do Vite já os adiciona automaticamente
    return {};
  } else {
    // Em produção/staging/Vercel, simular a origem esperada pelo servidor da Option7
    const hostname = window.location.hostname;
    
    if (hostname.includes('vercel.app')) {
      return {
        'Origin': 'https://m.option7.ai',
        'Referer': 'https://m.option7.ai/'
      };
    }
    
    // Para outros ambientes, deixar o navegador gerenciar
    return {};
  }
};

// 🔧 SOLUÇÃO ALTERNATIVA PARA CORS NO VERCEL
// Se o problema persistir, podemos usar esta função que simula a origem esperada
const getFallbackOriginHeaders = (): Partial<{ Origin: string; Referer: string }> => {
  const hostname = window.location.hostname;
  
  // Se estamos no Vercel e o servidor espera m.option7.ai
  if (hostname.includes('vercel.app')) {
    return {
      'Origin': 'https://m.option7.ai',
      'Referer': 'https://m.option7.ai/'
    };
  }
  
  return {};
};

// Função para log detalhado das requisições
const logRequest = (method: string, url: string, headers: HeadersInit, body?: any) => {
  console.group(`🚀 ${method} ${url}`);
  if (body) {
  }
  console.groupEnd();
};

const logResponse = (method: string, url: string, status: number, data: any) => {
  console.group(`✅ ${method} ${url} (${status})`);
  console.groupEnd();
};

const logError = (method: string, url: string, error: any) => {
  console.group(`❌ ${method} ${url} - ERRO`);
  console.error('🔍 Error Details:', error);
  if (error instanceof Response) {
    console.error('📊 Status:', error.status);
    console.error('📋 Status Text:', error.statusText);
    error.text().then(text => {
      console.error('📄 Response Text:', text);
    }).catch(e => {
      console.error('📄 Response Text Error:', e);
    });
  }
  console.groupEnd();
};

// Função para tratar erros de resposta HTTP
const handleHttpError = (response: Response, method: string, url: string): never => {
  // Verificar se é erro 401 (Unauthorized)
  if (response.status === 401) {
    console.error('🚨 Erro 401 detectado - Token expirado ou inválido');
    
    // Executar logout automático
    authErrorHandler.executeLogout();
    
    // Redirecionar para login se estivermos em uma página que não seja login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  
  // Para outros erros, lançar exceção normal
  throw new Error(`Erro na requisição ${method}: ${response.status} ${response.statusText}`);
};

// Cliente base para requisições HTTP (CHAMADA DIRETA SEM PROXY)
class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('mobile_api_token');
    
    console.log('🔧 ApiClient: Inicializado com configurações:', {
      baseUrl: this.baseUrl,
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'null'
    });
  }

  // Headers com autenticação (padronizado com origem dinâmica)
  private getHeaders(): HeadersInit {
    this.updateTokenFromStorage();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // ✅ PROXY VERCEL: Headers normais (proxy resolve CORS)
      ...getOriginHeaders()
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔧 ApiClient: Token encontrado:', {
        tokenPreview: `${this.token.substring(0, 20)}...`
      });
    } else {
      console.warn('⚠️ Nenhum token encontrado para autenticação');
    }

    return headers;
  }

  // Headers específicos para login (Content-Type diferente, origem dinâmica)
  private getLoginHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // ✅ PROXY VERCEL: Headers normais (proxy resolve CORS)
      ...getOriginHeaders()
    };
  }

  // Login e obtenção de token (headers padronizados)
  async login(username: string, password: string): Promise<{ token: string; nome: string }> {
    const url = `${this.baseUrl}/user/login`;
    
    // ✅ Usar x-www-form-urlencoded conforme documentação da API Option7
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    
    logRequest('POST', url, this.getLoginHeaders(), formData.toString());
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getLoginHeaders(),
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Login falhou: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      logResponse('POST', url, response.status, data);
      
      this.token = data.token;
      
      // Salvar token no localStorage
      localStorage.setItem('mobile_api_token', data.token);
      localStorage.setItem('user_name', cleanPhpSerializedString(data.nome)); // Limpar nome serializado
      
      console.log('🔧 ApiClient: Login realizado com sucesso:', {
        tokenPreview: `${data.token.substring(0, 20)}...`,
        nome: cleanPhpSerializedString(data.nome)
      });
      
      return data;
    } catch (error) {
      logError('POST', url, error);
      throw error;
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Atualizar token do localStorage (útil quando o token é atualizado em outro lugar)
  updateTokenFromStorage(): void {
    const storedToken = localStorage.getItem('mobile_api_token');
    if (storedToken && storedToken !== this.token) {
      this.token = storedToken;
      console.log('🔧 ApiClient: Token atualizado do localStorage:', {
        tokenPreview: `${storedToken.substring(0, 20)}...`
      });
    }
  }

  // Verificar se o token está sendo enviado corretamente
  getCurrentHeaders(): HeadersInit {
    return this.getHeaders();
  }

  // Debug: mostrar informações do token atual
  debugTokenInfo(): void {
    console.log('🔧 ApiClient: Informações do token:', {
      hasToken: !!this.token,
      tokenLength: this.token?.length || 0,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'null',
      localStorageToken: localStorage.getItem('mobile_api_token') ? 'present' : 'missing',
      headers: this.getHeaders()
    });
  }

  // Logout
  logout(): void {
    this.token = null;
    localStorage.removeItem('mobile_api_token');
    localStorage.removeItem('user_name');
  }

  // Requisição GET genérica (headers padronizados)
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    
    logRequest('GET', url, headers);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Tratar erro 401 especificamente
        if (response.status === 401) {
          handleHttpError(response, 'GET', url);
        }
        
        throw new Error(`Erro na requisição GET: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      logResponse('GET', url, response.status, data);
      return data;
    } catch (error) {
      logError('GET', url, error);
      throw error;
    }
  }

  // Requisição POST genérica (headers padronizados)
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    
    logRequest('POST', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POST failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Tratar erro 401 especificamente
        if (response.status === 401) {
          handleHttpError(response, 'POST', url);
        }
        
        throw new Error(`Erro na requisição POST: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      logResponse('POST', url, response.status, responseData);
      return responseData;
    } catch (error) {
      logError('POST', url, error);
      throw error;
    }
  }

  // Requisição PUT genérica (headers padronizados)
  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    
    logRequest('PUT', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PUT failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Tratar erro 401 especificamente
        if (response.status === 401) {
          handleHttpError(response, 'PUT', url);
        }
        
        throw new Error(`Erro na requisição PUT: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      logResponse('PUT', url, response.status, responseData);
      return responseData;
    } catch (error) {
      logError('PUT', url, error);
      throw error;
    }
  }

  // Requisição PATCH genérica (headers padronizados)
  async patch<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    
    logRequest('PATCH', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PATCH failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Tratar erro 401 especificamente
        if (response.status === 401) {
          handleHttpError(response, 'PATCH', url);
        }
        
        throw new Error(`Erro na requisição PATCH: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      logResponse('PATCH', url, response.status, responseData);
      return responseData;
    } catch (error) {
      logError('PATCH', url, error);
      throw error;
    }
  }

  // Requisição DELETE genérica (headers padronizados)
  async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    
    logRequest('DELETE', url, headers);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DELETE failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Tratar erro 401 especificamente
        if (response.status === 401) {
          handleHttpError(response, 'DELETE', url);
        }
        
        throw new Error(`Erro na requisição DELETE: ${response.status} ${response.statusText} - ${errorText}`);
      }

      logResponse('DELETE', url, response.status, 'Success');
    } catch (error) {
      logError('DELETE', url, error);
      throw error;
    }
  }
}

export default ApiClient; 