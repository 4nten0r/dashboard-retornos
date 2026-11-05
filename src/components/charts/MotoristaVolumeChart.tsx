'use client';

import { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';

interface MotoristaVolumeChartProps {
  data: Array<{ name: string; entregas: number; volumes: number }>;
  height?: number;
}

export function MotoristaVolumeChart({ data, height = 320 }: MotoristaVolumeChartProps) {
  const top = [...data].sort((a, b) => b.entregas - a.entregas).slice(0, 10);

  const option: EChartsOption = {
    grid: { top: 30, right: 20, bottom: 65, left: 55 },
    xAxis: {
      type: 'category',
      data: top.map((d) => d.name),
      axisLabel: { color: '#64748b', fontSize: 11, interval: 0, rotate: 28, hideOverlap: true },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      textStyle: { color: '#f8fafc', fontSize: 13 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const item = top.find((d) => d.name === p.name);
        return `<div><strong>${item?.name || p.name}</strong><br/>Entregas: <strong>${item?.entregas?.toLocaleString('pt-BR') || 0}</strong><br/>Volumes: <strong>${item?.volumes?.toLocaleString('pt-BR') || 0}</strong></div>`;
      },
    },
    series: [
      {
        name: 'Entregas',
        type: 'bar',
        data: top.map((d) => d.entregas),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#4ade80' },
              { offset: 1, color: '#16a34a' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          color: '#16a34a',
          fontWeight: 600,
          fontSize: 11,
          formatter: (p: any) => Number(p.value).toLocaleString('pt-BR'),
        },
      },
    ],
  };

  return (
    <ChartCard
      title="Top motoristas por volume de entregas"
      subtitle="Motoristas com mais entregas no período."
      option={option}
      height={height}
    />
  );
}
