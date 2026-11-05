'use client';

import { useRef } from 'react';
import { ArrowUpRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  accent?: string;
  onClick?: () => void;
  active?: boolean;
}

export function KPICard({
  label,
  value,
  description,
  icon,
  accent = '#0284c7',
  onClick,
  active = false,
}: KPICardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch' || !cardRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltX = (0.5 - y) * 7;
    const tiltY = (x - 0.5) * 7;
    cardRef.current.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    cardRef.current.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    cardRef.current.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
    cardRef.current.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
  }

  function resetPointer() {
    cardRef.current?.style.setProperty('--tilt-x', '0deg');
    cardRef.current?.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-pressed={active}
      className={cn(
        'neo-kpi group relative min-w-0 overflow-hidden rounded-[1.35rem] border border-white/80 p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
        active && 'neo-kpi-active'
      )}
      style={{ transform: 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))' }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(255,255,255,0.82), transparent 70%)',
        }}
      />
      <span className="relative flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </span>
          <span className="mt-3 block truncate text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-800 tabular-nums sm:text-[1.85rem]">
            {value}
          </span>
        </span>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf0f6] shadow-[5px_5px_10px_#cbd4df,-5px_-5px_10px_#ffffff] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-[inset_3px_3px_7px_#cbd4df,inset_-3px_-3px_7px_#ffffff]"
          style={{ color: accent }}
        >
          {icon || <Target className="h-5 w-5" />}
        </span>
      </span>
      <span className="relative mt-4 flex min-h-5 items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-slate-500">{description}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-600" />
      </span>
      <span
        className="absolute bottom-0 left-5 right-5 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: accent }}
      />
    </button>
  );
}
