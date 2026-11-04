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

  let periodDays = periodMap[rawPeriod];
  if (!periodDays) {
    const parsed = parseInt(rawPeriod, 10);
    periodDays = !isNaN(parsed) && parsed > 0 ? parsed : 30;
  }

  try {
    const metrics = await getDashboardMetrics(periodDays);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Erro na API de métricas:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar dados do dashboard' },
      { status: 500 }
    );
  }
}
