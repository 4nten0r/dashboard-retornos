'use client';

import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  option: EChartsOption;
  className?: string;
  height?: number;
  onChartReady?: (chart: ECharts) => void;
}

function getNeumorphismContainerStyle() {
  return {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
  };
}

function getNeumorphismHeaderStyle() {
  return {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  };
}

function getNeumorphismContentStyle() {
  return {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
  };
}

export function ChartCard({ title, option, className, height = 320, onChartReady }: ChartCardProps) {
  const mergedOption = {
    ...option,
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
  };

  return (
    <div className={cn('neumorphism-card', className)} style={getNeumorphismContainerStyle()}>
      <div className="card-header" style={getNeumorphismHeaderStyle()}>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="card-content pt-0" style={getNeumorphismContentStyle()}>
        <div style={{ width: '100%', height: `${height}px` }}>
          <ReactECharts
            option={mergedOption}
            style={{ width: '100%', height: '100%' }}
            notMerge={false}
            onChartReady={onChartReady}
          />
        </div>
      </div>
    </div>
  );
}