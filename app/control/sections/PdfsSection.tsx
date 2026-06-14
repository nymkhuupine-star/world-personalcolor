'use client';

import { useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Folder, Upload, CheckCircle, XCircle, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { REPORT_GROUPS, reportId, type SeasonKey } from '@/utils/reportPdfs';
import type { PdfStatuses } from '../types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Props = {
  pdfStatuses: PdfStatuses;
  pdfError: string | null;
  pdfUploading: string | null;
  pdfDeleting: string | null;
  pdfSuccess: string | null;
  expandedSeason: string | null;
  setExpandedSeason: (v: string | null) => void;
  handlePdfUpload: (season: SeasonKey, subtype: string, file: File) => void;
  handlePdfDelete: (season: SeasonKey, subtype: string) => void;
};

export default function PdfsSection({
  pdfStatuses, pdfError, pdfUploading, pdfDeleting, pdfSuccess,
  expandedSeason, setExpandedSeason, handlePdfUpload, handlePdfDelete,
}: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Шинжилгээний дараа имэйлээр илгээгдэх PDF тайлангуудыг энд оруулна уу.
        Улирал бүр дотроо 3 PDF файлтай (Light/True/Bright гэх мэт).
      </p>
      {pdfError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pdfError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORT_GROUPS.map(({ key, label, en, color, bg, border, subtypes }) => {
          const expanded = expandedSeason === key;
          const uploadedCount = subtypes.filter(s => pdfStatuses[reportId(key, s.key)]).length;
          return (
            <div key={key} className={`rounded-2xl border ${border} bg-white shadow-sm p-6`}>
              <button
                onClick={() => setExpandedSeason(expanded ? null : key)}
                className="flex w-full items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                    <Folder className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{en}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">{uploadedCount}/{subtypes.length}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                </div>
              </button>

              {expanded && (
                <div className="mt-4 space-y-3">
                  {subtypes.map(s => {
                    const id = reportId(key, s.key);
                    const exists = pdfStatuses[id];
                    const isUploading = pdfUploading === id;
                    const isSuccess = pdfSuccess === id;
                    return (
                      <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700">{s.label}</p>
                            <p className="text-[11px] text-slate-400">{key}/{s.key}.pdf</p>
                          </div>
                          {isSuccess ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Амжилттай</span>
                          ) : exists === true ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Байна</span>
                          ) : exists === false ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><XCircle className="h-4 w-4" strokeWidth={1.5} /> Байхгүй</span>
                          ) : null}
                        </div>
                        <input
                          ref={el => { fileRefs.current[id] = el; }}
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handlePdfUpload(key, s.key, f);
                            e.target.value = '';
                          }}
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => fileRefs.current[id]?.click()}
                            disabled={isUploading || pdfDeleting === id}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all ${
                              isUploading || pdfDeleting === id
                                ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                                : `border-current ${color} hover:${bg}`
                            }`}
                          >
                            {isUploading
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Хуулж байна...</>
                              : <><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />{exists ? 'PDF солих' : 'PDF оруулах'}</>}
                          </button>
                          {exists && (
                            <a
                              href={supabase.storage.from('reports').getPublicUrl(`${key}/${s.key}.pdf`).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                            >
                              Харах →
                            </a>
                          )}
                          {exists && (
                            <button
                              onClick={() => handlePdfDelete(key, s.key)}
                              disabled={pdfDeleting === id || isUploading}
                              title="Устгах"
                              className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {pdfDeleting === id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
