'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Menu } from 'lucide-react';
import { periodOptions } from '@/data/dashboardOptions';
import type { PeriodOption } from '@/types/dashboard';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  currentPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

export function Topbar({ title, onMenuClick, currentPeriod, onPeriodChange }: TopbarProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const currentPeriodLabel =
    periodOptions.find((period) => period.value === currentPeriod)?.label || currentPeriod;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[#e1eceb]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white/70 hover:text-slate-900 lg:hidden"
            aria-label="Abrir navegação"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
              Dias+ / Operações
            </p>
            <h1 className="truncate text-sm font-bold text-slate-800 sm:text-base">{title}</h1>
          </div>
        </div>

        <div className="relative shrink-0" ref={periodRef}>
          <button
            type="button"
            onClick={() => setPeriodOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-[#e4efee] px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-[4px_4px_9px_#bfd1cf,-4px_-4px_9px_#f8fcfb] transition hover:text-teal-800 sm:px-4 sm:text-sm"
            aria-haspopup="listbox"
            aria-expanded={periodOpen}
          >
            <CalendarDays className="h-4 w-4 text-teal-700" />
            <span className="max-w-32 truncate sm:max-w-none">{currentPeriodLabel}</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${periodOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {periodOpen && (
            <div
              role="listbox"
              aria-label="Selecionar período"
              className="absolute right-0 mt-3 w-52 rounded-2xl border border-white/80 bg-[#eaf2f1] p-2 shadow-[10px_10px_22px_#bfd1cf,-10px_-10px_22px_#f8fcfb]"
            >
              {periodOptions.map((period) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={period.value === currentPeriod}
                  key={period.value}
                  onClick={() => {
                    onPeriodChange(period.value);
                    setPeriodOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition sm:text-sm ${
                    period.value === currentPeriod
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-white/70'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
