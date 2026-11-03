type CsvRow = Record<string, string>;
interface CsvSheet {
  headers: string[];
  rows: CsvRow[];
}

const DEFAULT_SHEET_ID = '1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface DashboardMetrics {
  taxaSucesso: number;
  taxaAtraso: number;
  valorTotalNf: number;
  totalNotasPendentes: number;
  otifTimeSeries: Array<{ date: string; value: number }>;
  topCarriersDelay: Array<{ name: string; delayRate: number; totalShipments: number }>;
  returnReasons: Array<{ name: string; value: number; percentage: number }>;
  lastUpdated: string;
  periodDays: number;
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }

  return rows;
}

function parseSheet(csv: string, sheetName: string): CsvSheet {
  const [headerRow, ...dataRows] = parseCsv(csv);
  if (!headerRow) {
    throw new Error(`A aba "${sheetName}" não retornou dados.`);
  }

  const headers = headerRow.map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim()
  );
  const rows = dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]))
  );

  const responseText = headers.join(' ').toLocaleLowerCase('pt-BR');
  if (/not found|erro|exception|<!doctype|<html/.test(responseText)) {
    throw new Error(`Não foi possível ler a aba "${sheetName}". Verifique a publicação e o acesso à planilha.`);
  }

  return { headers, rows };
}

function getSheetUrl(sheetName: string): string {
  const webAppUrl = process.env.SHEETS_WEBAPP_URL;
  if (webAppUrl) {
    const url = new URL(webAppUrl);
    url.searchParams.set('sheet', sheetName);
    return url.toString();
  }

  const sheetId = process.env.SHEETS_SHEET_ID || DEFAULT_SHEET_ID;
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.searchParams.set('tqx', 'out:csv');
  url.searchParams.set('sheet', sheetName);
  return url.toString();
}

async function fetchSheet(sheetName: string): Promise<CsvSheet> {
  const response = await fetch(getSheetUrl(sheetName), {
    headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`A API da planilha respondeu com status ${response.status} ao ler "${sheetName}".`);
  }

  return parseSheet(await response.text(), sheetName);
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.trim().replace(/[^\d,.-]/g, '');
  const brazilianNumber = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized;
  const parsed = Number(brazilianNumber);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;

  const googleDate = value.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)$/);
  if (googleDate) {
    return new Date(Date.UTC(Number(googleDate[1]), Number(googleDate[2]), Number(googleDate[3])));
  }

  const brazilianDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brazilianDate) {
    return new Date(Date.UTC(Number(brazilianDate[3]), Number(brazilianDate[2]) - 1, Number(brazilianDate[1])));
  }

  const parsed = new Date(value.replace(/\s*\([^)]*\)\s*$/, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function filterByPeriod(rows: CsvRow[], dateColumns: string[], periodDays: number): CsvRow[] {
  const now = new Date();
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
    (periodDays - 1) * DAY_IN_MS;
  return rows.filter((row) => {
    const date = dateColumns.map((column) => parseDate(row[column])).find((value) => value !== null);
    return date !== undefined && date !== null && date.getTime() >= cutoff && date.getTime() <= now.getTime();
  });
}

function isOverdue(row: CsvRow): boolean {
  const effectiveness = row['Efetividade']?.toLocaleLowerCase('pt-BR').trim();
  if (effectiveness) return effectiveness.includes('atrasad');

  const dueDate = parseDate(row['Data Prazo']);
  return dueDate !== null && dueDate.getTime() < Date.now();
}

function requireColumns(headers: string[], sheet: string, columns: string[]): void {
  const available = new Set(headers);
  const missing = columns.filter((column) => !available.has(column));
  if (missing.length > 0) {
    throw new Error(`A aba "${sheet}" está sem as colunas obrigatórias: ${missing.join(', ')}.`);
  }
}

export async function getDashboardMetrics(periodDays: number): Promise<DashboardMetrics> {
  const [travelSheet, pendingSheet] = await Promise.all([
    fetchSheet('Viagens'),
    fetchSheet('Pendencias'),
  ]);

  const { rows: travelRows } = travelSheet;
  const { rows: pendingRows } = pendingSheet;

  requireColumns(travelSheet.headers, 'Viagens', ['Data Entrega', 'Sucessos', 'Insucessos']);
  requireColumns(pendingSheet.headers, 'Pendencias', ['Valor NF', 'Efetividade', 'Data Prazo', 'Ocorrência']);

  const travels = filterByPeriod(travelRows, ['Data Entrega'], periodDays);
  const pendingNotes = filterByPeriod(
    pendingRows,
    ['Data ocorrência', 'Embarque', 'Data última viagem', 'Data Prazo'],
    periodDays
  );

  const totalsByDate = new Map<string, { successes: number; attempts: number }>();
  for (const row of travels) {
    const date = parseDate(row['Data Entrega']);
    if (!date) continue;

    const dateLabel = date.toISOString().slice(0, 10);
    const successes = parseNumber(row['Sucessos']);
    const failures = parseNumber(row['Insucessos']);
    const totals = totalsByDate.get(dateLabel) || { successes: 0, attempts: 0 };
    totals.successes += successes;
    totals.attempts += successes + failures;
    totalsByDate.set(dateLabel, totals);
  }

  const totalSuccesses = travels.reduce((sum, row) => sum + parseNumber(row['Sucessos']), 0);
  const totalAttempts = travels.reduce(
    (sum, row) => sum + parseNumber(row['Sucessos']) + parseNumber(row['Insucessos']),
    0
  );
  const delayedNotes = pendingNotes.filter(isOverdue).length;
  const branches = new Map<string, { delayed: number; total: number }>();
  const reasons = new Map<string, number>();

  for (const row of pendingNotes) {
    const branch = row['Filial de Entrega']?.trim() || row['Filial']?.trim();
    if (branch) {
      const totals = branches.get(branch) || { delayed: 0, total: 0 };
      totals.total += 1;
      if (isOverdue(row)) totals.delayed += 1;
      branches.set(branch, totals);
    }

    const reason = row['Ocorrência']?.trim();
    if (reason) reasons.set(reason, (reasons.get(reason) || 0) + 1);
  }

  const reasonTotal = Array.from(reasons.values()).reduce((sum, value) => sum + value, 0);

  return {
    taxaSucesso: totalAttempts ? (totalSuccesses / totalAttempts) * 100 : 0,
    taxaAtraso: pendingNotes.length ? (delayedNotes / pendingNotes.length) * 100 : 0,
    valorTotalNf: pendingNotes.reduce((sum, row) => sum + parseNumber(row['Valor NF']), 0),
    totalNotasPendentes: pendingNotes.length,
    otifTimeSeries: Array.from(totalsByDate.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, totals]) => ({
        date,
        value: totals.attempts ? (totals.successes / totals.attempts) * 100 : 0,
      })),
    topCarriersDelay: Array.from(branches.entries())
      .map(([name, totals]) => ({
        name,
        delayRate: totals.total ? (totals.delayed / totals.total) * 100 : 0,
        totalShipments: totals.total,
      }))
      .sort((a, b) => b.delayRate - a.delayRate)
      .slice(0, 5),
    returnReasons: Array.from(reasons.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: reasonTotal ? (value / reasonTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value),
    lastUpdated: new Date().toISOString(),
    periodDays,
  };
}
