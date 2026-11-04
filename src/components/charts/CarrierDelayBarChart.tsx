'use client';

import { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';

interface CarrierDelayBarChartProps {
  data: Array<{ name: string; delayRate: number; totalShipments: number }>;
  height?: number;
}

export function CarrierDelayBarChart({ data, height = 320 }: CarrierDelayBarChartProps) {
  // Sort by delay rate descending for horizontal bar chart (highest at top)
  const sortedData = [...data].sort((a, b) => b.delayRate - a.delayRate);
  const names = sortedData.map((d) => d.name);
  const values = sortedData.map((d) => d.delayRate);
  const shipments = sortedData.map((d) => d.totalShipments);
  const maxValue = Math.max(1, ...values);

  const option: EChartsOption = {
    grid: {
      top: 20,
      right: 80,
      bottom: 20,
      left: 160,
    },
    xAxis: {
      type: 'value',
      max: maxValue * 1.25,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { color: '#f1f5f9', type: 'dashed' },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value}%',
        margin: 12,
      },
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#334155',
        fontSize: 12,
        fontWeight: 500,
        margin: 16,
        overflow: 'truncate',
        width: 140,
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
        type: 'shadow',
        shadowStyle: { color: 'rgba(14, 165, 233, 0.1)' },
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const idx = names.indexOf(p.name);
        return `<div class="font-medium text-slate-100">${p.name}</div><div class="mt-2 space-y-1"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background:#ef4444"></span><span>Notas atrasadas: <strong>${p.value}%</strong></span></div><div class="flex items-center gap-2 text-slate-400"><span class="w-2 h-2 rounded-full" style="background:#64748b"></span><span>Total de notas: <strong>${shipments[idx].toLocaleString()}</strong></span></div></div>`;
      },
    },
    series: [
      {
        name: 'Taxa de Atraso',
        type: 'bar',
        data: values.map((value, idx) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#fca5a5' },
                { offset: 1, color: '#ef4444' },
              ],
            },
            borderRadius: [0, 8, 8, 0],
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#f87171' },
                  { offset: 1, color: '#dc2626' },
                ],
              },
            },
          },
        })),
        barWidth: '60%',
        barCategoryGap: '30%',
        label: {
          show: true,
          position: 'right',
          offset: [8, 0],
          color: '#ef4444',
          fontSize: 12,
          fontWeight: 600,
          formatter: '{c}%',
        },
      },
    ],
  };

  return <ChartCard title="Filiais com maior índice de pendências atrasadas" option={option} height={height} />;
}