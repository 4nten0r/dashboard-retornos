import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Central de Indicadores Logísticos | Dias+',
  description: 'Dashboard analítico de logística integrado ao ERP Diaslog e Google Sheets.',
  keywords: ['logística', 'dashboard', 'OTIF', 'transportadoras', 'analytics', 'KPI', 'Dias+'],
  authors: [{ name: 'Dias+ Logística' }],
  openGraph: {
    title: 'Central de Indicadores Logísticos | Dias+',
    description: 'Dashboard analítico de logística em tempo real',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
