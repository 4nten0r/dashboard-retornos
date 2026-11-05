'use client';

import type { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';
import type { FilialReturnData } from '@/types/dashboard';

interface FilialReturnChartProps {
  data: FilialReturnData[];
  height?: number;
}

export function FilialReturnChart({ data, height = 340 }: FilialReturnChartProps) {
  const top = [...data].sort((a, b) => b.returns - a.returns).slice(0, 10);

  const option: EChartsOption = {
    grid: { top: 35, right: 55, bottom: 75, left: 50 },
    legend: {
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      data: top.map((item) => item.name),
      axisLabel: { color: '#64748b', fontSize: 10, interval: 0, rotate: 30 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
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
        name: 'Taxa (%)',
        min: 0,
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
        data: top.map((item) => item.returns),
        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Taxa de retorno',
        type: 'line',
        yAxisIndex: 1,
        data: top.map((item) => item.returnRate),
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: '#0284c7' },
        lineStyle: { color: '#0284c7', width: 2 },
      },
    ],
  };

  return <ChartCard title="Retornos por Filial" option={option} height={height} />;
}
