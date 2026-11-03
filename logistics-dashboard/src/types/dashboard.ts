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

export interface DashboardData {
  kpis: KPIMetric[];
  otifTimeSeries: TimeSeriesData[];
  topCarriersDelay: CarrierData[];
  returnReasons: ReturnReasonData[];
  period: string;
}

export type PeriodOption = '7d' | '30d' | '90d' | '6m' | '12m' | 'ytd';

export interface PeriodOptionConfig {
  value: PeriodOption;
  label: string;
}