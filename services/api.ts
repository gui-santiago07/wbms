import { config } from '../config/environment';
import { cleanPhpSerializedString } from '../utils/stringUtils';

// Configuração base da API
const API_BASE_URL = config.apiBaseUrl;

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
    console.log('🔧 Headers de origem: omitidos (desenvolvimento com proxy)');
    return {};
  } else {
    // Em produção/staging, usar headers de origem consistentes
    console.log('🔧 Headers de origem: aplicados (produção/staging)');
    return {
      'Origin': 'https://m.option7.ai',
      'Referer': 'https://m.option7.ai/'
    };
  }
};

// Função para log detalhado das requisições
const logRequest = (method: string, url: string, headers: HeadersInit, body?: any) => {
  const debugLog = (window as any).addDebugLog;
  if (debugLog) {
    debugLog('info', `🚀 ${method} ${url}`, { headers, body });
  }
  console.group(`🚀 ${method} ${url}`);
  console.log('📋 Headers:', headers);
  if (body) {
    console.log('📦 Body:', body);
  }
  console.groupEnd();
};

const logResponse = (method: string, url: string, status: number, data: any) => {
  const debugLog = (window as any).addDebugLog;
  if (debugLog) {
    debugLog('success', `✅ ${method} ${url} (${status})`, data);
  }
  console.group(`✅ ${method} ${url} (${status})`);
  console.log('📄 Response:', data);
  console.groupEnd();
};

const logError = (method: string, url: string, error: any) => {
  const debugLog = (window as any).addDebugLog;
  if (debugLog) {
    debugLog('error', `❌ ${method} ${url} - ERRO`, error);
  }
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

// Cliente base para requisições HTTP (CHAMADA DIRETA SEM PROXY)
class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('mobile_api_token');
    
    const debugLog = (window as any).addDebugLog;
    if (debugLog) {
      debugLog('info', '🔧 ApiClient inicializado (HEADERS PADRONIZADOS)', {
        baseUrl: this.baseUrl,
        hasToken: !!this.token,
        tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'null'
      });
    }
    
    console.log('🔧 ApiClient inicializado (HEADERS PADRONIZADOS):', {
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
      // ✅ HEADERS DE ORIGEM DINÂMICOS BASEADOS NO AMBIENTE
      ...getOriginHeaders()
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔐 Bearer token incluído:', {
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
      // ✅ HEADERS DE ORIGEM DINÂMICOS BASEADOS NO AMBIENTE
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
    
    console.log('🚀 === LOGIN COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Form Data:', formData.toString());
    console.log('=====================================');
    
    logRequest('POST', url, this.getLoginHeaders(), formData.toString());
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getLoginHeaders(),
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 Login Response Status:', response.status);
      console.log('📋 Login Response Headers:', Object.fromEntries(response.headers.entries()));

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
      
      const debugLog = (window as any).addDebugLog;
      if (debugLog) {
        debugLog('success', '🔐 Token salvo (HEADERS PADRONIZADOS)', {
          tokenPreview: `${data.token.substring(0, 20)}...`,
          nome: cleanPhpSerializedString(data.nome)
        });
      }
      
      console.log('🔐 Token salvo (HEADERS PADRONIZADOS):', {
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
      console.log('🔄 Token atualizado do localStorage:', {
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
    console.log('🔍 Debug Token Info (HEADERS PADRONIZADOS):', {
      hasToken: !!this.token,
      tokenLength: this.token?.length || 0,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'null',
      localStorageToken: localStorage.getItem('mobile_api_token') ? 'present' : 'missing',
      headers: this.getHeaders()
    });
  }

  // Logout
  logout(): void {
    const debugLog = (window as any).addDebugLog;
    if (debugLog) {
      debugLog('info', '🚪 Logout - limpando dados');
    }
    console.log('🚪 Logout - limpando dados');
    this.token = null;
    localStorage.removeItem('mobile_api_token');
    localStorage.removeItem('user_name');
  }

  // Requisição GET genérica (headers padronizados)
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log('🚀 === GET COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('====================================');
    
    logRequest('GET', url, headers);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 GET Response Status:', response.status);
      console.log('📋 GET Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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
    
    console.log('🚀 === POST COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', data);
    console.log('=====================================');
    
    logRequest('POST', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 POST Response Status:', response.status);
      console.log('📋 POST Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POST failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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
    
    console.log('🚀 === PUT COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', data);
    console.log('====================================');
    
    logRequest('PUT', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 PUT Response Status:', response.status);
      console.log('📋 PUT Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PUT failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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
    
    console.log('🚀 === PATCH COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', data);
    console.log('=====================================');
    
    logRequest('PATCH', url, headers, data);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 PATCH Response Status:', response.status);
      console.log('📋 PATCH Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PATCH failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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
    
    console.log('🚀 === DELETE COM HEADERS PADRONIZADOS ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('======================================');
    
    logRequest('DELETE', url, headers);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('📊 DELETE Response Status:', response.status);
      console.log('📋 DELETE Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DELETE failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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