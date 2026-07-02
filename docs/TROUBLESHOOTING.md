# 🔧 GUIA DE TROUBLESHOOTING — Chef IA Studio

## ❌ Servidor não sobe (`npm start`)

### Erro: `EADDRINUSE: address already in use :::3000`
**Causa:** Porta 3000 já está em uso
```bash
# Solução 1: Matar processo anterior
pkill -f "node server.js"

# Solução 2: Usar porta diferente
PORT=3001 npm start

# Solução 3: Verificar qual processo usa porta 3000
lsof -i :3000
```

### Erro: `Cannot find module '@google/generative-ai'`
**Causa:** Dependências não instaladas
```bash
npm install
```

### Erro: `Unexpected token <` ao tentar POST
**Causa:** Servidor retornando HTML em vez de JSON (erro ao iniciar)
```bash
# Verificar se há erro no server.js
npm start 2>&1 | head -20
```

---

## ❌ Arquivos não carregam (`404 Not Found`)

### CSS não carrega (`css/style.css`)
```bash
# Verificar se arquivo existe
ls -la public/css/style.css

# Se não existir, mover do lugar certo
mv style.css public/css/style.css
```

### JS não carrega (`js/app.js`)
```bash
# Verificar se arquivo existe
ls -la public/js/app.js

# Se não existir, mover
mv script.js public/js/app.js
```

### Solução rápida: Reiniciar servidor
```bash
pkill -f "node server.js"
npm start
```

---

## ❌ API responde com erro

### Erro: `"models/gemini-pro is not found"`
**Causa:** Modelo legado descontinuado
**Status:** ⚠️ Esperado com `@google/generative-ai` v0.24.1

**Solução:**
```bash
# Atualizar para novo SDK
npm uninstall @google/generative-ai
npm install @google/genai

# Atualizar modelo em server.js
# De: "gemini-pro"
# Para: "gemini-3.5-flash"

npm start
```

### Erro: `APIError: API key not valid`
**Causa:** Chave de API inválida ou expirada
```bash
# 1. Regenerar chave em https://ai.google.dev/
# 2. Atualizar .env
GEMINI_API_KEY=nova_chave_aqui

# 3. Reiniciar
npm start
```

### Erro: `Failed to fetch`
**Causa:** CORS, rede ou backend fora do ar
```bash
# Verificar se servidor está rodando
ps aux | grep "node server"

# Se não estiver, iniciar
npm start

# Se estiver, verificar logs
curl -X POST http://localhost:3000/gerar-cardapio \
  -H "Content-Type: application/json" \
  -d '{"prompt":"teste"}'
```

---

## ❌ Frontend não responde

### Formulário não funciona
```bash
# 1. Abrir DevTools (F12)
# 2. Console: Ver se há erro de JavaScript
# 3. Network: Verificar request/response do POST

# 4. Verificar IDs no HTML
grep 'id="tipo"' public/index.html  # Deve encontrar
grep 'id="btnGerar"' public/index.html  # Deve encontrar

# 5. Verificar se app.js carregou
# DevTools → Console → gerarTudo() deve estar definida
```

### Botão clica mas nada acontece
```bash
# Verificar console para erros
# F12 → Console → Ver logs

# Verificar se POST está sendo feito
# F12 → Network → POST /gerar-cardapio

# Se não aparecer nada:
# 1. Verificar se servidor está rodando
# 2. Verificar se URL está correta (http://localhost:3000)
# 3. Verificar se .env tem chave de API
```

---

## ✅ Testes Rápidos

### Teste 1: Servidor online?
```bash
curl -s http://localhost:3000/ | head -5
# Deve retornar HTML do index.html
```

### Teste 2: CSS carregando?
```bash
curl -I http://localhost:3000/css/style.css
# Deve retornar: HTTP/1.1 200 OK
```

### Teste 3: JS carregando?
```bash
curl -I http://localhost:3000/js/app.js
# Deve retornar: HTTP/1.1 200 OK
```

### Teste 4: API respondendo?
```bash
curl -X POST http://localhost:3000/gerar-cardapio \
  -H "Content-Type: application/json" \
  -d '{"prompt":"teste"}' | python3 -m json.tool
# Deve retornar JSON com ok, error ou plano
```

---

## 📋 Checklist de Debug

- [ ] `npm start` sobe sem erro?
- [ ] `curl http://localhost:3000/` retorna HTML?
- [ ] Arquivo CSS existe em `public/css/style.css`?
- [ ] Arquivo JS existe em `public/js/app.js`?
- [ ] `.env` tem `GEMINI_API_KEY` preenchido?
- [ ] Browser abre `http://localhost:3000` sem erro?
- [ ] DevTools console mostra algum erro vermelho?
- [ ] POST `/gerar-cardapio` retorna JSON válido?
- [ ] `legacy/simple-current` tem backup dos arquivos?
- [ ] `.gitignore` tem `.env` listado?

---

## 🆘 Não resolveu? Próximos passos

1. **Verificar logs completos:**
   ```bash
   npm start 2>&1 | tee /tmp/chef-ia-debug.log
   cat /tmp/chef-ia-debug.log
   ```

2. **Verificar estrutura:**
   ```bash
   find . -type f -name "*.js" -o -name "*.css" | grep -v node_modules | sort
   ```

3. **Reset completo:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

4. **Voltar ao backup:**
   ```bash
   cp legacy/simple-current/* .
   npm start
   ```

---

## 📞 Informações Úteis

- **Documentação Gemini**: https://ai.google.dev/
- **Documentação Express**: https://expressjs.com/
- **MDN JSON**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON

---

**Última atualização:** 2026-06-14  
**Versão:** 1.0.0
