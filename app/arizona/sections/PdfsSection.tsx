'use client';

import { useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Folder, Upload, CheckCircle, XCircle, Loader2, Trash2, ChevronDown, ImageIcon } from 'lucide-react';
import { REPORT_GROUPS, reportId, type SeasonKey } from '@/utils/reportPdfs';
import type { PdfStatuses, ImageStatuses } from '../types';

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
  imageStatuses: ImageStatuses;
  imageError: string | null;
  imageUploading: string | null;
  imageDeleting: string | null;
  imageSuccess: string | null;
  handleImageUpload: (season: SeasonKey, subtype: string, file: File) => void;
  handleImageDelete: (season: SeasonKey, subtype: string) => void;
};

export default function PdfsSection({
  pdfStatuses, pdfError, pdfUploading, pdfDeleting, pdfSuccess,
  expandedSeason, setExpandedSeason, handlePdfUpload, handlePdfDelete,
  imageStatuses, imageError, imageUploading, imageDeleting, imageSuccess,
  handleImageUpload, handleImageDelete,
}: Props) {
  const pdfFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const imageFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Шинжилгээний дараа имэйлээр илгээгдэх PDF тайлангууд болон улирал бүрийн жишиг зургийг энд оруулна уу.
        Улирал бүр дотроо 3 дэд төрөлтэй (Light/True/Bright гэх мэт), тус бүрдээ PDF болон зураг тусад нь байна.
      </p>
      {pdfError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pdfError}
        </div>
      )}
      {imageError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {imageError}
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
                    const pdfExists = pdfStatuses[id];
                    const isPdfUploading = pdfUploading === id;
                    const isPdfSuccess = pdfSuccess === id;
                    const imageExt = imageStatuses[id];
                    const isImageUploading = imageUploading === id;
                    const isImageSuccess = imageSuccess === id;
                    const imageUrl = imageExt
                      ? supabase.storage.from('reports').getPublicUrl(`${key}/${s.key}.${imageExt}`).data.publicUrl
                      : null;

                    return (
                      <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700">{s.label}</p>
                            <p className="text-[11px] text-slate-400">{key}/{s.key}</p>
                          </div>
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={s.label}
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                            />
                          )}
                        </div>

                        {/* PDF row */}
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500">PDF</span>
                          {isPdfSuccess ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Амжилттай</span>
                          ) : pdfExists === true ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Байна</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><XCircle className="h-4 w-4" strokeWidth={1.5} /> Байхгүй</span>
                          )}
                        </div>
                        <input
                          ref={el => { pdfFileRefs.current[id] = el; }}
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handlePdfUpload(key, s.key, f);
                            e.target.value = '';
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => pdfFileRefs.current[id]?.click()}
                            disabled={isPdfUploading || pdfDeleting === id}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all ${
                              isPdfUploading || pdfDeleting === id
                                ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                                : `border-current ${color} hover:${bg}`
                            }`}
                          >
                            {isPdfUploading
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Хуулж байна...</>
                              : <><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />{pdfExists ? 'PDF солих' : 'PDF оруулах'}</>}
                          </button>
                          {pdfExists && (
                            <a
                              href={supabase.storage.from('reports').getPublicUrl(`${key}/${s.key}.pdf`).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                            >
                              Харах →
                            </a>
                          )}
                          {pdfExists && (
                            <button
                              onClick={() => handlePdfDelete(key, s.key)}
                              disabled={pdfDeleting === id || isPdfUploading}
                              title="Устгах"
                              className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {pdfDeleting === id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
                            </button>
                          )}
                        </div>

                        {/* Image row */}
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500">Зураг</span>
                          {isImageSuccess ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Амжилттай</span>
                          ) : imageExt ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Байна</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><XCircle className="h-4 w-4" strokeWidth={1.5} /> Байхгүй</span>
                          )}
                        </div>
                        <input
                          ref={el => { imageFileRefs.current[id] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(key, s.key, f);
                            e.target.value = '';
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => imageFileRefs.current[id]?.click()}
                            disabled={isImageUploading || imageDeleting === id}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all ${
                              isImageUploading || imageDeleting === id
                                ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                                : `border-current ${color} hover:${bg}`
                            }`}
                          >
                            {isImageUploading
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Хуулж байна...</>
                              : <><ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} />{imageExt ? 'Зураг солих' : 'Зураг оруулах'}</>}
                          </button>
                          {imageUrl && (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                            >
                              Харах →
                            </a>
                          )}
                          {imageExt && (
                            <button
                              onClick={() => handleImageDelete(key, s.key)}
                              disabled={imageDeleting === id || isImageUploading}
                              title="Устгах"
                              className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {imageDeleting === id
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
