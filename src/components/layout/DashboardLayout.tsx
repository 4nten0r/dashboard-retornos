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
  showPending?: boolean;
  showOccurrences?: boolean;
}

export function DashboardLayout({
  children,
  title = 'Dashboard',
  currentPeriod = '30d',
  onPeriodChange,
  showPending = false,
  showOccurrences = false,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#e1eceb]">
      <Sidebar
        open={sidebarOpen}
        showPending={showPending}
        showOccurrences={showOccurrences}
        onNavigate={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar navegação"
        />
      )}
      <div className={cn('min-h-screen transition-all duration-300', 'lg:pl-64')}>
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          currentPeriod={currentPeriod}
          onPeriodChange={onPeriodChange || (() => {})}
        />
        <main id="dashboard-main" className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}