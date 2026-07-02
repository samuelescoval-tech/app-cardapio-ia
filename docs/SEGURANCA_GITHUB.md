# 🛡️ CHECKLIST SEGURANÇA — Antes de GitHub Push

**Última Verificação**: 2 de Julho de 2026  
**Status**: PRONTO PARA PUSH PRIVADO ✅

---

## 🔒 ITENS CRÍTICOS (DEVE ESTAR 100% ✓)

### Credentials & Secrets
- [ ] `.env` arquivo EXISTE no `.gitignore`
- [ ] `.env` arquivo NÃO foi commitado
- [ ] `GEMINI_API_KEY` não aparece em nenhum arquivo `.js`, `.json`, ou `.md`
- [ ] Nenhuma senha hardcoded em código
- [ ] Nenhum token pessoal em arquivos

**Como Verificar**:
```bash
# Buscar references a GEMINI_API_KEY
grep -r "sk-" --include="*.js" --include="*.json" public/ src/

# Se retornar algo → NÃO FAZ PUSH ATÉ REMOVER

# Verificar .gitignore
cat .gitignore | grep ".env"

# Se vazio → ADICIONAR .env ao .gitignore
echo ".env" >> .gitignore
```

### Dependencies
- [ ] `node_modules/` está em `.gitignore`
- [ ] `package-lock.json` SERÁ commitado
- [ ] Nenhuma library maliciosa em package.json
- [ ] Versões pinadas onde relevante

**Como Verificar**:
```bash
# Confirmar node_modules não será commitado
git status | grep node_modules  # Não deve aparecer

# Confirmar package-lock.json será commitado
git add package-lock.json
git status  # Deve aparecer como "new file"
```

### Source Code
- [ ] Nenhum arquivo `legacy/` será commitado (ou documentar propósito)
- [ ] Nenhum arquivo `.DS_Store` (macOS)
- [ ] Nenhum arquivo `*.log`
- [ ] Nenhuma senha em comentários

**Como Verificar**:
```bash
# Ver o que será commitado
git status

# Preview completo
git add .
git status --short

# Se algo suspeito aparecer → NÃO FAZER COMMIT
# Remover com: git reset <file>
```

---

## ⚠️ RECOMENDAÇÕES (DEVE TER 80%+)

### Documentation
- [x] README.md atualizado com stack
- [x] docs/FASE1_COMPLETA.md criado
- [x] docs/FASE2_QUICKSTART.md criado
- [ ] CONTRIBUIR.md (opcional, para colaboradores)
- [ ] LICENSE (recomendado: MIT)

### Code Quality
- [ ] Nenhum console.log() em produção (ok para agora)
- [ ] Nenhum `TODO` ou `FIXME` critical
- [ ] Código comentado removido
- [ ] Indentação consistente

### Configuration
- [ ] `.env.example` com template (SEM valores reais)
- [ ] `package.json` scripts atualizados
- [ ] PORT e variáveis configuráveis

**Como Criar .env.example**:
```bash
cat > .env.example << 'EOF'
# Google Gemini API
GEMINI_API_KEY=seu_chave_aqui

# Server
PORT=3000

# Environment
NODE_ENV=development
EOF
```

---

## 🚀 PASSO A PASSO SEGURO

### 1️⃣ Preparar Repositório (5 min)
```bash
cd ~/Documentos/pasta\ chafe\ ia/app-cardapio-ia

# Verificar .gitignore
cat .gitignore

# Se não tiver .env, adicionar
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore
echo ".DS_Store" >> .gitignore
```

### 2️⃣ Escanear Segurança (5 min)
```bash
# Buscar secrets
grep -r "GEMINI_API_KEY" public/ src/ --include="*.js"
grep -r "sk-" . --include="*.js" --include="*.json"
grep -r "mongodb+srv" . --include="*.js"

# Se retornar algo → REMOVE ANTES DE CONTINUAR
```

### 3️⃣ Criar .env.example (2 min)
```bash
cat > .env.example << 'EOF'
GEMINI_API_KEY=sua_chave_aqui
PORT=3000
NODE_ENV=development
EOF
```

### 4️⃣ Preview do Push (3 min)
```bash
git init  # Se não feito
git add .
git status --short

# Verificar lista:
# - Deve incluir: public/, src/, server.js, package.json, docs/
# - NÃO deve incluir: .env, node_modules/, *.log
# - Se tudo OK → continua
```

### 5️⃣ Primeiro Commit (2 min)
```bash
git config user.email "seu_email@github.com"
git config user.name "Seu Nome"

git commit -m "feat: FASE 1 completa - Histórico local com localStorage

- Implementado storage.service.js com 7 funções localStorage
- Integrado ao app.js com renderização de cards
- Adicionado UI com grid responsivo e CSS novos
- Testes validados: save, render, load, delete, clear
- Documentação: FASE1_COMPLETA.md
- Próxima: FASE 2 - PDF Export"
```

### 6️⃣ Setup GitHub (2 min)
```bash
# Se repo não existe em GitHub:
# 1. Criar em GitHub.com → New Repository
# 2. Nome: app-cardapio-ia
# 3. Selecionar: PRIVATE
# 4. NÃO inicializar com README

# Adicionar remote
git remote add origin https://github.com/SEU_USER/app-cardapio-ia.git

# Renomear branch
git branch -M main

# Push
git push -u origin main
```

### 7️⃣ Verificar Push (2 min)
```bash
# GitHub.com → Seu Repo → deve aparecer
# - 10+ arquivos commitados
# - .env NÃO deve aparecer
# - node_modules/ NÃO deve aparecer
```

---

## 🚨 SE ALGO DEU ERRADO

### Problema: Commitou .env
```bash
# ⚠️ REMOVER IMEDIATAMENTE
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "fix: remover .env do versionamento"

# DEPOIS: Rotacionar GEMINI_API_KEY no Google Console
# (pois foi exposto, mesmo que privado no GitHub)
```

### Problema: Commitou node_modules
```bash
git rm -r --cached node_modules/
echo "node_modules/" >> .gitignore
git commit -m "fix: remover node_modules do versionamento"
```

### Problema: Quer deletar último commit
```bash
git reset --soft HEAD~1  # Desfaz commit, mantém files
git reset --hard HEAD~1  # Desfaz tudo (⚠️ CUIDADO)
```

---

## 📋 Checklist Final (Antes de Push)

Rodar AGORA e marcar ✓:

```bash
# 1. Secrets check
✓ grep -r "GEMINI_API_KEY" public/ src/
✓ grep -r "sk-" . --include="*.js"

# 2. .gitignore check
✓ cat .gitignore | grep ".env"
✓ cat .gitignore | grep "node_modules"

# 3. Files check
✓ ls -la | grep ".env"  # NÃO deve existir localmente visível
✓ git status | grep node_modules  # Não deve aparecer

# 4. Commit preview
✓ git status --short

# 5. .env.example check
✓ ls .env.example  # Deve existir
✓ cat .env.example | grep GEMINI  # Deve ter template

# Tudo ✓ → PRONTO PARA PUSH
```

---

## 🎯 Resumo Recomendação

| Aspecto | Recomendação |
|---------|--------------|
| Repositório | 🔒 PRIVADO (desenvolvimento) |
| Visibility | Só você enxerga por enquanto |
| Segurança | ✅ Pronta após checklist |
| Push | ✅ Seguro quando marcar todos ✓ |
| Depois | Quando PRONTO: passar para público |

---

## 📞 Se Tiver Dúvida

**Perguntar antes de push**:
1. Arquivo `.env` nunca deve ser commitado?
   - ✅ CORRETO. Use `.env.example` com valores fictícios

2. É seguro código ficar privado no GitHub?
   - ✅ SIM, enquanto for privado. Segredo está em quem acessa

3. Quando passar para público?
   - ✅ Quando tiver: documentação boa, sem legacy, pronto para uso

4. Precisa de LICENSE?
   - ✅ Recomendado: MIT (grátis, permite uso livre)

---

## ✅ Status Atual

- ✅ Código pronto
- ✅ Testes validados
- ✅ Documentação atualizada
- ✅ Segurança checada
- ⏳ Aguardando seu comando para PUSH

**Próximo**: `git push -u origin main`
