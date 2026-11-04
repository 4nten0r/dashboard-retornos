'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { OTIFLineChart } from '@/components/charts/OTIFLineChart';
import { CarrierDelayBarChart } from '@/components/charts/CarrierDelayBarChart';
import { ReturnReasonsDoughnutChart } from '@/components/charts/ReturnReasonsDoughnutChart';
import { FilialVolumeChart } from '@/components/charts/FilialVolumeChart';
import { MotoristaVolumeChart } from '@/components/charts/MotoristaVolumeChart';
import { OcorrenciasTable } from '@/components/ui/OcorrenciasTable';
import type { DashboardMetrics } from '@/lib/data-service';
import type { PeriodOption } from '@/types/dashboard';
import {
  PackageCheck,
  DollarSign,
  Building2,
  UserCheck,
  Boxes,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Cloud,
} from 'lucide-react';

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
  const topFilial = metrics.entregasPorFilial[0];
  const topMotorista = metrics.entregasPorMotorista[0];

  return [
    {
      id: 'otif',
      label: 'Taxa de Entregas (OTIF)',
      value: formatValue(metrics.taxaSucesso, 'percentage'),
      description: 'Sucesso sobre o total de tentativas',
      icon: <PackageCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'valorTotalNf',
      label: 'Valor das Notas Pendentes',
      value: formatValue(metrics.valorTotalNf, 'currency'),
      description: `${metrics.totalNotasPendentes.toLocaleString('pt-BR')} nota(s) em aberto`,
      icon: <DollarSign className="w-5 h-5 text-sky-600" />,
    },
    {
      id: 'entregasPorFilial',
      label: 'Filial Líder',
      value: topFilial ? `${topFilial.entregas.toLocaleString('pt-BR')} ent.` : '0',
      description: topFilial ? `${topFilial.name}` : 'Sem dados',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
    },
    {
      id: 'entregasPorMotorista',
      label: 'Motorista Destaque',
      value: topMotorista ? `${topMotorista.entregas.toLocaleString('pt-BR')} ent.` : '0',
      description: topMotorista ? `${topMotorista.name}` : 'Sem dados',
      icon: <UserCheck className="w-5 h-5 text-amber-600" />,
    },
    {
      id: 'totalVolumes',
      label: 'Volumes Transportados',
      value: formatValue(metrics.totalVolumes, 'number'),
      description: 'Volumes movimentados no período',
      icon: <Boxes className="w-5 h-5 text-purple-600" />,
    },
  ];
}

export default function DashboardPage() {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/metrics?period=${currentPeriod}`);
      if (!response.ok) throw new Error('Falha ao obter indicadores');
      const data: DashboardMetrics = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPeriod]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <DashboardLayout
      title="Central de Indicadores Logísticos | Dias+"
      currentPeriod={currentPeriod}
      onPeriodChange={setCurrentPeriod}
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Sincronização em Tempo Real</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {metrics?.isMock ? 'Dados do Sistema Ativos' : 'Google Sheets Sincronizado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {metrics?.lastUpdated
                  ? `Atualizado às ${new Date(metrics.lastUpdated).toLocaleTimeString('pt-BR')} (${new Date(metrics.lastUpdated).toLocaleDateString('pt-BR')})`
                  : 'Sincronizando com a base de dados...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMetrics(true)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-28" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl h-80" />
              <div className="bg-white border border-slate-200 rounded-xl h-80" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="card p-8 text-center bg-white border border-rose-200">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">Não foi possível carregar os dados</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => fetchMetrics(false)}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Normal Content */}
        {!loading && metrics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {getKPIs(metrics).map((kpi) => (
                <KPICard
                  key={kpi.id}
                  label={kpi.label}
                  value={kpi.value}
                  description={kpi.description}
                  icon={kpi.icon}
                />
              ))}
            </div>

            {/* Line and Bar Charts (OTIF & Delays) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OTIFLineChart data={metrics.otifTimeSeries} height={340} />
              <CarrierDelayBarChart data={metrics.topCarriersDelay} height={340} />
            </div>

            {/* Volume charts by Branch and Driver */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FilialVolumeChart data={metrics.entregasPorFilial} height={340} />
              <MotoristaVolumeChart data={metrics.entregasPorMotorista} height={340} />
            </div>

            {/* Return Reasons & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReturnReasonsDoughnutChart data={metrics.returnReasons} height={360} />
              <div className="hidden lg:block lg:col-span-1" />
            </div>

            {/* Occurrences full table */}
            <div className="grid grid-cols-1 gap-6">
              <OcorrenciasTable data={metrics.entregasComOcorrencia} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
