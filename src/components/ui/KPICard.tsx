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
        'neo-kpi group relative flex min-h-[156px] min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/80 p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:p-5',
        active && 'neo-kpi-active'
      )}
      style={{ transform: 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))' }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(255,255,255,0.72), transparent 70%)',
        }}
      />
      <span className="relative flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="line-clamp-2 min-h-8 text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-slate-500 sm:text-[11px]">
            {label}
          </span>
          <span className="mt-2 block break-words text-[clamp(1.25rem,2vw,1.75rem)] font-extrabold leading-tight tracking-tight text-slate-800 tabular-nums">
            {value}
          </span>
        </span>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e4efee] shadow-[5px_5px_10px_#bfd1cf,-5px_-5px_10px_#f8fcfb] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-[inset_3px_3px_7px_#bfd1cf,inset_-3px_-3px_7px_#f8fcfb] sm:h-11 sm:w-11"
          style={{ color: accent }}
        >
          {icon || <Target className="h-5 w-5" />}
        </span>
      </span>
      <span className="relative mt-auto flex min-w-0 items-start justify-between gap-2 pt-3">
        <span className="line-clamp-2 min-w-0 break-words text-[11px] font-medium leading-4 text-slate-600">
          {description}
        </span>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />
      </span>
      <span
        className="absolute bottom-0 left-5 right-5 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: accent }}
      />
    </button>
  );
}
