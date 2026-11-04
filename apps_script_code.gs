/* ====  Google Apps Script – Web App para Google Sheets (CSV) ==================
 *  - Suporta duas abas: "Viagens" e "Pendencias"
 *  - GET  ?sheet=Viagens|Pendencias  → retorna CSV (para dashboard ler)
 *  - POST ?token=XXX&aba=Viagens|Pendencias  → escreve CSV (para Python scripts)
 *  - Requer token secreto para escrita (definido em SCRIPT_PROPRIETIES)
 *  - Implantar como Web App: "Anyone, even anonymous" (para GET funcionar)
 * ==================================================================== */

const SHEET_ID = '1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4';
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();

// Token secreto para autenticação de escrita (configure nas Propriedades do Script)
// Chave: SHEETS_WEBAPP_TOKEN  |  Valor: seu_token_secreto_aqui
function getWriteToken() {
  return SCRIPT_PROPERTIES.getProperty('SHEETS_WEBAPP_TOKEN') || 'seu_token_secreto_aqui';
}

// ----------------------- Funções auxiliares -------------------------
function sheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues(); // matriz 2-D
  // Converte cada linha em CSV, escapando vírgulas, aspas e quebras de linha
  return data.map(row => row.map(v => {
    if (v === null || v === undefined) return '';
    const s = v.toString();
    // Precisa escapar se tem vírgula, aspas ou quebra de linha
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',')).join('\n');
}

function csvToArray(csvText) {
  // Parser CSV robusto (suporta aspas, vírgulas e quebras de linha dentro de campos)
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // pula o próximo "
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // pula \n em \r\n
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  // Última célula/linha
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  return rows;
}

function clearAndWriteSheet(sheetName, csvData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clearContents();
  }
  
  const rows = csvToArray(csvData);
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  return { rows: rows.length, cols: rows[0] ? rows[0].length : 0 };
}

// --------------------------- doGet (Leitura) --------------------------------
/**
 * URL: https://script.google.com/macros/s/<DEPLOY_ID>/exec?sheet=Viagens
 *      ou ?sheet=Pendencias
 *
 * Responde com: Content-Type = text/csv
 * Usado pelo dashboard (index.html e Streamlit) para ler dados via gviz/tq
 */
function doGet(e) {
  try {
    const sheetName = (e && e.parameter && e.parameter.sheet) || 'Viagens'; // padrão = Viagens
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput('Sheet "' + sheetName + '" not found.')
                           .setMimeType(ContentService.MimeType.TEXT);
    }
    
    const csv = sheetToCsv(sheet);
    return ContentService.createTextOutput(csv)
                         .setMimeType(ContentService.MimeType.CSV);
  } catch (error) {
    return ContentService.createTextOutput('ERRO doGet: ' + error.message)
                         .setMimeType(ContentService.MimeType.TEXT);
  }
}

// --------------------------- doPost (Escrita) --------------------------------
/**
 * URL: https://script.google.com/macros/s/<DEPLOY_ID>/exec?token=SEU_TOKEN&aba=Viagens
 *      (ou aba=Pendencias)
 *
 * Body: CSV data (text/csv; charset=utf-8)
 *
 * Usado pelos scripts Python (baixar_pendencias.py, baixar_viagens.py, enviar_viagens.py)
 * para enviar dados para as abas do Google Sheets.
 */
function doPost(e) {
  try {
    // Valida token
    const token = (e && e.parameter && e.parameter.token) ? e.parameter.token : '';
    const expectedToken = getWriteToken();
    
    if (!token || token !== expectedToken) {
      return ContentService.createTextOutput('ERRO: Token inválido ou ausente.')
                           .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Valida aba
    const aba = (e && e.parameter && e.parameter.aba) ? e.parameter.aba : '';
    if (!aba || (aba !== 'Viagens' && aba !== 'Pendencias')) {
      return ContentService.createTextOutput('ERRO: Parâmetro "aba" inválido. Use "Viagens" ou "Pendencias".')
                           .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Obtém dados CSV do corpo da requisição
    const csvData = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!csvData || csvData.trim() === '') {
      return ContentService.createTextOutput('ERRO: Corpo da requisição vazio (esperado CSV).')
                           .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Escreve na planilha
    const result = clearAndWriteSheet(aba, csvData);
    
    return ContentService.createTextOutput(
      'OK: ' + result.rows + ' linhas x ' + result.cols + ' colunas escritas na aba "' + aba + '".'
    ).setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput('ERRO doPost: ' + error.message)
                         .setMimeType(ContentService.MimeType.TEXT);
  }
}

// --------------------------- Função de teste --------------------------------
/**
 * Função para testar manualmente no editor do Apps Script
 */
function testarEscrita() {
  var csvTeste = 'Coluna1,Coluna2,Coluna3\n' +
                 'Valor1,Valor2,Valor3\n' +
                 '"Com vírgula, aqui","Com aspas ""duplas""",Normal';
  
  var result = clearAndWriteSheet('Viagens', csvTeste);
  Logger.log('Teste escrita Viagens: ' + JSON.stringify(result));
  
  var result2 = clearAndWriteSheet('Pendencias', csvTeste);
  Logger.log('Teste escrita Pendencias: ' + JSON.stringify(result2));
}

function testarLeitura() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Viagens');
  if (sheet) {
    Logger.log(sheetToCsv(sheet));
  }
}

/**
 * Configura o token de escrita nas propriedades do script.
 * Execute esta função uma vez após implantar o script.
 * Se chamado sem parâmetro, usa o token padrão do projeto.
 */
function configurarToken(token) {
  // Token padrão (igual ao do .env) - usado se não passar parâmetro
  var defaultToken = 'DIASPlus_2024_SecureToken_XYZ789';
  var tokenFinal = token || defaultToken;
  
  if (!tokenFinal || tokenFinal.trim() === '') {
    throw new Error('Token não pode ser vazio. Passe um token como parâmetro ou configure o defaultToken na função.');
  }
  
  SCRIPT_PROPERTIES.setProperty('SHEETS_WEBAPP_TOKEN', tokenFinal);
  Logger.log('Token configurado: ' + tokenFinal);
}