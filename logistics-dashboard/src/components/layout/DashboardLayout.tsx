'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';
import type { PeriodOption } from '@/types/dashboard';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPeriod?: PeriodOption;
  onPeriodChange?: (period: PeriodOption) => void;
}

export function DashboardLayout({ children, title = 'Dashboard', currentPeriod = '30d', onPeriodChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={cn('transition-all duration-300', 'lg:pl-64')}>
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          currentPeriod={currentPeriod}
          onPeriodChange={onPeriodChange || (() => {})}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}