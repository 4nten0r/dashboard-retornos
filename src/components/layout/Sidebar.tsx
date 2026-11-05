'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  PackageCheck,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  showPending: boolean;
  showOccurrences: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, showPending, showOccurrences, onNavigate }: SidebarProps) {
  const [activeSection, setActiveSection] = useState('visao-geral');

  useEffect(() => {
    const sections = ['visao-geral', 'entregas', 'filiais', 'motoristas'];
    if (showPending) sections.push('pendencias');
    if (showOccurrences) sections.push('ocorrencias');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [showPending, showOccurrences]);

  const navigation = [
    { name: 'Visão geral', href: '#visao-geral', id: 'visao-geral', icon: LayoutDashboard },
    { name: 'Desempenho', href: '#entregas', id: 'entregas', icon: Activity },
    { name: 'Filiais', href: '#filiais', id: 'filiais', icon: BarChart3 },
    { name: 'Motoristas', href: '#motoristas', id: 'motoristas', icon: Truck },
    ...(showPending
      ? [
          { name: 'Pendências', href: '#pendencias', id: 'pendencias', icon: PackageCheck },
        ]
      : []),
    ...(showOccurrences
      ? [{ name: 'Ocorrências', href: '#ocorrencias', id: 'ocorrencias', icon: RotateCcw }]
      : []),
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/70 bg-[#e1eceb]/95 px-4 py-5 shadow-[10px_0_30px_rgba(75,111,111,0.12)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <Link href="#visao-geral" onClick={onNavigate} className="mb-9 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4efee] text-teal-700 shadow-[5px_5px_10px_#bfd1cf,-5px_-5px_10px_#f8fcfb]">
          <Truck className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-base font-bold tracking-tight text-slate-800">Dias+ Logística</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Centro de operações
          </span>
        </span>
      </Link>

      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Workspace
      </p>
      <nav className="space-y-1.5" aria-label="Seções do dashboard">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[#e4efee] text-teal-800 shadow-[inset_3px_3px_7px_#bfd1cf,inset_-3px_-3px_7px_#f8fcfb]'
                  : 'text-slate-600 hover:bg-white/65 hover:text-slate-800 hover:shadow-[3px_3px_8px_rgba(165,190,188,0.45),-3px_-3px_8px_#fff]'
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-teal-700' : 'text-slate-400'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/70 bg-white/45 p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Dados em tempo real
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Sincronizado com as planilhas operacionais.
        </p>
      </div>
    </aside>
  );
}
