import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/data-service';

const periodMap: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '6m': 180,
  '12m': 365,
  'ytd': 365,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPeriod = searchParams.get('period') || '30d';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const selectedBranch = searchParams.get('branch')?.trim() || null;

  let periodDays = periodMap[rawPeriod];
  if (rawPeriod === 'ytd') {
    const now = new Date();
    periodDays = Math.floor(
      (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        Date.UTC(now.getUTCFullYear(), 0, 1)) /
        (24 * 60 * 60 * 1000)
    ) + 1;
  } else if (!periodDays) {
    const parsed = parseInt(rawPeriod, 10);
    periodDays = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 3650) : 30;
  }

  try {
    const metrics = await getDashboardMetrics(periodDays, forceRefresh, selectedBranch);
    return NextResponse.json(metrics, {
      headers: { 'Cache-Control': forceRefresh ? 'no-store' : 'private, max-age=60' },
    });
  } catch (error) {
    console.error('Erro na API de métricas:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar dados do dashboard' },
      { status: 500 }
    );
  }
}
