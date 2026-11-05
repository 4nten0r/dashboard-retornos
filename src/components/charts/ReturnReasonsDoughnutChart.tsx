'use client';

import { EChartsOption } from 'echarts';
import { ChartCard } from '@/components/ui/ChartCard';

interface ReturnReasonsDoughnutChartProps {
  data: Array<{ name: string; value: number; percentage: number }>;
  height?: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

export function ReturnReasonsDoughnutChart({ data, height = 320 }: ReturnReasonsDoughnutChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const chartData = sortedData.map((d, i) => ({
    name: d.name,
    value: d.value,
    percentage: d.percentage,
    itemStyle: {
      color: COLORS[i % COLORS.length],
      borderColor: '#fff',
      borderWidth: 2,
    },
    emphasis: {
      itemStyle: {
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowBlur: 10,
        shadowOffsetY: 4,
      },
    },
  }));

  const total = sortedData.reduce((sum, d) => sum + d.value, 0);

  const option: EChartsOption = {
    color: COLORS,
    legend: {
      show: true,
      orient: 'vertical',
      right: 20,
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14,
      textStyle: {
        color: '#334155',
        fontSize: 12,
        fontWeight: 500,
        padding: [0, 0, 0, 8],
      },
      formatter: (name: string) => {
        const item = sortedData.find((d) => d.name === name);
        return item ? `${name} (${item.percentage}%)` : name;
      },
      tooltip: {
        show: true,
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#f8fafc', fontSize: 12 },
        extraCssText: 'border-radius: 8px;',
        formatter: (params: any) => {
          const item = sortedData.find((d) => d.name === params.name);
          return item ? `<div class="font-medium text-slate-100">${item.name}</div><div class="mt-1 text-slate-400">${item.value.toLocaleString()} notas · ${item.percentage}%</div>` : '';
        },
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: any) =>
        `<strong>${params.name}</strong><br/>${Number(params.value).toLocaleString('pt-BR')} notas · ${params.percent}%`,
    },
    series: [
      {
        name: 'Ocorrências',
        type: 'pie',
        radius: ['55%', '78%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 4,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
        },
        data: chartData,
      },
    ],
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `${total.toLocaleString()}`,
        font: 'bold 36px Inter, system-ui',
        fill: '#0f172a',
      },
    },
  };

  return <ChartCard title="Ocorrências registradas nas notas pendentes" option={option} height={height} />;
}