// Teste de Integração com Backend de Produção Automática
// Execute este arquivo no navegador para testar as APIs


// Configuração
const API_BASE_URL = '/automatic-production';
const TEST_LINE_ID = '269'; // Linha de teste

// Função para fazer requisições
async function testApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('mobile_api_token');
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Testes
async function runTests() {

  // Teste 1: Dados de produção por linha
  const productionData = await testApi(`/data?client_line_key=${TEST_LINE_ID}`);
  if (productionData.success) {
  } else {
  }

  // Teste 2: Status dos dispositivos
  const devicesStatus = await testApi('/devices/status');
  if (devicesStatus.success) {
  } else {
  }

  // Teste 3: Todos os dados de produção
  const allData = await testApi('/data/all');
  if (allData.success) {
  } else {
  }

  // Teste 4: Dados de produção por dispositivo (se houver device_id)
  const deviceData = await testApi('/data/device?device_id=test');
  if (deviceData.success) {
  } else {
  }

}

// Verificar se está autenticado
function checkAuth() {
  const token = localStorage.getItem('mobile_api_token');
  if (!token) {
    return false;
  }
  return true;
}

// Executar testes se autenticado
if (checkAuth()) {
  runTests();
} else {
} 