import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/data-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodDays = Number(searchParams.get('period') || '30');
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 366) {
    return NextResponse.json({ error: 'Período inválido. Informe um valor entre 1 e 366 dias.' }, { status: 400 });
  }

  try {
    const metrics = await getDashboardMetrics(periodDays);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar dados do dashboard' },
      { status: 500 }
    );
  }
}