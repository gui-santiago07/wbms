# 🐛 **Sistema de Debug - Instruções de Uso**

## 📋 **O que foi implementado**

### **1. Logs Detalhados em Todas as Requisições**
- ✅ **ApiClient**: Logs de todas as requisições HTTP (GET/POST)
- ✅ **DashboardService**: Logs específicos do dashboard
- ✅ **Store**: Logs de inicialização e polling
- ✅ **AuthContext**: Logs de autenticação

### **2. Debug Panel Visual**
- ✅ **Painel flutuante** no canto inferior direito
- ✅ **Intercepta todos os console.log/error/warn**
- ✅ **Auto-scroll** para acompanhar logs em tempo real
- ✅ **Limpeza de logs** e controle de visibilidade

---

## 🚀 **Como Usar**

### **1. Acesse a Aplicação**
```
http://localhost:5173 (ou sua porta do Vite)
```

### **2. Abra o Debug Panel**
- Clique no botão **🐛 Debug** no canto inferior direito
- O painel mostrará todos os logs em tempo real

### **3. Faça Login**
- Use as credenciais de teste
- Observe os logs de autenticação no painel

### **4. Navegue para o Dashboard**
- Vá para `/oee` ou `/dashboard`
- Observe os logs de inicialização

---

## 📊 **Logs que Você Verá**

### **🔧 Inicialização**
```
🔧 ApiClient inicializado: { baseUrl: "http://localhost:8090/api", hasToken: false }
```

### **🔐 Login**
```
🚀 POST http://localhost:8090/api/user/login
📋 Headers: { "Content-Type": "application/json" }
📦 Body: { "username": "ABB Pederneiras", "password": "123456" }
📊 Login Response Status: 200
✅ POST http://localhost:8090/api/user/login (200)
🔐 Token salvo: { tokenPreview: "eyJ0eXAiOiJKV1QiLCJ...", nome: "ABB Pederneiras" }
```

### **📊 Dashboard**
```
🏪 Store: Iniciando dashboard...
🚀 Iniciando carregamento do dashboard...
🔍 Buscando detalhes do turno: turno_1
📊 Buscando status do turno: { shiftId: "turno_1", historyRange: "4h" }
🚀 GET http://localhost:8090/api/shifts/turno_1/details
🚀 GET http://localhost:8090/api/shifts/turno_1/status?history_range=4h
```

### **❌ Erros (se houver)**
```
❌ GET http://localhost:8090/api/shifts/turno_1/details - ERRO
🔍 Error Details: Error: Failed to fetch
📊 Status: 404
📋 Status Text: Not Found
📄 Response Text: {"error":"Endpoint not found"}
```

---

## 🔍 **Como Identificar Problemas**

### **1. Erro 404 - Endpoint não encontrado**
```
❌ GET http://localhost:8090/api/shifts/turno_1/details - ERRO
📊 Status: 404
```

**Solução:**
- Verifique se o servidor está rodando na porta 8090
- Confirme se os endpoints estão implementados no backend
- Teste: `curl http://localhost:8090/api/health`

### **2. Erro 401 - Não autorizado**
```
❌ GET http://localhost:8090/api/shifts/turno_1/details - ERRO
📊 Status: 401
```

**Solução:**
- Token JWT inválido ou expirado
- Faça login novamente

### **3. Erro 500 - Erro interno do servidor**
```
❌ GET http://localhost:8090/api/shifts/turno_1/details - ERRO
📊 Status: 500
📄 Response Text: {"error":"Database connection failed"}
```

**Solução:**
- Verifique os logs do backend
- Confirme se o banco de dados está acessível

### **4. Erro de Rede**
```
❌ GET http://localhost:8090/api/shifts/turno_1/details - ERRO
🔍 Error Details: TypeError: Failed to fetch
```

**Solução:**
- Servidor não está rodando
- Problema de CORS
- Firewall bloqueando a conexão

---

## 🛠️ **Comandos para Testar**

### **1. Verificar se o servidor está rodando**
```bash
curl http://localhost:8090/api/health
```

### **2. Testar login**
```bash
curl -X POST http://localhost:8090/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ABB Pederneiras","password":"123456"}'
```

### **3. Testar endpoint do dashboard (com token)**
```bash
curl -X GET http://localhost:8090/api/shifts/turno_1/details \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

---

## 📱 **Controles do Debug Panel**

### **Botões Disponíveis:**
- **🐛 Debug (X)** - Mostra/oculta o painel
- **Auto-scroll** - Mantém o scroll automático
- **Clear** - Limpa todos os logs
- **✕** - Fecha o painel

### **Cores dos Logs:**
- **🔵 Azul** - Logs informativos
- **🟡 Amarelo** - Avisos
- **🔴 Vermelho** - Erros
- **🟢 Verde** - Sucessos

---

## 🎯 **Checklist de Debug**

- [ ] Debug Panel está visível
- [ ] Logs aparecem em tempo real
- [ ] Login funciona e mostra token
- [ ] Dashboard tenta carregar dados
- [ ] Erros são mostrados claramente
- [ ] URLs das requisições estão corretas
- [ ] Headers de autorização estão presentes
- [ ] Respostas do servidor são legíveis

---

## 🚨 **Problemas Comuns**

### **1. Debug Panel não aparece**
- Verifique se o componente foi importado corretamente
- Confirme se não há erros de JavaScript no console

### **2. Logs não aparecem**
- Verifique se o console do navegador está aberto
- Confirme se não há bloqueadores de anúncios interferindo

### **3. Logs muito lentos**
- O painel mantém apenas os últimos 100 logs
- Use o botão "Clear" para limpar logs antigos

---

## 📞 **Próximos Passos**

1. **Abra a aplicação** e o Debug Panel
2. **Faça login** e observe os logs
3. **Navegue para o dashboard** e veja os erros
4. **Compare com os endpoints** da documentação
5. **Teste no Postman** para confirmar o problema
6. **Corrija o backend** conforme necessário

O sistema de debug agora mostrará **exatamente** o que está acontecendo em cada requisição! 🎉 