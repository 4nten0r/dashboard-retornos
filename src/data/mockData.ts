import type {
  DriverReturnData,
  FilialReturnData,
  PeriodOption,
  ReturnReasonKPI,
  ReturnTrendPoint,
} from '@/types/dashboard';
import type { DashboardMetrics } from '@/lib/data-service';

export const periodOptions: { value: PeriodOption; label: string; days: number }[] = [
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
  { value: '90d', label: 'Últimos 90 dias', days: 90 },
  { value: '6m', label: 'Últimos 6 meses', days: 180 },
  { value: '12m', label: 'Últimos 12 meses', days: 365 },
  { value: 'ytd', label: 'Ano atual', days: 365 },
];

export function getFallbackMetrics(periodDays: number = 30): DashboardMetrics {
  const filiais = [
    { name: 'Filial São Paulo (Matriz)', entregas: 1420, volumes: 18450 },
    { name: 'Filial Curitiba', entregas: 980, volumes: 12300 },
    { name: 'Filial Belo Horizonte', entregas: 875, volumes: 10420 },
    { name: 'Filial Rio de Janeiro', entregas: 790, volumes: 9680 },
    { name: 'Filial Campinas', entregas: 640, volumes: 8150 },
    { name: 'Filial Porto Alegre', entregas: 530, volumes: 6920 },
    { name: 'Filial Goiânia', entregas: 410, volumes: 5310 },
  ];

  const motoristas = [
    { name: 'Carlos Eduardo Silva', entregas: 284, volumes: 3820 },
    { name: 'Marcos Roberto Santos', entregas: 265, volumes: 3490 },
    { name: 'José Antonio Pereira', entregas: 242, volumes: 3180 },
    { name: 'Fernando Henrique Souza', entregas: 228, volumes: 2990 },
    { name: 'Rodrigo Alves Costa', entregas: 215, volumes: 2840 },
    { name: 'Alexandre Barbosa Lima', entregas: 198, volumes: 2610 },
    { name: 'Paulo Cesar Ramos', entregas: 186, volumes: 2450 },
  ];

  const returnReasons = [
    { name: 'Destinatário Ausente', value: 78, percentage: 35.8 },
    { name: 'Endereço Não Localizado', value: 45, percentage: 20.6 },
    { name: 'Recusa por Avaria', value: 34, percentage: 15.6 },
    { name: 'Horário de Entrega Excedido', value: 28, percentage: 12.8 },
    { name: 'Pedido em Desacordo', value: 18, percentage: 8.3 },
    { name: 'Outros Motivos', value: 15, percentage: 6.9 },
  ];

  const topCarriersDelay = [
    { name: 'Filial Rio de Janeiro', delayRate: 8.4, totalShipments: 790 },
    { name: 'Filial Belo Horizonte', delayRate: 6.8, totalShipments: 875 },
    { name: 'Filial Goiânia', delayRate: 6.1, totalShipments: 410 },
    { name: 'Filial Campinas', delayRate: 4.5, totalShipments: 640 },
    { name: 'Filial São Paulo (Matriz)', delayRate: 3.2, totalShipments: 1420 },
  ];

  // Generate return reasons KPIs with colors
  const returnReasonKPIs: ReturnReasonKPI[] = [
    { id: 'ra', label: 'Destinatário Ausente', value: 78, percentage: 35.8, color: '#ef4444', description: '78 retornos por ausência' },
    { id: 'nl', label: 'Endereço Não Localizado', value: 45, percentage: 20.6, color: '#f97316', description: '45 retornos por endereço inválido' },
    { id: 'rav', label: 'Recusa por Avaria', value: 34, percentage: 15.6, color: '#fbbf24', description: '34 retornos por recusa de avaria' },
    { id: 'het', label: 'Horário Excedido', value: 28, percentage: 12.8, color: '#34d399', description: '28 retornos por horário excedido' },
    { id: 'des', label: 'Pedido em Desacordo', value: 18, percentage: 8.3, color: '#6366f1', description: '18 retornos por desacordo' },
    { id: 'out', label: 'Outros Motivos', value: 15, percentage: 6.9, color: '#a855f7', description: '15 retornos por outros motivos' },
  ];

  // Generate return trend time series
  const now = new Date();
  const returnTrend: ReturnTrendPoint[] = [];
  const points = Math.min(periodDays, 30);
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    // Simulated return trend: decreasing over time with some variation
    const base = 25 - (i * 0.3);
    const variation = Math.sin(i * 0.5) * 3;
    const jitter = ((i * 13) % 5) * 1.5 - 2;
    const returns = Math.max(1, Math.floor(base + variation + jitter));
    const rateVariation = (((i * 7) % 10) - 4.5) / 10;
    const successRate = Number((95 - i * 0.3 + rateVariation).toFixed(1));
    returnTrend.push({ date: dateStr, returns, successRate });
  }

  // Filial return data
  const filialReturnData: FilialReturnData[] = filiais.map((f, i) => ({
    name: f.name,
    deliveries: f.entregas,
    returns: Math.floor(f.entregas * (0.04 + i * 0.005)),
    returnRate: Number(((0.04 + i * 0.005) * 100).toFixed(1)),
    volumes: f.volumes,
  }));

  // Driver return data
  const driverReturnData: DriverReturnData[] = motoristas.map((m, i) => ({
    name: m.name,
    deliveries: m.entregas,
    returns: Math.floor(m.entregas * (0.03 + i * 0.003)),
    returnRate: Number(((0.03 + i * 0.003) * 100).toFixed(1)),
    volumes: m.volumes,
  }));

  const entregasComOcorrencia = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
    return {
      nf: `NF-${100001 + index}`,
      filial: filiais[index % filiais.length].name,
      motorista: motoristas[index % motoristas.length].name,
      data: date.toLocaleDateString('pt-BR'),
      volumes: index + 1,
      ocorrencia: returnReasons[index % returnReasons.length].name,
      cidade: ['São Paulo', 'Curitiba', 'Belo Horizonte', 'Rio de Janeiro'][index % 4],
      regiao: 'Sudeste',
    };
  });

  const totalVolumes = filiais.reduce((acc, f) => acc + f.volumes, 0);

  return {
    taxaSucesso: 94.6,
    taxaAtraso: 5.4,
    valorTotalNf: 1284750.0,
    totalNotasPendentes: 218,
    otifTimeSeries: returnTrend.map(p => ({ date: p.date, value: p.successRate })),
    topCarriersDelay,
    returnReasons,
    returnReasonKPIs,
    returnTrend,
    filialReturnData,
    driverReturnData,
    entregasPorFilial: filiais,
    entregasPorMotorista: motoristas,
    totalVolumes,
    entregasComOcorrencia,
    lastUpdated: new Date().toISOString(),
    periodDays,
    isMock: true,
  };
}
