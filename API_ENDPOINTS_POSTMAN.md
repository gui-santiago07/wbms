# 🚀 **Endpoints da API Mobile Dashboard - Postman**

## 📋 **Configuração Base**

### **URL Base**
```
http://localhost:8090/api
```

### **Headers Padrão**
```
Content-Type: application/json
Authorization: Bearer {seu_token_jwt}
```

---

## 🔐 **1. Autenticação**

### **Login**
```
POST /user/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "ABB Pederneiras",
  "password": "sua_senha"
}
```

**Resposta Esperada:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "nome": "s:15:\"ABB Pederneiras\";"
}
```

---

## 📊 **2. Dashboard - Detalhes do Turno**

### **GET Detalhes do Turno**
```
GET /shifts/turno_1/details
```

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json
```

**Resposta Esperada:**
```json
{
  "shift": {
    "id": "turno_1",
    "name": "TURNO 1",
    "startTime": "08:00:00",
    "endTime": "16:00:00"
  },
  "operator": {
    "id": "1",
    "name": "s:15:\"ABB Pederneiras\";",
    "role": "Operador"
  },
  "product": {
    "id": "1",
    "name": "GUARANA 500ml",
    "sku": "240042176"
  },
  "productionOrder": {
    "id": "520741-8",
    "totalQuantity": 1241,
    "shiftTarget": 240,
    "name": "Ordem 520741-8",
    "dueDate": "2024-01-20"
  },
  "line": {
    "id": "line-1",
    "name": "ENVASE 520741-8",
    "code": "ENVASE-1"
  }
}
```

---

## 📈 **3. Dashboard - Status em Tempo Real**

### **GET Status do Turno**
```
GET /shifts/turno_1/status?history_range=4h
```

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json
```

**Parâmetros de Query:**
- `history_range`: `1h`, `4h`, `8h` (padrão: `4h`)

**Resposta Esperada:**
```json
{
  "machineStatus": "RUNNING",
  "production": {
    "actual": 240,
    "target": 300,
    "good": 240,
    "rejects": 0
  },
  "oee": {
    "main": 80.1,
    "availability": 85.2,
    "performance": 92.1,
    "quality": 100.0
  },
  "timeMetrics": {
    "timeInShift": 28800,
    "totalShiftTime": 28800,
    "avgSpeed": 120,
    "instantSpeed": 125
  },
  "historicalPerformance": {
    "dataPoints": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "oee": 80.1,
        "production": 240
      }
    ]
  }
}
```

---

## 🎯 **4. Eventos do Operador**

### **POST Registrar Evento**
```
POST /shifts/turno_1/events
```

**Headers:**
```
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json
```

**Body:**
```json
{
  "eventType": "DOWN"
}
```

**Tipos de Evento Disponíveis:**
- `DOWN` - Parada da máquina
- `SETUP` - Setup/Configuração
- `PAUSE` - Pausa
- `RUN` - Iniciar produção
- `ASSISTANCE_REQUEST` - Solicitar assistência

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Evento registrado com sucesso",
  "eventId": "evt_123456789"
}
```

---

## 🧪 **5. Coleção Postman**

### **Importe esta coleção no Postman:**

```json
{
  "info": {
    "name": "API Mobile Dashboard",
    "description": "Endpoints para teste da API Mobile Dashboard"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"ABB Pederneiras\",\n  \"password\": \"sua_senha\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/user/login",
          "host": ["{{baseUrl}}"],
          "path": ["user", "login"]
        }
      }
    },
    {
      "name": "2. Detalhes do Turno",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/shifts/turno_1/details",
          "host": ["{{baseUrl}}"],
          "path": ["shifts", "turno_1", "details"]
        }
      }
    },
    {
      "name": "3. Status em Tempo Real",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/shifts/turno_1/status?history_range=4h",
          "host": ["{{baseUrl}}"],
          "path": ["shifts", "turno_1", "status"],
          "query": [
            {
              "key": "history_range",
              "value": "4h"
            }
          ]
        }
      }
    },
    {
      "name": "4. Registrar Evento DOWN",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"eventType\": \"DOWN\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/shifts/turno_1/events",
          "host": ["{{baseUrl}}"],
          "path": ["shifts", "turno_1", "events"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8090/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 🔧 **6. Variáveis de Ambiente Postman**

### **Configure estas variáveis:**

| Variável | Valor |
|----------|-------|
| `baseUrl` | `http://localhost:8090/api` |
| `token` | (será preenchido automaticamente após login) |

### **Script de Teste para Login (Automático):**
```javascript
// Adicione este script no teste do endpoint de login
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

---

## 🚨 **7. Possíveis Erros e Soluções**

### **Erro 404 - Endpoint não encontrado**
- Verifique se o servidor está rodando na porta 8090
- Confirme se os endpoints estão implementados no backend
- Teste: `curl http://localhost:8090/api/health`

### **Erro 401 - Não autorizado**
- Token JWT inválido ou expirado
- Faça login novamente para obter novo token

### **Erro 400 - Dados inválidos**
- Verifique o formato do JSON enviado
- Confirme se todos os campos obrigatórios estão presentes

### **Erro 500 - Erro interno do servidor**
- Verifique os logs do backend
- Confirme se o banco de dados está acessível

---

## 📝 **8. Ordem de Teste Recomendada**

1. **Login** - Obter token JWT
2. **Detalhes do Turno** - Verificar estrutura de resposta
3. **Status em Tempo Real** - Verificar dados de produção
4. **Registrar Evento** - Testar funcionalidade de eventos

---

## ✅ **9. Checklist de Teste**

- [ ] Servidor rodando na porta 8090
- [ ] Login retorna token JWT válido
- [ ] Detalhes do turno retorna estrutura correta
- [ ] Status em tempo real retorna dados de produção
- [ ] Eventos são registrados com sucesso
- [ ] Headers de autorização funcionam
- [ ] Parâmetros de query são aceitos
- [ ] Tratamento de erros funciona corretamente 