# Integração com Backend de Produção Automática

## 📋 Resumo das Mudanças

Este documento descreve as mudanças implementadas para integrar o dashboard OEE com o backend de produção automática, substituindo a consulta direta ao WBMS.

## 🔄 Principais Alterações

### 1. Novo Serviço: `AutomaticProductionService`

**Arquivo:** `services/automaticProductionService.ts`

- **Funcionalidades implementadas:**
  - `getProductionByLine()` - Buscar dados de produção por linha
  - `getProductionByDevice()` - Buscar dados de produção por dispositivo
  - `getAllProductionData()` - Buscar todos os dados de produção
  - `getDevicesStatus()` - Buscar status dos dispositivos
  - `finalizeShift()` - Finalizar turno
  - `getLiveProductionData()` - Buscar dados em tempo real
  - `convertToLiveMetrics()` - Converter dados para formato LiveMetrics
  - `getOeeHistory()` - Buscar histórico OEE

### 2. Atualização do Store de Produção

**Arquivo:** `store/useProductionStore.ts`

- **Métodos atualizados:**
  - `fetchLiveData()` - Agora usa `AutomaticProductionService` em vez do WBMS
  - `fetchOeeHistory()` - Usa dados do backend para histórico OEE
  - `loadProductionDetails()` - Carrega detalhes de produção do backend
  - `initializeDashboard()` - Inicializa dashboard com dados do backend

### 3. Configuração do Vercel

**Arquivo:** `vercel.json`

- Adicionadas rotas para `/automatic-production/*`
- Configurados headers CORS para as novas rotas

## 🚀 Como Funciona

### Fluxo de Dados

1. **Inicialização do Dashboard:**
   ```
   OeeScreen → initializeDashboard() → AutomaticProductionService
   ```

2. **Polling de Dados em Tempo Real:**
   ```
   useLiveDataPolling → fetchLiveData() → getLiveProductionData()
   ```

3. **Carregamento de Production Details:**
   ```
   useProductionDetails → loadProductionDetails() → getLiveProductionData()
   ```

4. **Histórico OEE:**
   ```
   OeeTrendChart → fetchOeeHistory() → getOeeHistory()
   ```

### APIs Utilizadas

#### 1. Dados de Produção por Linha
```
GET /automatic-production/data?client_line_key={lineId}
```

#### 2. Dados de Produção por Dispositivo
```
GET /automatic-production/data/device?device_id={deviceId}
```

#### 3. Todos os Dados de Produção
```
GET /automatic-production/data/all
```

#### 4. Status dos Dispositivos
```
GET /automatic-production/devices/status
```

#### 5. Finalizar Turno
```
POST /automatic-production/shifts/finalize
Body: { shift_number_key: string }
```

## 📊 Estrutura de Dados

### ProductionShift
```typescript
interface ProductionShift {
  id: string;
  shift_id: string;
  start_time: string;
  end_time: string | null;
  total_count: number;
  good_count: number;
  reject_count: number;
  run_time: number; // em segundos
  down_time: number; // em segundos
  status: 'active' | 'finished';
}
```

### DeviceStatus
```typescript
interface DeviceStatus {
  id: string;
  name: string;
  asset_id: string;
  line?: { line: string };
  last_status: 'running' | 'stopped' | 'unknown';
  last_count: number;
  last_check: string;
  is_online: boolean;
}
```

## 🔧 Cálculos Implementados

### Métricas OEE
- **Availability:** `(run_time / (run_time + down_time)) * 100`
- **Quality:** `(good_count / total_count) * 100`
- **Performance:** Baseada em velocidade média vs. velocidade padrão
- **OEE:** `(availability * performance * quality) / 10000`

### Status da Máquina
- **RUNNING:** `run_time > 0` e `down_time <= run_time`
- **DOWN:** `down_time > run_time`
- **STANDBY:** Sem dados de produção

## 🎯 Componentes Afetados

### 1. OeeScreen.tsx
- Usa dados do backend para métricas de produção
- Carrega Production Details do backend
- Exibe histórico OEE do backend

### 2. ProductionDetailsCard.tsx
- Exibe dados de produção carregados do backend
- Mostra informações do turno ativo

### 3. OeeTrendChart.tsx
- Busca histórico OEE do backend
- Permite filtros por período (1h, 4h, 8h, 24h, 7d)

## 🔍 Logs e Debug

### Logs Implementados
- Inicialização do dashboard
- Busca de dados em tempo real
- Carregamento de Production Details
- Histórico OEE
- Erros de conexão (tratamento silencioso)

### Exemplo de Log
```
🔄 Store: Buscando dados em tempo real do backend...
📊 Dados de produção por linha: { data: [...] }
✅ Store: Dados em tempo real recebidos do backend
```

## 🚨 Tratamento de Erros

### Estratégia Implementada
- **Tratamento Silencioso:** Erros não são exibidos na interface
- **Logs Detalhados:** Erros são logados no console para debug
- **Fallbacks:** Dados padrão são usados quando APIs falham
- **Retry Automático:** Polling continua mesmo com erros

### Exemplo de Fallback
```typescript
if (!productionData) {
  return {
    total: 0,
    good: 0,
    rejects: 0,
    oee: 0,
    // ... outros valores padrão
  };
}
```

## 🔄 Compatibilidade

### Mantida Compatibilidade com:
- Sistema de autenticação existente
- Configuração de dispositivos
- Interface de usuário
- Componentes de controle de máquina

### Novas Funcionalidades:
- Dados de produção em tempo real do backend
- Histórico OEE baseado em dados reais
- Production Details dinâmicos
- Status de dispositivos

## 📝 Próximos Passos

### Melhorias Sugeridas:
1. **Cache de Dados:** Implementar cache para reduzir chamadas à API
2. **WebSocket:** Substituir polling por WebSocket para dados em tempo real
3. **Filtros Avançados:** Adicionar filtros por data, turno, produto
4. **Exportação:** Permitir exportação de dados de produção
5. **Alertas:** Implementar sistema de alertas baseado em métricas

### Otimizações:
1. **Lazy Loading:** Carregar dados sob demanda
2. **Debounce:** Reduzir frequência de atualizações
3. **Compressão:** Comprimir dados transferidos
4. **CDN:** Usar CDN para assets estáticos

## 🎉 Benefícios Alcançados

1. **Dados Reais:** Dashboard agora usa dados reais de produção
2. **Performance:** Redução de dependências externas
3. **Confiabilidade:** Dados centralizados no backend
4. **Escalabilidade:** Arquitetura preparada para crescimento
5. **Manutenibilidade:** Código mais limpo e organizado 