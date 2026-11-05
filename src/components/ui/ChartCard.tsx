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
    color: ['#438f91', '#69a69a', '#c69860', '#bb7272', '#7d88a5', '#65aaa4'],
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
        saveAsImage: { title: 'Salvar gráfico', pixelRatio: 2, backgroundColor: '#eaf2f1' },
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
      <header className="mb-2 flex min-h-[68px] items-start gap-3 pr-14 sm:pr-16">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e4efee] text-teal-700 shadow-[inset_2px_2px_5px_#c7d8d6,inset_-2px_-2px_5px_#f8fcfb]">
          <BarChart3 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[13px] font-bold leading-[1.2rem] text-slate-800 sm:text-[15px]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="neo-chart relative min-h-[280px]" style={{ height }}>
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
