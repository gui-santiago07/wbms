// Script para limpar dados inválidos do localStorage
// Execute este script no console do navegador para limpar dados corrompidos

console.log('🧹 Iniciando limpeza de dados inválidos...');

// Lista de chaves que podem conter dados inválidos
const keysToCheck = [
  'setup_data',
  'selected_product',
  'device_settings',
  'production_store'
];

// Verificar e limpar cada chave
keysToCheck.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      
      // Verificar se há dados inválidos (como clientLineKey = "2")
      let hasInvalidData = false;
      
      if (parsed.line === '2' || parsed.line === 'undefined' || parsed.line === 'null') {
        console.warn(`⚠️ Dados inválidos encontrados em ${key}:`, parsed);
        hasInvalidData = true;
      }
      
      if (parsed.clientLineKey === '2' || parsed.clientLineKey === 'undefined' || parsed.clientLineKey === 'null') {
        console.warn(`⚠️ Dados inválidos encontrados em ${key}:`, parsed);
        hasInvalidData = true;
      }
      
      if (hasInvalidData) {
        localStorage.removeItem(key);
        console.log(`✅ Chave ${key} removida do localStorage`);
      } else {
        console.log(`✅ Chave ${key} parece válida`);
      }
    } else {
      console.log(`ℹ️ Chave ${key} não encontrada no localStorage`);
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar chave ${key}:`, error);
    // Se não consegue fazer parse, provavelmente está corrompida
    localStorage.removeItem(key);
    console.log(`✅ Chave ${key} removida por estar corrompida`);
  }
});

console.log('✅ Limpeza concluída! Recarregue a página para aplicar as mudanças.'); 