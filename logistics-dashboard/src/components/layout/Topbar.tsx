'use client';

import { cn } from '@/lib/utils';
import { User, ChevronDown, Menu, Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { periodOptions } from '@/data/mockData';
import type { PeriodOption } from '@/types/dashboard';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  currentPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

export function Topbar({ title, onMenuClick, currentPeriod, onPeriodChange }: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPeriodLabel = periodOptions.find((p) => p.value === currentPeriod)?.label || currentPeriod;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" aria-label="Abrir menu"><Menu className="w-6 h-6" /></button>
          <div className="hidden sm:block"><h1 className="text-xl font-semibold text-slate-900">{title}</h1></div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="relative" ref={periodRef}>
            <button onClick={() => setPeriodOpen(!periodOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-w-[180px] justify-between" aria-haspopup="listbox" aria-expanded={periodOpen}><span className="truncate">{currentPeriodLabel}</span><ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', periodOpen && 'rotate-180')} /></button>
            {periodOpen && <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in-0 zoom-in-95">{periodOptions.map((period) => (<button key={period.value} onClick={() => { onPeriodChange(period.value); setPeriodOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">{period.label}</button>))}</div>}
          </div>
          <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors lg:hidden"><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span></button>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-haspopup="true" aria-expanded={profileOpen}><div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center"><User className="w-5 h-5 text-sky-600" /></div><div className="hidden md:block text-left"><p className="text-sm font-medium text-slate-900">Antenor Hugo</p><p className="text-xs text-slate-500">Administrador</p></div><ChevronDown className={cn('w-4 h-4 text-slate-400 hidden md:block transition-transform', profileOpen && 'rotate-180')} /></button>
            {profileOpen && <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in-0 zoom-in-95"><div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-medium text-slate-900">Antenor Hugo</p><p className="text-xs text-slate-500">antenas.hugo@empresa.com</p></div><a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><User className="w-4 h-4" />Perfil</a><a href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Sun className="w-4 h-4" />Configurações</a><hr className="my-1 border-slate-100" /><button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" />Sair</button></div>}
          </div>
        </div>
      </div>
    </header>
  );
}