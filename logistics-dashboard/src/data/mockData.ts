import type { PeriodOption, DashboardData } from '@/types/dashboard';
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

  // Generate time series OTIF
  const now = new Date();
  const otifTimeSeries: Array<{ date: string; value: number }> = [];
  const points = Math.min(periodDays, 30);
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    // realistic OTIF between 91% and 97%
    const base = 94.2;
    const wave = Math.sin(i * 0.4) * 2.1;
    const jitter = ((i * 17) % 7) * 0.25 - 0.75;
    const val = Number((base + wave + jitter).toFixed(1));
    otifTimeSeries.push({ date: dateStr, value: Math.min(99, Math.max(88, val)) });
  }

  const entregasComOcorrencia = [
    {
      nf: '001.482.910',
      filial: 'Filial São Paulo',
      motorista: 'Carlos Eduardo Silva',
      data: new Date(now.getTime() - 1 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 12,
      ocorrencia: 'Destinatário Ausente - 1ª Tentativa',
      cidade: 'Campinas',
      regiao: 'SP',
    },
    {
      nf: '001.482.885',
      filial: 'Filial Rio de Janeiro',
      motorista: 'Marcos Roberto Santos',
      data: new Date(now.getTime() - 1 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 4,
      ocorrencia: 'Endereço Não Localizado',
      cidade: 'Niterói',
      regiao: 'RJ',
    },
    {
      nf: '001.482.764',
      filial: 'Filial Belo Horizonte',
      motorista: 'José Antonio Pereira',
      data: new Date(now.getTime() - 2 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 18,
      ocorrencia: 'Recusa por Avaria na Embalagem',
      cidade: 'Contagem',
      regiao: 'MG',
    },
    {
      nf: '001.482.691',
      filial: 'Filial Curitiba',
      motorista: 'Fernando Henrique Souza',
      data: new Date(now.getTime() - 2 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 8,
      ocorrencia: 'Horário de Entrega Excedido',
      cidade: 'São José dos Pinhais',
      regiao: 'PR',
    },
    {
      nf: '001.482.512',
      filial: 'Filial São Paulo',
      motorista: 'Rodrigo Alves Costa',
      data: new Date(now.getTime() - 3 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 25,
      ocorrencia: 'Pedido em Desacordo com NF',
      cidade: 'Guarulhos',
      regiao: 'SP',
    },
    {
      nf: '001.482.490',
      filial: 'Filial Goiânia',
      motorista: 'Paulo Cesar Ramos',
      data: new Date(now.getTime() - 4 * 86400000).toLocaleDateString('pt-BR'),
      volumes: 6,
      ocorrencia: 'Destinatário Ausente - 2ª Tentativa',
      cidade: 'Aparecida de Goiânia',
      regiao: 'GO',
    },
  ];

  const totalVolumes = filiais.reduce((acc, f) => acc + f.volumes, 0);

  return {
    taxaSucesso: 94.6,
    taxaAtraso: 5.4,
    valorTotalNf: 1284750.0,
    totalNotasPendentes: 218,
    otifTimeSeries,
    topCarriersDelay,
    returnReasons,
    entregasPorFilial: filiais,
    entregasPorMotorista: motoristas,
    totalVolumes,
    entregasComOcorrencia,
    lastUpdated: new Date().toISOString(),
    periodDays,
  };
}
