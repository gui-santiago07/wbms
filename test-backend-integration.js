// Teste de Integração com Backend de Produção Automática
// Execute este arquivo no navegador para testar as APIs

console.log('🧪 Iniciando testes de integração com backend...');

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
  console.log('🔍 Testando APIs do backend...');

  // Teste 1: Dados de produção por linha
  console.log('\n📊 Teste 1: Dados de produção por linha');
  const productionData = await testApi(`/data?client_line_key=${TEST_LINE_ID}`);
  if (productionData.success) {
    console.log('✅ Dados de produção carregados:', productionData.data);
  } else {
    console.log('❌ Erro ao carregar dados de produção:', productionData.error);
  }

  // Teste 2: Status dos dispositivos
  console.log('\n📱 Teste 2: Status dos dispositivos');
  const devicesStatus = await testApi('/devices/status');
  if (devicesStatus.success) {
    console.log('✅ Status dos dispositivos carregado:', devicesStatus.data);
  } else {
    console.log('❌ Erro ao carregar status dos dispositivos:', devicesStatus.error);
  }

  // Teste 3: Todos os dados de produção
  console.log('\n📈 Teste 3: Todos os dados de produção');
  const allData = await testApi('/data/all');
  if (allData.success) {
    console.log('✅ Todos os dados carregados:', allData.data);
  } else {
    console.log('❌ Erro ao carregar todos os dados:', allData.error);
  }

  // Teste 4: Dados de produção por dispositivo (se houver device_id)
  console.log('\n🔧 Teste 4: Dados de produção por dispositivo');
  const deviceData = await testApi('/data/device?device_id=test');
  if (deviceData.success) {
    console.log('✅ Dados do dispositivo carregados:', deviceData.data);
  } else {
    console.log('❌ Erro ao carregar dados do dispositivo:', deviceData.error);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Verificar se está autenticado
function checkAuth() {
  const token = localStorage.getItem('mobile_api_token');
  if (!token) {
    console.log('⚠️ Não há token de autenticação. Faça login primeiro.');
    console.log('💡 Dica: Acesse a aplicação e faça login antes de executar os testes.');
    return false;
  }
  console.log('🔐 Token encontrado, prosseguindo com os testes...');
  return true;
}

// Executar testes se autenticado
if (checkAuth()) {
  runTests();
} else {
  console.log('❌ Testes cancelados - autenticação necessária');
} 