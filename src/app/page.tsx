'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
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

const METRICS_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

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

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="neo-card flex min-h-60 flex-col items-center justify-center rounded-[1.4rem] border border-white/70 p-6 text-center">
      <Activity className="mb-3 h-6 w-6 text-slate-300" />
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}

function downloadCsv(metrics: DashboardMetrics) {
  const rows = [
    ['Filial', 'Entregas', 'Volumes'],
    ...metrics.entregasPorFilial.map((item) => [item.name, item.entregas, item.volumes]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `indicadores-logisticos-${new Date().toISOString().slice(0, 10)}.csv`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DashboardPage() {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>('30d');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [activeKpi, setActiveKpi] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchMetrics = useCallback(
    async (manualRefresh = false) => {
      const activeRequest = ++requestId.current;
      if (manualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({ period: currentPeriod });
        if (selectedBranch) searchParams.set('branch', selectedBranch);
        const response = await fetch(`/api/metrics?${searchParams}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Não foi possível consultar os dados da planilha.');
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
    },
    [currentPeriod, selectedBranch]
  );

  useEffect(() => {
    void fetchMetrics();
    return () => {
      requestId.current += 1;
    };
  }, [fetchMetrics]);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => void fetchMetrics(true),
      METRICS_REFRESH_INTERVAL_MS
    );
    return () => window.clearInterval(intervalId);
  }, [fetchMetrics]);

  const totalDeliveries =
    metrics?.entregasPorFilial.reduce((total, item) => total + item.entregas, 0) || 0;
  const topBranch = metrics?.entregasPorFilial[0];
  const topDriver = metrics?.entregasPorMotorista[0];
  const hasPendingSheet = metrics?.availableSheets.pendencias ?? false;
  const hasOccurrences = (metrics?.entregasComOcorrencia.length || 0) > 0;
  const hasReturnReasons = (metrics?.returnReasons.length || 0) > 0;

  function scrollToSection(sectionId: string, label: string) {
    setActiveKpi(label);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <DashboardLayout
      title="Performance logística"
      currentPeriod={currentPeriod}
      onPeriodChange={setCurrentPeriod}
      showPending={hasPendingSheet}
      showOccurrences={hasOccurrences}
    >
      <div className="space-y-7" id="visao-geral">
        <section className="neo-card relative overflow-hidden rounded-[1.65rem] border border-white/80 p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 right-1/3 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-teal-800 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {loading
                  ? 'Sincronizando planilha'
                  : hasPendingSheet
                    ? 'Planilhas conectadas · Viagens + Pendências'
                    : 'Planilha conectada · Viagens'}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
                Visão geral da operação
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Indicadores atualizados diretamente a partir da pasta de trabalho configurada no
                ambiente. Explore períodos, filiais e gráficos interativos.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Google Sheets
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {metrics?.lastUpdated
                    ? `Atualizado ${new Date(metrics.lastUpdated).toLocaleString('pt-BR')}`
                    : 'Aguardando sincronização'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex min-w-48 items-center">
                <Building2 className="pointer-events-none absolute left-3.5 h-4 w-4 text-teal-700" />
                <select
                  value={selectedBranch}
                  onChange={(event) => setSelectedBranch(event.target.value)}
                  aria-label="Filtrar por filial"
                  className="w-full appearance-none rounded-xl border border-white/90 bg-[#e4efee] py-3 pl-10 pr-10 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_7px_#bfd1cf,inset_-3px_-3px_7px_#f8fcfb] outline-none transition focus:ring-2 focus:ring-teal-600/30"
                  disabled={!metrics?.availableBranches.length}
                >
                  <option value="">Todas as filiais</option>
                  {metrics?.availableBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-slate-500" />
              </label>
              <button
                type="button"
                onClick={() => void fetchMetrics(true)}
                disabled={isRefreshing || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/90 bg-[#e4efee] px-4 py-3 text-xs font-bold text-slate-700 shadow-[5px_5px_10px_#bfd1cf,-5px_-5px_10px_#f8fcfb] transition hover:-translate-y-0.5 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => metrics && downloadCsv(metrics)}
                disabled={!metrics || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(43,116,119,0.22)] transition hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
          {selectedBranch && (
            <div className="relative mt-5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filtro ativo:</span>
              <button
                type="button"
                onClick={() => setSelectedBranch('')}
                className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {selectedBranch} <span aria-hidden="true">×</span>
              </button>
            </div>
          )}
        </section>

        {loading && (
          <div className="space-y-7" aria-label="Carregando indicadores">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="neo-card h-36 animate-pulse rounded-[1.35rem] border border-white/70"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="neo-card h-96 animate-pulse rounded-[1.4rem]" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="neo-card rounded-[1.5rem] border border-rose-200/80 p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-11 w-11 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-800">Falha ao carregar a planilha</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{error}</p>
            <p className="mt-2 text-xs text-slate-400">
              Verifique se SHEETS_WEBAPP_URL está configurada e se o Web App tem acesso às abas
              Viagens e Pendencias.
            </p>
            <button
              type="button"
              onClick={() => void fetchMetrics(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && metrics && !error && (
          <>
            <section
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
                hasPendingSheet ? '2xl:grid-cols-5' : '2xl:grid-cols-4'
              }`}
              aria-label="Indicadores-chave de desempenho"
            >
              <KPICard
                label="Taxa de sucesso"
                value={
                  metrics.totalTentativas > 0 ? `${metrics.taxaSucesso.toFixed(1)}%` : '—'
                }
                description={
                  metrics.totalTentativas > 0
                    ? `${formatNumber(metrics.totalTentativas)} tentativas registradas`
                    : 'Sem tentativas registradas'
                }
                icon={<PackageCheck className="h-5 w-5" />}
                accent="#4f8d7d"
                active={activeKpi === 'success'}
                onClick={() => scrollToSection('entregas', 'success')}
              />
              {hasPendingSheet && (
                <KPICard
                  label="Valor pendente"
                  value={formatCurrency(metrics.valorTotalNf)}
                  description={`${formatNumber(metrics.totalNotasPendentes)} nota(s) em aberto`}
                  icon={<DollarSign className="h-5 w-5" />}
                  accent="#3f8588"
                  active={activeKpi === 'pending'}
                  onClick={() => scrollToSection('pendencias', 'pending')}
                />
              )}
              <KPICard
                label="Filial em destaque"
                value={topBranch ? `${formatNumber(topBranch.entregas)} ent.` : '0'}
                description={topBranch?.name || 'Sem dados no período'}
                icon={<Building2 className="h-5 w-5" />}
                accent="#657e9a"
                active={activeKpi === 'branch'}
                onClick={() => scrollToSection('filiais', 'branch')}
              />
              <KPICard
                label="Motorista destaque"
                value={topDriver ? `${formatNumber(topDriver.entregas)} ent.` : '0'}
                description={topDriver?.name || 'Sem dados no período'}
                icon={<UserRound className="h-5 w-5" />}
                accent="#b28a52"
                active={activeKpi === 'driver'}
                onClick={() => scrollToSection('motoristas', 'driver')}
              />
              <KPICard
                label="Volumes transportados"
                value={formatNumber(metrics.totalVolumes)}
                description={`${formatNumber(totalDeliveries)} entregas no período`}
                icon={<Boxes className="h-5 w-5" />}
                accent="#7581a3"
                active={activeKpi === 'volumes'}
                onClick={() => scrollToSection('entregas', 'volumes')}
              />
            </section>

            <section id="entregas" className="scroll-mt-28 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                    Operação
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-800">
                    Desempenho das entregas
                  </h2>
                </div>
                <span className="rounded-full border border-white/80 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                  {formatNumber(totalDeliveries)} entregas · {formatNumber(metrics.totalVolumes)} volumes
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                {metrics.otifTimeSeries.some((point) => point.value !== null) ? (
                  <OTIFLineChart data={metrics.otifTimeSeries} height={360} />
                ) : (
                  <EmptyPanel message="Sem dados de entrega neste período." />
                )}
                {metrics.returnTrend.some(
                  (point) => point.returns > 0 || point.successRate !== null
                ) ? (
                  <ReturnTrendChart data={metrics.returnTrend} height={360} />
                ) : (
                  <EmptyPanel message="A evolução aparecerá quando houver viagens no período." />
                )}
              </div>
            </section>

            <section id="filiais" className="scroll-mt-28 space-y-4">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                  Rede
                </p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-800">
                  Resultado por filial
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Selecione uma filial no gráfico para cruzar os indicadores.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                {metrics.entregasPorFilial.length ? (
                  <FilialVolumeChart
                    data={metrics.entregasPorFilial}
                    height={360}
                    onSelectBranch={setSelectedBranch}
                  />
                ) : (
                  <EmptyPanel message="Não há entregas por filial para o filtro selecionado." />
                )}
                {hasPendingSheet && metrics.topCarriersDelay.length > 0 && (
                  <CarrierDelayBarChart data={metrics.topCarriersDelay} height={360} />
                )}
                {hasPendingSheet &&
                  metrics.filialReturnData.some((item) => item.returns > 0) && (
                    <FilialReturnChart data={metrics.filialReturnData} height={360} />
                  )}
              </div>
            </section>

            <section id="motoristas" className="scroll-mt-28 space-y-4">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
                  Equipe
                </p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-800">
                  Produtividade dos motoristas
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                {metrics.entregasPorMotorista.length ? (
                  <MotoristaVolumeChart data={metrics.entregasPorMotorista} height={360} />
                ) : (
                  <EmptyPanel message="Não há entregas por motorista para o filtro selecionado." />
                )}
                {hasPendingSheet &&
                  metrics.driverReturnData.some((item) => item.returns > 0) && (
                    <MotoristaReturnChart data={metrics.driverReturnData} height={360} />
                  )}
              </div>
            </section>

            {hasPendingSheet && (
              <section id="pendencias" className="scroll-mt-28 space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">
                      Acompanhamento
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-800">
                      Pendências e ocorrências
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/80 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                    {formatNumber(metrics.totalNotasPendentes)} notas no período
                  </span>
                </div>
                {hasReturnReasons ? (
                  <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                    <ReturnReasonsDoughnutChart data={metrics.returnReasons} height={360} />
                    {hasOccurrences && (
                      <div id="ocorrencias" className="scroll-mt-28">
                        <OcorrenciasTable data={metrics.entregasComOcorrencia} />
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyPanel message="Não há ocorrências registradas neste período." />
                )}
              </section>
            )}

            {metrics.availableBranches.length === 0 && (
              <div className="neo-card flex items-center gap-3 rounded-2xl border border-amber-200/70 px-5 py-4 text-sm text-amber-800">
                <Truck className="h-5 w-5 shrink-0" />
                Nenhuma viagem foi encontrada para o período selecionado.
              </div>
            )}

            {!hasPendingSheet && (
              <p className="px-1 text-xs text-slate-400">
                A aba Pendencias não está disponível nesta planilha; os indicadores e gráficos
                relacionados a pendências foram ocultados.
              </p>
            )}

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300/50 px-1 pt-4 text-[10px] font-medium text-slate-400">
              <span>Indicadores calculados a partir dos dados da pasta de trabalho.</span>
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="h-3 w-3" />
                Clique nos gráficos e cartões para explorar
              </span>
            </footer>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
