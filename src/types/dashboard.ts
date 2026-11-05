export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  format?: 'percentage' | 'currency' | 'number';
}

// New interface for return reason breakdown KPI
export interface ReturnReasonKPI {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  description: string;
}

// Interface for return trend time series
export interface ReturnTrendPoint {
  date: string;
  returns: number;
  successRate: number;
}

// Interface for filial return comparison
export interface FilialReturnData {
  name: string;
  deliveries: number;
  returns: number;
  returnRate: number;
  volumes: number;
}

// Interface for driver return comparison
export interface DriverReturnData {
  name: string;
  deliveries: number;
  returns: number;
  returnRate: number;
  volumes: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface CarrierData {
  name: string;
  delayRate: number;
  totalShipments: number;
}

export interface ReturnReasonData {
  name: string;
  value: number;
  percentage: number;
}

export interface FilialVolumeData {
  name: string;
  entregas: number;
  volumes: number;
}

export interface OcorrenciaEntregaData {
  nf: string;
  filial: string;
  motorista: string;
  data: string;
  volumes: number;
  ocorrencia: string;
  cidade?: string;
  regiao?: string;
}

export interface DashboardData {
  kpis: KPIMetric[];
  otifTimeSeries: TimeSeriesData[];
  topCarriersDelay: CarrierData[];
  returnReasons: ReturnReasonData[];
  entregasPorFilial: FilialVolumeData[];
  entregasPorMotorista: FilialVolumeData[];
  totalVolumes: number;
  entregasComOcorrencia: OcorrenciaEntregaData[];
  period: string;
}

export type PeriodOption = '7d' | '30d' | '90d' | '6m' | '12m' | 'ytd';

export interface PeriodOptionConfig {
  value: PeriodOption;
  label: string;
}