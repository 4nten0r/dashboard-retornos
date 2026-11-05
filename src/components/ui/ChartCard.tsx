'use client';

import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';
import { BarChart3, Camera, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  option: EChartsOption;
  className?: string;
  height?: number;
  subtitle?: string;
  onChartReady?: (chart: ECharts) => void;
  onEvents?: Record<string, (params: unknown) => void>;
}

export function ChartCard({
  title,
  option,
  className,
  height = 320,
  subtitle,
  onChartReady,
  onEvents,
}: ChartCardProps) {
  const mergedOption: EChartsOption = {
    color: ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6'],
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 650,
    animationDurationUpdate: 450,
    animationEasing: 'cubicOut',
    tooltip: { confine: true, transitionDuration: 0.2 },
    toolbox: {
      show: true,
      right: 0,
      top: 0,
      itemSize: 14,
      itemGap: 8,
      iconStyle: { borderColor: '#94a3b8' },
      emphasis: { iconStyle: { borderColor: '#0284c7' } },
      feature: {
        restore: { title: 'Restaurar visualização' },
        saveAsImage: { title: 'Salvar gráfico', pixelRatio: 2, backgroundColor: '#edf2f8' },
      },
    },
    ...option,
  };

  return (
    <section
      className={cn(
        'neo-card min-w-0 overflow-hidden rounded-[1.4rem] border border-white/70 p-4 transition-all duration-300 sm:p-5',
        className
      )}
    >
      <header className="mb-1 flex min-h-12 items-start gap-3 pr-20">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf0f6] text-sky-600 shadow-[inset_2px_2px_5px_#d4dce6,inset_-2px_-2px_5px_#ffffff]">
          <BarChart3 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-5 text-slate-800 sm:text-[15px]">{title}</h2>
          {subtitle && <p className="mt-1 text-[11px] leading-4 text-slate-400">{subtitle}</p>}
        </div>
      </header>
      <div className="neo-chart relative" style={{ height }}>
        <ReactECharts
          option={mergedOption}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge
          lazyUpdate
          autoResize
          onChartReady={onChartReady}
          onEvents={onEvents}
        />
        <div className="pointer-events-none absolute bottom-1 right-1 flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-300">
          <RotateCcw className="h-2.5 w-2.5" />
          <span className="sr-only">Use as ferramentas do gráfico para restaurar a visualização</span>
        </div>
      </div>
    </section>
  );
}
