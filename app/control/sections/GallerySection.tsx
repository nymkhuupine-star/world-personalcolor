'use client';

import { useRef } from 'react';
import { Folder, Upload, Loader2, Trash2, ChevronDown, ImagePlus } from 'lucide-react';
import { REPORT_GROUPS, reportId, type SeasonKey } from '@/utils/reportPdfs';
import type { GalleryStatuses } from '../types';

type Props = {
  galleryStatuses: GalleryStatuses;
  galleryError: string | null;
  galleryUploading: string | null;
  galleryDeleting: string | null;
  expandedSeason: string | null;
  setExpandedSeason: (v: string | null) => void;
  handleGalleryUpload: (season: SeasonKey, subtype: string, file: File) => void;
  handleGalleryDelete: (season: SeasonKey, subtype: string, name: string) => void;
};

export default function GallerySection({
  galleryStatuses, galleryError, galleryUploading, galleryDeleting,
  expandedSeason, setExpandedSeason, handleGalleryUpload, handleGalleryDelete,
}: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Улирал бүрийн дэд төрөлд (Light/True/Bright гэх мэт) хэдэн ч жишиг зураг оруулж болно.
        Хэрэглэгч өнгөө тодорхойлуулж дуусмагц яг тэр өнгийн эдгээр зургууд шууд харагдана.
      </p>
      {galleryError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {galleryError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORT_GROUPS.map(({ key, label, en, color, bg, border, subtypes }) => {
          const expanded = expandedSeason === key;
          const totalImages = subtypes.reduce((sum, s) => sum + (galleryStatuses[reportId(key, s.key)]?.length ?? 0), 0);
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
                  <span className="text-xs font-semibold text-slate-400">{totalImages} зураг</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                </div>
              </button>

              {expanded && (
                <div className="mt-4 space-y-4">
                  {subtypes.map(s => {
                    const id = reportId(key, s.key);
                    const images = galleryStatuses[id] ?? [];
                    const isUploading = galleryUploading === id;
                    return (
                      <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700">{s.label}</p>
                            <p className="text-[11px] text-slate-400">{key}/{s.key}/gallery — {images.length} зураг</p>
                          </div>
                          <input
                            ref={el => { fileRefs.current[id] = el; }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleGalleryUpload(key, s.key, f);
                              e.target.value = '';
                            }}
                          />
                          <button
                            onClick={() => fileRefs.current[id]?.click()}
                            disabled={isUploading}
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-semibold transition-all ${
                              isUploading
                                ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                                : `border-current ${color} hover:${bg}`
                            }`}
                          >
                            {isUploading
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Хуулж байна...</>
                              : <><ImagePlus className="h-3.5 w-3.5" strokeWidth={1.5} /> Зураг нэмэх</>}
                          </button>
                        </div>

                        {images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {images.map(img => (
                              <div key={img.name} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                <button
                                  onClick={() => handleGalleryDelete(key, s.key, img.name)}
                                  disabled={galleryDeleting === `${id}/${img.name}`}
                                  title="Устгах"
                                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
                                >
                                  {galleryDeleting === `${id}/${img.name}`
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Trash2 className="h-3 w-3" strokeWidth={2} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {images.length === 0 && !isUploading && (
                          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-4 text-xs text-slate-400">
                            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} /> Одоогоор зураггүй
                          </div>
                        )}
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
