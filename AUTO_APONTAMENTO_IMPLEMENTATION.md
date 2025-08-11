# Implementação do Sistema de Auto-Apontamento

## Visão Geral

Esta implementação adiciona funcionalidades completas de auto-apontamento ao sistema OEE Factory Monitor, seguindo os requisitos especificados na documentação da API.

## Componentes Implementados

### 1. Serviço de Auto-Apontamento (`services/autoApontamentoService.ts`)

**Funcionalidades:**
- Consulta de todos os dispositivos
- Verificação de status de linha
- Listagem de produtos por linha
- Início e parada de produção
- Obtenção de detalhes de produtos
- Cálculo de dados de produção em tempo real

**Endpoints utilizados:**
- `GET /api/wbms/auto-apontamento/all` - Consultar todos os dispositivos
- `GET /api/wbms/auto-apontamento/{linha}/status` - Verificar status da linha
- `GET /api/wbms/auto-apontamento/{linha}/products` - Listar produtos da linha
- `POST /api/wbms/auto-apontamento/{linha}/start-production` - Iniciar produção (body mínimo: `{ "product_key": string, "shift_id": "WBMS-001" | opcional, "run_reason_text"?: string }`)
- `POST /api/wbms/auto-apontamento/{linha}/stop-production` - Parar produção (sem body ou informando motivo via `{ type: "STOP"|"SETUP"|"STANDBY", description_text? }` ou `{ category: "down_enum", event_key, description_text? }`)

## Guia de uso (fluxo correto)

1) Buscar produtos da linha: `GET /api/wbms/auto-apontamento/{client_line_key}/products` → obter `product_key`.
2) Iniciar produção: `POST /api/wbms/auto-apontamento/{client_line_key}/start-production` com body `{ product_key, shift_id?, run_reason_text? }`.
3) Validar status: `GET /api/wbms/auto-apontamento/{client_line_key}/status` → `has_active_production: true`.
4) Parar produção: `POST /api/wbms/auto-apontamento/{client_line_key}/stop-production` sem body ou com motivo usando uma das duas formas acima.
- `GET /api/pegar-produto-por-id?product_id={id}` - Obter detalhes do produto

### 2. Modal de Setup (`components/features/modals/SetupModal.tsx`)

**Características:**
- Baseado na estrutura do modal de filtros da timeline
- Seletores de Planta, Setor e Linha (seleção única)
- Campo de busca e seleção de produtos
- Responsivo para tablets
- Botão "Iniciar Setup" que chama a API de início de produção
- Armazenamento de dados em cache no localStorage

### 3. Hooks Personalizados

#### `useProductionStatusCheck` (`hooks/useProductionStatusCheck.ts`)
- Verifica o status de produção após o login
- Determina se precisa de setup ou se há produção ativa
- Gerencia múltiplas linhas (seleção automática se apenas uma)

#### `useProductionDataPolling` (`hooks/useProductionDataPolling.ts`)
- Atualiza dados de produção em tempo real
- Polling a cada 5 segundos
- Gerencia intervalos automaticamente

### 4. Store Atualizado (`store/useProductionStore.ts`)

**Novas propriedades:**
- `showSetupModal`: Controla exibição do modal de setup
- `setupData`: Dados do setup atual (planta, setor, linha, produto)
- `productionData`: Dados de produção em tempo real (target, actual, completion, etc.)

**Novos métodos:**
- `setShowSetupModal()`: Controla visibilidade do modal
- `handleSetupComplete()`: Processa conclusão do setup
- `loadProductionData()`: Carrega dados de produção
- `checkProductionStatus()`: Verifica status de produção

### 5. Componente de Mensagem (`components/features/dashboard/NoActiveProductionMessage.tsx`)

- Exibido quando não há produção ativa
- Botão para iniciar setup
- Interface amigável e intuitiva

## Fluxo de Funcionamento

### 1. Verificação de Status no Login
```
Login → Verificar linhas disponíveis → 
Se apenas uma linha: Verificar status diretamente
Se múltiplas linhas: Usar primeira linha como padrão
```

### 2. Decisão de Setup
```
Status da linha:
- needs_setup = true → Abrir modal de setup
- has_active_production = true → Carregar dados de produção
- Caso contrário → Abrir modal de setup
```

### 3. Modal de Setup
```
1. Carregar plantas disponíveis
2. Ao selecionar planta → Carregar setores
3. Ao selecionar setor → Carregar linhas
4. Ao selecionar linha → Carregar produtos
5. Buscar e selecionar produto
6. Clicar "Iniciar Setup" → Chamar API de início de produção
7. Armazenar dados em cache
8. Fechar modal e carregar dados de produção
```

### 4. Exibição de Dados de Produção
```
Dados calculados em tempo real:
- Target: nominal_qty_max do produto
- Actual: current_count da linha
- Completion: (Actual / Target) × 100%
- Good Parts: total_good_count do turno
- Good Parts %: (Good Parts / Actual) × 100%
```

## Integração com Componentes Existentes

### OeeScreen.tsx
- Integração com hooks de verificação de status
- Polling automático de dados de produção
- Exibição condicional de mensagem ou dados de produção
- Modal de setup integrado

### OeeView.tsx
- Dados de produção reais em vez de valores zerados
- Formatação de números com separadores de milhares
- Informações do produto selecionado nos detalhes
- Barra de progresso com limite de 100%

## Responsividade

- Modal de setup responsivo para tablets
- Grid adaptativo para diferentes tamanhos de tela
- Componentes otimizados para dispositivos móveis

## Tratamento de Erros

- Tratamento silencioso de erros de API
- Fallbacks para dados padrão em caso de falha
- Mensagens de erro amigáveis no modal de setup
- Logs detalhados para debugging

## Cache e Persistência

- Dados de setup armazenados no localStorage
- Persistência de configurações entre sessões
- Recuperação automática de dados após refresh

## Segurança

- Autenticação Bearer token em todas as requisições
- Validação de dados antes de enviar para API
- Sanitização de inputs do usuário

## Performance

- Polling otimizado (5 segundos)
- Carregamento lazy de dados
- Limpeza automática de intervalos
- Cache inteligente de dados

## Próximos Passos

1. **Seleção de Múltiplas Linhas**: Implementar modal de seleção quando há múltiplas linhas
2. **Histórico de Produção**: Adicionar visualização de histórico
3. **Notificações**: Sistema de notificações para eventos de produção
4. **Relatórios**: Geração de relatórios de produção
5. **Configurações Avançadas**: Configurações de polling e timeouts 