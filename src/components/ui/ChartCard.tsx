'use client';

import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  option: EChartsOption;
  className?: string;
  height?: number;
  onChartReady?: (chart: ReactECharts) => void;
}

export function ChartCard({ title, option, className, height = 320, onChartReady }: ChartCardProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = chartRef.current?.getEchartsInstance().getDom();
    if (!container) return;

    const updateWidth = () => {
      const width = container.clientWidth;
      setContainerWidth(width);
    };

    updateWidth();

    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(container);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      onChartReady?.(chartRef.current);
    }
  }, [onChartReady]);

  const mergedOption = {
    ...option,
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
  };

  return (
    <div className={cn('card', className)}>
      <div className="card-header">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="card-content pt-0">
        <div style={{ width: '100%', height: `${height}px` }}>
          <ReactECharts
            ref={chartRef}
            option={mergedOption}
            style={{ width: '100%', height: '100%' }}
            notMerge={false}
          />
        </div>
      </div>
    </div>
  );
}