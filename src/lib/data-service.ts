import { getFallbackMetrics } from '@/data/mockData';
import type {
  DriverReturnData,
  FilialReturnData,
  ReturnReasonKPI,
  ReturnTrendPoint,
} from '@/types/dashboard';

type CsvRow = Record<string, string>;

interface CsvSheet {
  headers: string[];
  rows: CsvRow[];
}

export interface DashboardMetrics {
  taxaSucesso: number;
  taxaAtraso: number;
  valorTotalNf: number;
  totalNotasPendentes: number;
  otifTimeSeries: Array<{ date: string; value: number }>;
  topCarriersDelay: Array<{ name: string; delayRate: number; totalShipments: number }>;
  returnReasons: Array<{ name: string; value: number; percentage: number }>;
  returnReasonKPIs: ReturnReasonKPI[];
  returnTrend: ReturnTrendPoint[];
  filialReturnData: FilialReturnData[];
  driverReturnData: DriverReturnData[];
  entregasPorFilial: Array<{ name: string; entregas: number; volumes: number }>;
  entregasPorMotorista: Array<{ name: string; entregas: number; volumes: number }>;
  totalVolumes: number;
  entregasComOcorrencia: Array<{
    nf: string;
    filial: string;
    motorista: string;
    data: string;
    volumes: number;
    ocorrencia: string;
    cidade?: string;
    regiao?: string;
  }>;
  lastUpdated: string;
  periodDays: number;
  isMock?: boolean;
}

const DEFAULT_SHEET_ID = '12_DwR-eL1fM-Aj77ZSFFxtTpLAC9PeN6FE2EoHTn-RA';
const SECONDARY_SHEET_ID = '1yrEfFEEa4rtNcYzkWMJgVgFPPuHS5ihauzUeNXORE2M4';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const RETURN_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#34d399', '#6366f1', '#a855f7'];

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
  const trimmedCsv = csv.trimStart();
  if (/^(?:<!doctype|<html|google\.visualization\.query\.setresponse)/i.test(trimmedCsv)) {
    throw new Error(`A aba "${sheetName}" não retornou CSV válido.`);
  }

  const [headerRow, ...dataRows] = parseCsv(csv);
  if (!headerRow) {
    throw new Error(`A aba "${sheetName}" não retornou dados.`);
  }

  const headers = headerRow.map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim()
  );
  if (/not found|erro|exception/i.test(headers.join(' '))) {
    throw new Error(`Não foi possível ler a aba "${sheetName}".`);
  }

  const rows = dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]))
  );
  return { headers, rows };
}

function getSheetUrls(sheetName: string): string[] {
  const urls: string[] = [];
  const webAppUrl = process.env.SHEETS_WEBAPP_URL;
  if (webAppUrl) {
    const url = new URL(webAppUrl);
    url.searchParams.set('sheet', sheetName);
    urls.push(url.toString());
  }

  const primarySheetId = process.env.SHEETS_SHEET_ID || DEFAULT_SHEET_ID;
  for (const sheetId of [primarySheetId, SECONDARY_SHEET_ID]) {
    if (urls.some((url) => url.includes(`/spreadsheets/d/${sheetId}/`))) continue;
    urls.push(
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    );
  }
  return urls;
}

async function fetchSheetWithRetry(sheetName: string): Promise<CsvSheet> {
  const urls = getSheetUrls(sheetName);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
          signal: controller.signal,
          next: { revalidate: 60 },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return parseSheet(await response.text(), sheetName);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Tentativa ${attempt + 1} falhou para a aba "${sheetName}": ${lastError.message}`
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * 2 ** attempt));
    }
  }

  throw lastError || new Error(`Não foi possível carregar a aba "${sheetName}".`);
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
    const year = Number(googleDate[1]);
    const month = Number(googleDate[2]);
    const day = Number(googleDate[3]);
    const date = new Date(Date.UTC(year, month, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
      ? date
      : null;
  }

  const brazilianDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brazilianDate) {
    const day = Number(brazilianDate[1]);
    const month = Number(brazilianDate[2]) - 1;
    const year = Number(brazilianDate[3]);
    const date = new Date(Date.UTC(year, month, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
      ? date
      : null;
  }

  const parsed = new Date(value.replace(/\s*\([^)]*\)\s*$/, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRowDate(row: CsvRow, columns: string[]): Date | null {
  for (const column of columns) {
    const date = parseDate(row[column]);
    if (date) return date;
  }
  return null;
}

function filterByPeriod(rows: CsvRow[], dateColumns: string[], periodDays: number): CsvRow[] {
  const now = new Date();
  const endOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - 1;
  const cutoff = endOfToday - periodDays * DAY_IN_MS + 1;
  return rows.filter((row) => {
    const date = getRowDate(row, dateColumns);
    return date !== null && date.getTime() >= cutoff && date.getTime() <= endOfToday;
  });
}

function isOverdue(row: CsvRow): boolean {
  const effectiveness = row['Efetividade']?.toLocaleLowerCase('pt-BR').trim();
  if (effectiveness) return effectiveness.includes('atrasad');

  const dueDate = parseDate(row['Data Prazo']);
  return dueDate !== null && dueDate.getTime() < Date.now();
}

function getOccurrence(row: CsvRow): string {
  const occurrence = (row['Ocorrência'] || '').trim();
  return occurrence.toLocaleLowerCase('pt-BR') === 'não informado' ? '' : occurrence;
}

function requireColumns(headers: string[], sheet: string, columns: string[]): void {
  const available = new Set(headers);
  const missing = columns.filter((column) => !available.has(column));
  if (missing.length > 0) {
    throw new Error(`A aba "${sheet}" está sem as colunas obrigatórias: ${missing.join(', ')}.`);
  }
}

function increment(map: Map<string, number>, key: string, amount = 1): void {
  if (key) map.set(key, (map.get(key) || 0) + amount);
}

function getEntityReturnData(
  deliveries: Map<string, { entregas: number; volumes: number }>,
  returns: Map<string, number>
): FilialReturnData[] {
  const names = new Set(
    Array.from(deliveries.keys()).concat(Array.from(returns.keys()))
  );
  return Array.from(names)
    .map((name) => {
      const totals = deliveries.get(name) || { entregas: 0, volumes: 0 };
      const returnCount = returns.get(name) || 0;
      return {
        name,
        deliveries: totals.entregas,
        returns: returnCount,
        returnRate: totals.entregas ? (returnCount / totals.entregas) * 100 : 0,
        volumes: totals.volumes,
      };
    })
    .sort((a, b) => b.returns - a.returns || a.name.localeCompare(b.name, 'pt-BR'));
}

export async function getDashboardMetrics(periodDays: number): Promise<DashboardMetrics> {
  try {
    const [travelSheet, pendingSheet] = await Promise.all([
      fetchSheetWithRetry('Viagens'),
      fetchSheetWithRetry('Pendencias'),
    ]);

    requireColumns(travelSheet.headers, 'Viagens', ['Data Entrega', 'Sucessos', 'Insucessos']);
    requireColumns(pendingSheet.headers, 'Pendencias', [
      'Valor NF',
      'Efetividade',
      'Data Prazo',
      'Ocorrência',
    ]);

    const travels = filterByPeriod(travelSheet.rows, ['Data Entrega'], periodDays);
    const pendingNotes = filterByPeriod(
      pendingSheet.rows,
      ['Data ocorrência', 'Embarque', 'Data última viagem', 'Data Prazo'],
      periodDays
    );
    const returns = pendingNotes.filter((row) => getOccurrence(row) !== '');

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
    const pendingByBranch = new Map<string, { delayed: number; total: number }>();
    const returnReasons = new Map<string, number>();
    const returnsByBranch = new Map<string, number>();
    const returnsByDriver = new Map<string, number>();
    const returnsByDate = new Map<string, number>();

    for (const row of pendingNotes) {
      const branch = (row['Filial de Entrega'] || row['Filial'] || '').trim();
      if (branch) {
        const totals = pendingByBranch.get(branch) || { delayed: 0, total: 0 };
        totals.total += 1;
        if (isOverdue(row)) totals.delayed += 1;
        pendingByBranch.set(branch, totals);
      }

      const occurrence = getOccurrence(row);
      if (!occurrence) continue;
      increment(returnReasons, occurrence);
      increment(returnsByBranch, branch);
      increment(returnsByDriver, (row['Motorista última viagem'] || row['Motorista'] || '').trim());

      const returnDate = getRowDate(row, [
        'Data ocorrência',
        'Data última viagem',
        'Embarque',
        'Data Prazo',
      ]);
      if (returnDate) increment(returnsByDate, returnDate.toISOString().slice(0, 10));
    }

    const reasonTotal = Array.from(returnReasons.values()).reduce((sum, value) => sum + value, 0);
    const returnReasonsData = Array.from(returnReasons.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: reasonTotal ? (value / reasonTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    const returnReasonKPIs: ReturnReasonKPI[] = returnReasonsData.map((reason, index) => ({
      id: `reason-${index + 1}`,
      label: reason.name,
      value: reason.value,
      percentage: reason.percentage,
      color: RETURN_COLORS[index % RETURN_COLORS.length],
      description: `${reason.value.toLocaleString('pt-BR')} ocorrência(s)`,
    }));

    const branchDeliveries = new Map<string, { entregas: number; volumes: number }>();
    const driverDeliveries = new Map<string, { entregas: number; volumes: number }>();
    for (const row of travels) {
      const deliveries = parseNumber(row['Entregas']) ||
        parseNumber(row['Sucessos']) + parseNumber(row['Insucessos']);
      const volumes = parseNumber(row['Volumes']);
      const branch = (row['Filial'] || '').trim();
      const driver = (row['Motorista'] || '').trim();

      for (const [name, map] of [
        [branch, branchDeliveries],
        [driver, driverDeliveries],
      ] as const) {
        if (!name) continue;
        const totals = map.get(name) || { entregas: 0, volumes: 0 };
        map.set(name, { entregas: totals.entregas + deliveries, volumes: totals.volumes + volumes });
      }
    }

    const entregasPorFilial = Array.from(branchDeliveries.entries())
      .map(([name, totals]) => ({ name, entregas: totals.entregas, volumes: totals.volumes }))
      .sort((a, b) => b.entregas - a.entregas);
    const entregasPorMotorista = Array.from(driverDeliveries.entries())
      .map(([name, totals]) => ({ name, entregas: totals.entregas, volumes: totals.volumes }))
      .sort((a, b) => b.entregas - a.entregas);
    const filialReturnData = getEntityReturnData(branchDeliveries, returnsByBranch);
    const driverReturnData = getEntityReturnData(driverDeliveries, returnsByDriver);

    const dateLabels = new Set(
      Array.from(totalsByDate.keys()).concat(Array.from(returnsByDate.keys()))
    );
    const returnTrend: ReturnTrendPoint[] = Array.from(dateLabels)
      .sort()
      .map((date) => {
        const totals = totalsByDate.get(date) || { successes: 0, attempts: 0 };
        return {
          date,
          returns: returnsByDate.get(date) || 0,
          successRate: totals.attempts ? (totals.successes / totals.attempts) * 100 : 0,
        };
      });

    const entregasComOcorrencia = returns
      .map((row) => ({
        nf: (row['NF'] || row['Nota Fiscal'] || '').trim(),
        filial: (row['Filial'] || row['Filial de Entrega'] || '').trim(),
        motorista: (row['Motorista última viagem'] || row['Motorista'] || '').trim(),
        data: row['Data ocorrência'] || row['Data última viagem'] || row['Data Prazo'] || '',
        volumes: parseNumber(row['Volumes']),
        ocorrencia: getOccurrence(row),
        cidade: (row['Cidade'] || '').trim() || undefined,
        regiao: (row['Região'] || '').trim() || undefined,
      }))
      .sort(
        (a, b) =>
          (parseDate(b.data)?.getTime() || 0) - (parseDate(a.data)?.getTime() || 0)
      );

    return {
      taxaSucesso: totalAttempts ? (totalSuccesses / totalAttempts) * 100 : 0,
      taxaAtraso: pendingNotes.length ? (delayedNotes / pendingNotes.length) * 100 : 0,
      valorTotalNf: pendingNotes.reduce((sum, row) => sum + parseNumber(row['Valor NF']), 0),
      totalNotasPendentes: pendingNotes.length,
      otifTimeSeries: returnTrend.map(({ date, successRate }) => ({ date, value: successRate })),
      topCarriersDelay: Array.from(pendingByBranch.entries())
        .map(([name, totals]) => ({
          name,
          delayRate: totals.total ? (totals.delayed / totals.total) * 100 : 0,
          totalShipments: totals.total,
        }))
        .sort((a, b) => b.delayRate - a.delayRate)
        .slice(0, 5),
      returnReasons: returnReasonsData,
      returnReasonKPIs,
      returnTrend,
      filialReturnData,
      driverReturnData,
      entregasPorFilial,
      entregasPorMotorista,
      totalVolumes: travels.reduce((sum, row) => sum + parseNumber(row['Volumes']), 0),
      entregasComOcorrencia,
      lastUpdated: new Date().toISOString(),
      periodDays,
      isMock: false,
    };
  } catch (error) {
    console.warn('Google Sheets indisponível. Utilizando os dados demonstrativos:', error);
    return { ...getFallbackMetrics(periodDays), isMock: true };
  }
}
