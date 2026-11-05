'use client';

import { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';

interface OTIFLineChartProps {
  data: Array<{ date: string; value: number | null }>;
  height?: number;
}

export function OTIFLineChart({ data, height = 320 }: OTIFLineChartProps) {
  const dates = data.map((d) => d.date);
  const chartValues = data.map((d) => d.value);
  const values = chartValues.filter((value): value is number => value !== null);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const padding = (maxValue - minValue) * 0.15 || 1;

  const option: EChartsOption = {
    grid: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: '#e2e8f0' },
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        margin: 12,
        hideOverlap: true,
      },
    },
    yAxis: {
      type: 'value',
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { color: '#f1f5f9', type: 'dashed' },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value}%',
        margin: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#f8fafc', fontSize: 13 },
      extraCssText: 'box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2); border-radius: 12px;',
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#334155', width: 1, type: 'dashed' },
        label: {
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderColor: '#1e293b',
          borderWidth: 1,
        },
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `<div class="font-medium text-slate-100">${p.name}</div><div class="mt-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background:#0ea5e9"></span><span>Taxa de sucesso: <strong>${p.value}%</strong></span></div>`;
      },
    },
    dataZoom:
      dates.length > 10
        ? [
            {
              type: 'inside',
              xAxisIndex: 0,
              zoomOnMouseWheel: true,
              moveOnMouseMove: true,
            },
            {
              type: 'slider',
              xAxisIndex: 0,
              height: 14,
              bottom: 3,
              borderColor: 'transparent',
              fillerColor: 'rgba(14, 165, 233, 0.14)',
              handleStyle: { color: '#0ea5e9', borderColor: '#0ea5e9' },
              textStyle: { color: '#94a3b8' },
            },
          ]
        : undefined,
    series: [
      {
        name: 'Taxa de sucesso',
        type: 'line',
        data: chartValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#0ea5e9',
          width: 3,
          shadowColor: 'rgba(14, 165, 233, 0.3)',
          shadowBlur: 8,
          shadowOffsetY: 4,
        },
        itemStyle: {
          color: '#0ea5e9',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14, 165, 233, 0.18)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0.02)' },
            ],
          },
        },
        emphasis: {
          focus: 'series',
          itemStyle: { borderWidth: 4 },
          lineStyle: { width: 4 },
        },
      },
    ],
  };

  return (
    <ChartCard
      title="Evolução da taxa de entregas concluídas"
      subtitle="Percentual de viagens concluídas por dia."
      option={option}
      height={height}
    />
  );
}