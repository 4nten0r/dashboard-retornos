'use client';

import type { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';
import type { ReturnTrendPoint } from '@/types/dashboard';

interface ReturnTrendChartProps {
  data: ReturnTrendPoint[];
  height?: number;
}

export function ReturnTrendChart({ data, height = 340 }: ReturnTrendChartProps) {
  const option: EChartsOption = {
    grid: { top: 35, right: 55, bottom: 60, left: 50 },
    legend: {
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      data: data.map((point) => point.date),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Retornos',
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      {
        type: 'value',
        name: 'Sucesso (%)',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
      },
    ],
    tooltip: { trigger: 'axis' },
    series: [
      {
        name: 'Retornos',
        type: 'bar',
        yAxisIndex: 0,
        data: data.map((point) => point.returns),
        itemStyle: { color: '#fca5a5', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Taxa de sucesso',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((point) => point.successRate),
        smooth: true,
        symbolSize: 5,
        itemStyle: { color: '#0284c7' },
        lineStyle: { color: '#0284c7', width: 2 },
      },
    ],
  };

  return (
    <ChartCard
      title="Evolução de retornos e sucesso"
      subtitle="Volume de retornos e taxa diária de sucesso."
      option={option}
      height={height}
    />
  );
}
