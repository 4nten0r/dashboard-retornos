import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LogiDash - Dashboard Logístico',
  description: 'Dashboard analítico de logística de alto nível para monitoramento de OTIF, transportadoras e devoluções.',
  keywords: ['logística', 'dashboard', 'OTIF', 'transportadoras', 'analytics', 'KPI'],
  authors: [{ name: 'LogiDash Team' }],
  openGraph: {
    title: 'LogiDash - Dashboard Logístico',
    description: 'Dashboard analítico de logística de alto nível',
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
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}