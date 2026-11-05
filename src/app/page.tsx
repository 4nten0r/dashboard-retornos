'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Boxes,
  CheckCircle2,
  Cloud,
  DollarSign,
  Download,
  PackageCheck,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { CarrierDelayBarChart } from '@/components/charts/CarrierDelayBarChart';
import { FilialReturnChart } from '@/components/charts/FilialReturnChart';
import { FilialVolumeChart } from '@/components/charts/FilialVolumeChart';
import { MotoristaReturnChart } from '@/components/charts/MotoristaReturnChart';
import { MotoristaVolumeChart } from '@/components/charts/MotoristaVolumeChart';
import { OTIFLineChart } from '@/components/charts/OTIFLineChart';
import { ReturnReasonsDoughnutChart } from '@/components/charts/ReturnReasonsDoughnutChart';
import { ReturnTrendChart } from '@/components/charts/ReturnTrendChart';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { OcorrenciasTable } from '@/components/ui/OcorrenciasTable';
import type { DashboardMetrics } from '@/lib/data-service';
import type { PeriodOption } from '@/types/dashboard';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default function DashboardPage() {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchMetrics = useCallback(async (manualRefresh = false) => {
    const activeRequest = ++requestId.current;
    if (manualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/metrics?period=${currentPeriod}`);
      if (!response.ok) throw new Error('Falha ao obter indicadores.');
      const data: DashboardMetrics = await response.json();
      if (activeRequest === requestId.current) setMetrics(data);
    } catch (requestError) {
      if (activeRequest === requestId.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Erro desconhecido ao carregar os indicadores.'
        );
      }
    } finally {
      if (activeRequest === requestId.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [currentPeriod]);

  useEffect(() => {
    void fetchMetrics();
    return () => {
      requestId.current += 1;
    };
  }, [fetchMetrics]);

  const topBranch = metrics?.entregasPorFilial[0];
  const topDriver = metrics?.entregasPorMotorista[0];

  return (
    <DashboardLayout
      title="Central de Indicadores Logísticos | Dias+"
      currentPeriod={currentPeriod}
      onPeriodChange={setCurrentPeriod}
    >
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  Sincronização de indicadores
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    metrics?.isMock
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {loading
                    ? 'Sincronizando'
                    : metrics?.isMock
                      ? 'Dados demonstrativos'
                      : 'Google Sheets conectado'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {metrics?.lastUpdated
                  ? `Atualizado em ${new Date(metrics.lastUpdated).toLocaleString('pt-BR')}`
                  : 'Carregando dados...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchMetrics(true)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar dados'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </section>

        {loading && (
          <div className="space-y-6 animate-pulse" aria-label="Carregando indicadores">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-80 rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="card border border-rose-200 bg-white p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
            <h2 className="mb-1 text-base font-semibold text-slate-900">
              Não foi possível carregar os dados
            </h2>
            <p className="mb-4 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => void fetchMetrics()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && metrics && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KPICard
                label="Taxa de entregas"
                value={`${metrics.taxaSucesso.toFixed(1)}%`}
                description="Sucessos sobre o total de tentativas"
                icon={<PackageCheck className="h-5 w-5 text-emerald-600" />}
              />
              <KPICard
                label="Notas pendentes"
                value={formatCurrency(metrics.valorTotalNf)}
                description={`${formatNumber(metrics.totalNotasPendentes)} nota(s) em aberto`}
                icon={<DollarSign className="h-5 w-5 text-sky-600" />}
              />
              <KPICard
                label="Filial líder"
                value={topBranch ? `${formatNumber(topBranch.entregas)} ent.` : '0'}
                description={topBranch?.name || 'Sem dados'}
                icon={<Building2 className="h-5 w-5 text-indigo-600" />}
              />
              <KPICard
                label="Motorista destaque"
                value={topDriver ? `${formatNumber(topDriver.entregas)} ent.` : '0'}
                description={topDriver?.name || 'Sem dados'}
                icon={<UserCheck className="h-5 w-5 text-amber-600" />}
              />
              <KPICard
                label="Volumes transportados"
                value={formatNumber(metrics.totalVolumes)}
                description="Volumes movimentados no período"
                icon={<Boxes className="h-5 w-5 text-purple-600" />}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <OTIFLineChart data={metrics.otifTimeSeries} />
              <CarrierDelayBarChart data={metrics.topCarriersDelay} />
              <ReturnReasonsDoughnutChart data={metrics.returnReasons} />
              <ReturnTrendChart data={metrics.returnTrend} />
              <FilialVolumeChart data={metrics.entregasPorFilial} />
              <FilialReturnChart data={metrics.filialReturnData} />
              <MotoristaVolumeChart data={metrics.entregasPorMotorista} />
              <MotoristaReturnChart data={metrics.driverReturnData} />
              <OcorrenciasTable data={metrics.entregasComOcorrencia} />
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
