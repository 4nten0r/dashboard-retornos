'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { OTIFLineChart } from '@/components/charts/OTIFLineChart';
import { CarrierDelayBarChart } from '@/components/charts/CarrierDelayBarChart';
import { ReturnReasonsDoughnutChart } from '@/components/charts/ReturnReasonsDoughnutChart';
import { periodOptions } from '@/data/mockData';
import type { DashboardMetrics } from '@/lib/data-service';
import type { PeriodOption } from '@/types/dashboard';

interface KPIData {
  id: string;
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

function formatValue(value: number, format: 'number' | 'currency' | 'percentage'): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getKPIs(metrics: DashboardMetrics): KPIData[] {
  return [
    {
      id: 'otif',
      label: 'Taxa de entregas concluídas',
      value: formatValue(metrics.taxaSucesso, 'percentage'),
      description: 'Sucessos sobre o total de tentativas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'taxaAvaria',
      label: 'Pendências atrasadas',
      value: formatValue(metrics.taxaAtraso, 'percentage'),
      description: 'Percentual das notas pendentes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'custoMedioFrete',
      label: 'Valor das notas pendentes',
      value: formatValue(metrics.valorTotalNf, 'currency'),
      description: 'Soma do valor das notas no período',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'entregasNoPrazo',
      label: 'Notas pendentes',
      value: formatValue(metrics.totalNotasPendentes, 'number'),
      description: 'Notas registradas no período',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];
}

export default function DashboardPage() {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedPeriod = periodOptions.find((period) => period.value === currentPeriod);
      const periodDays = currentPeriod === 'ytd'
        ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)) + 1
        : selectedPeriod?.days || 30;
      const response = await fetch(`/api/metrics?period=${periodDays}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Falha ao carregar dados');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [currentPeriod]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <DashboardLayout
        title="Dashboard Logístico"
        currentPeriod={currentPeriod}
        onPeriodChange={setCurrentPeriod}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
                <div className="h-8 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl h-96 animate-pulse" />
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl h-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl h-96 animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !metrics) {
    return (
      <DashboardLayout
        title="Dashboard Logístico"
        currentPeriod={currentPeriod}
        onPeriodChange={setCurrentPeriod}
      >
        <div className="text-center py-12 text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg">{error || 'Não foi possível carregar os dados'}</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const kpis = getKPIs(metrics);

  return (
    <DashboardLayout
      title="Dashboard Logístico"
      currentPeriod={currentPeriod}
      onPeriodChange={setCurrentPeriod}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OTIFLineChart data={metrics.otifTimeSeries} height={360} />
          <CarrierDelayBarChart data={metrics.topCarriersDelay} height={360} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ReturnReasonsDoughnutChart data={metrics.returnReasons} height={360} />
        </div>
      </div>
    </DashboardLayout>
  );
}