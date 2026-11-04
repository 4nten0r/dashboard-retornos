'use client';

import { Target } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

export function KPICard({ label, value, description, icon }: KPICardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
        <div className="p-3 bg-slate-100 rounded-xl">
          {icon || <Target className="w-6 h-6 text-slate-600" />}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-slate-500">{description}</span>
      </div>
    </div>
  );
}