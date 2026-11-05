# 📦 Central de Indicadores | Dias+ — Guia de Configuração Completa

## 🔗 Visão Geral da Arquitetura

```
┌─────────────────┐     POST CSV + Token      ┌──────────────────────┐
│  Scripts Python │ ─────────────────────────▶ │  Apps Script Web App │
│ (baixar_*.py)   │                            │  (doPost: escreve)   │
└─────────────────┘                            └──────────┬───────────┘
                                                           │
                                                           ▼
┌─────────────────┐                            ┌──────────────────────┐
│  Dashboards     │ ◀─── GET CSV (Web App) ─── │  Google Sheets       │
│ (Next.js,       │     (URL no .env)          │  (mesma pasta:       │
│  Streamlit)     │                            │   Viagens,           │
└─────────────────┘                            │   Pendencias)        │
                                               └──────────────────────┘
```

---

## 📋 Passo a Passo de Configuração

### 1️⃣ Preparar a Planilha Google Sheets

1. Abra a pasta de trabalho associada ao Web App configurado em `SHEETS_WEBAPP_URL`.
2. Certifique-se de que as abas **"Viagens"** e **"Pendencias"** estejam nessa mesma pasta de trabalho.
3. Implante o Web App para permitir leitura CSV; o token fica reservado para escrita.

### 2️⃣ Configurar e Implantar o Apps Script

1. Acesse: https://script.google.com/
2. Clique em **Novo projeto**
3. Cole o código do arquivo `apps_script_code.gs` (que está na raiz do projeto)
4. Salve (Ctrl+S) → Dê um nome: "Dias+ Sheets Web App"
5. **Configure o token de escrita:**
   - No editor do Apps Script, execute a função `configurarToken` uma vez:
     ```javascript
     configurarToken('DIASPlus_2024_SecureToken_XYZ789')
     ```
   - Ou defina manualmente: **Configurações do projeto → Propriedades do script → Adicionar propriedade**
     - Chave: `SHEETS_WEBAPP_TOKEN`
     - Valor: `DIASPlus_2024_SecureToken_XYZ789` (use o mesmo do .env)
6. **Implantar como Web App:**
   - Clique em **Implantar → Nova implantação**
   - Tipo: **Aplicação Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa** (essencial para GET funcionar publicamente)
   - Clique em **Implantar**
   - **Copie a URL do Web App** (algo como: `https://script.google.com/macros/s/AKfycb.../exec`)
### 3️⃣ Atualizar o arquivo `.env`

Edite o arquivo `.env` na raiz do projeto com a URL real do Web App:

```ini
# URL do Web App implantado no passo 2 (COLE AQUI A URL REAL)
SHEETS_WEBAPP_URL=https://script.google.com/macros/s/SEU_DEPLOY_ID_REAL/exec

# Token DEVE SER IGUAL ao configurado no Apps Script (necessário para os robôs de escrita)
SHEETS_WEBAPP_TOKEN=seu_token_secreto
```

### 4️⃣ Instalar Dependências Python

```bash
pip install playwright pandas openpyxl streamlit plotly
playwright install
```

### 5️⃣ Testar a Integração

#### Teste 1: Leitura dos dados da planilha
Abra `SHEETS_WEBAPP_URL?sheet=Viagens` e `SHEETS_WEBAPP_URL?sheet=Pendencias`; ambos devem retornar CSV.

#### Teste 2: Envio manual de viagens
```bash
py enviar_viagens.py
```
Deve aparecer: `OK: X linhas x Y colunas escritas na aba "Viagens".`

#### Teste 3: Rodar automação completa
```bash
py executar_rotina.py
```
Ou clique duas vezes em `executar_rotina.bat`

#### Teste 4: Visualizar no Dashboard Next.js
```bash
npm install
npm run dev
```
Abra `http://localhost:3000`. Configure `SHEETS_WEBAPP_URL` no `.env` antes de iniciar.

#### Teste 5: Visualizar no Streamlit
```bash
streamlit run app.py
```

---

## 🔧 Como Funcionam os Endpoints

### GET — Leitura (Dashboard)
```
https://script.google.com/macros/s/<DEPLOY_ID>/exec?sheet=Viagens
https://script.google.com/macros/s/<DEPLOY_ID>/exec?sheet=Pendencias
```
- Retorna CSV puro (Content-Type: text/csv)
- Usado pelo dashboard Next.js (`src/lib/data-service.ts`) e pelo Streamlit

### POST — Escrita (Scripts Python)
```
POST https://script.google.com/macros/s/<DEPLOY_ID>/exec?token=SEU_TOKEN&aba=Viagens
Content-Type: text/csv; charset=utf-8
Body: CSV data
```
- Requer token válido (configurado em Propriedades do Script)
- `aba` deve ser "Viagens" ou "Pendencias"
- Limpa a aba e escreve os novos dados
- Retorna texto: `OK: X linhas x Y colunas escritas na aba "Viagens".`

---

## 🔐 Segurança

| Componente | Proteção |
|------------|----------|
| **Leitura (Dashboard)** | Pública (planilha compartilhada como "Leitor") |
| **Escrita (Python)** | Token secreto no header/query + HTTPS |
| **Credenciais ERP** | Apenas no `.env` (nunca no Git) |
| **Token Web App** | Nas Propriedades do Apps Script (não no código) |

> ⚠️ **NUNCA** commite o arquivo `.env` ou o token no repositório!

---

## 🐛 Troubleshooting

### "Token inválido ou ausente"
- Verifique se `SHEETS_WEBAPP_TOKEN` no `.env` é **idêntico** ao das Propriedades do Apps Script
- Rode `configurarToken('seu_token')` novamente no Apps Script

### "Sheet not found" / Planilha vazia
- Confirme se `SHEETS_WEBAPP_URL` aponta para o Web App conectado à pasta de trabalho correta.
- Verifique se as abas `Viagens` e `Pendencias` existem nessa mesma pasta.
- Teste `SHEETS_WEBAPP_URL?sheet=Viagens` e `SHEETS_WEBAPP_URL?sheet=Pendencias`; ambas devem retornar CSV.

### Timeout / Erro 500 no Web App
- Logs: No Apps Script → **Execuções** → veja os erros
- Aumente timeout no Python: `timeout=180` (já configurado)

### "Exception: Argumento inválido: value" ao executar configurarToken
- A função foi corrigida para ter valor padrão. Execute sem parâmetro ou passe a string.
- Ou configure manualmente nas **Propriedades do script** (mais confiável).

---

## 📁 Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `apps_script_code.gs` | **Código do Apps Script** (copie para script.google.com) |
| `.env` | Credenciais ERP + URL Web App + Token |
| `baixar_pendencias.py` | RPA: baixa pendências 90 dias → sobe ao Sheets |
| `baixar_viagens.py` | RPA: baixa viagens do dia → sobe ao Sheets |
| `enviar_viagens.py` | Utilitário: envia arquivo .xlsx avulso para aba Viagens |
| `executar_rotina.py` | Orquestrador: roda viagens + pendências em sequência |
| `comum.py` | Funções compartilhadas (Streamlit + processamento) |
| `app.py` | Roteador Streamlit (páginas: Pendências / Entregas) |
| `paginas/pendencias.py` | Dashboard Streamlit: análise de notas pendentes |
| `paginas/entregas.py` | Dashboard Streamlit: performance de viagens |
| `src/app/page.tsx` | Dashboard Next.js com gráficos ECharts e filtros |
| `src/lib/data-service.ts` | Leitura e consolidação dos dados do Google Sheets |

---

## ⏰ Agendamento Automático (Windows Task Scheduler)

1. `Win + R` → `taskschd.msc`
2. **Criar Tarefa Básica** → Nome: "Dias+ Atualização Indicadores"
3. Disparador: **Diariamente** às 06:00 (repete a cada 4h)
4. Ação: **Iniciar programa**
   - Programa: `C:\Users\Antenor.Hugo\Downloads\retorno\executar_rotina.bat`
   - Iniciar em: `C:\Users\Antenor.Hugo\Downloads\retorno\`
5. Concluir

---

## ✅ Checklist Final

- [ ] Web App conectado à pasta de trabalho com as abas `Viagens` e `Pendencias`
- [ ] Apps Script implantado como Web App ("Qualquer pessoa")
- [ ] Token configurado nas Propriedades do Script E no `.env`
- [ ] URL do Web App colada no `.env` (`SHEETS_WEBAPP_URL`)
- [ ] `npm run dev` abre o dashboard Next.js e carrega os dados
- [ ] `py enviar_viagens.py` funciona (teste de escrita)
- [ ] `py executar_rotina.py` roda sem erros
- [ ] `streamlit run app.py` abre e mostra dados
- [ ] Tarefa agendada no Windows (opcional)

---

**📞 Suporte:** Em caso de dúvidas, verifique os logs no Apps Script (Execuções) e no terminal Python.