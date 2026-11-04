'use client';

import { useState, useMemo } from 'react';
import type { OcorrenciaEntregaData } from '@/types/dashboard';
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface OcorrenciasTableProps {
  data: OcorrenciaEntregaData[];
}

export function OcorrenciasTable({ data }: OcorrenciasTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        (item.nf && item.nf.toLowerCase().includes(term)) ||
        (item.filial && item.filial.toLowerCase().includes(term)) ||
        (item.motorista && item.motorista.toLowerCase().includes(term)) ||
        (item.ocorrencia && item.ocorrencia.toLowerCase().includes(term)) ||
        (item.cidade && item.cidade.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="card p-6 col-span-1 lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-semibold text-slate-900">
              Entregas com Ocorrência (Insucessos e Devoluções)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Notas fiscais com registro de insucesso de entrega ou retorno no período
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por NF, motorista, motivo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-64"
            />
          </div>
          <span className="text-xs font-semibold bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-100 whitespace-nowrap">
            {filteredData.length} registro(s)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3">NF</th>
              <th className="py-2.5 px-3">Filial</th>
              <th className="py-2.5 px-3">Motorista</th>
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3 text-right">Volumes</th>
              <th className="py-2.5 px-3">Ocorrência</th>
              <th className="py-2.5 px-3">Cidade / UF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Nenhuma ocorrência encontrada.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={`${row.nf}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{row.nf || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.filial || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.motorista || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{row.data || '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {row.volumes?.toLocaleString('pt-BR') || 0}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block max-w-[280px] truncate text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium" title={row.ocorrencia}>
                      {row.ocorrencia || 'Não informado'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {[row.cidade, row.regiao].filter(Boolean).join(' - ') || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <div>
            Página <span className="font-medium text-slate-900">{currentPage}</span> de{' '}
            <span className="font-medium text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
