import type { PeriodOption } from '@/types/dashboard';

export const periodOptions: { value: PeriodOption; label: string; days: number }[] = [
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
  { value: '90d', label: 'Últimos 90 dias', days: 90 },
  { value: '6m', label: 'Últimos 6 meses', days: 180 },
  { value: '12m', label: 'Últimos 12 meses', days: 365 },
  { value: 'ytd', label: 'Ano atual', days: 365 },
];
