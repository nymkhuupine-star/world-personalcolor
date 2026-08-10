'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { Camera, Droplets, Eye, Sun, Upload, X } from 'lucide-react';

export type UploadZoneHandle = { openFilePicker: () => void };

interface Props {
  previewUrl: string | null;
  cameraError: string | null;
  uploading: boolean;
  checking: boolean;
  analyzing: boolean;
  stageLabel: string | null;
  readyToPay: boolean;
  resultSeason: string | null;
  onOpenCamera: () => void;
  onFileSelect: (file: File) => void;
  onRemovePhoto: () => void;
}

const requirements = [
  {
    icon: Sun,
    label: 'Natural Light',
    tips: [
      { ok: true,  text: 'Stand facing a window during the day — even, shadow-free lighting' },
      { ok: false, text: 'Under indoor yellow/white bulbs — distorts natural skin tone' },
    ],
  },
  {
    icon: Droplets,
    label: 'No Makeup',
    tips: [
      { ok: true,  text: 'No foundation, toner, or mascara — a clean, bare face' },
      { ok: false, text: 'Photos with cream, blush, or lipstick — hides your natural complexion' },
    ],
  },
  {
    icon: Eye,
    label: 'Face Forward',
    tips: [
      { ok: true,  text: 'Look directly at the camera with your full face visible' },
      { ok: false, text: 'Turned to the side or partially visible face' },
    ],
  },
];

/** Drop/preview zone — take-a-photo trigger, drag & drop, file picker, and the photo-tips accordion. */
const UploadZone = forwardRef<UploadZoneHandle, Props>(function UploadZone(
  { previewUrl, cameraError, uploading, checking, analyzing, stageLabel, readyToPay, resultSeason,
    onOpenCamera, onFileSelect, onRemovePhoto },
  ref,
) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [activeTip, setActiveTip] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({ openFilePicker: () => fileRef.current?.click() }));

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  };

  const busyLabel = analyzing ? (stageLabel ?? 'Analyzing...') : checking ? 'Checking photo quality...' : 'Uploading photo...';

  return (
    <>
      {/* Upload zone */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 transition-all duration-300 hover:border-violet-300/70 hover:bg-violet-50/30"
        style={{ minHeight: '240px' }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Uploaded photo" fill unoptimized className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw" />
            {!readyToPay && !resultSeason && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemovePhoto(); }}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:border-violet-200 group-hover:shadow-md group-hover:shadow-violet-100/60">
              <Camera className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-violet-500" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-700">Add your photo</p>
              <p className="text-xs text-slate-500">A close-up portrait with your face clearly visible</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenCamera()}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-600"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                Take a Photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-600"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                Upload Photo
              </button>
            </div>
            {cameraError && <p className="px-6 text-center text-xs text-rose-400">{cameraError}</p>}
          </div>
        )}

        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/20 backdrop-blur-[3px]">
              <div className="scanning-laser" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-2.5 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-slate-600">{busyLabel}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          e.target.value = '';
        }} />

      {/* Tips — зураг оруулахаас өмнө л харагдана */}
      {!previewUrl && (
        <div className="space-y-2">
          <p className="text-center text-[10px] text-slate-400">Tap to see details</p>
          <div className="grid grid-cols-3 gap-2">
            {requirements.map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTip(activeTip === i ? null : i)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors ${
                  activeTip === i
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-slate-100/80 bg-white/60 hover:border-violet-200 hover:bg-violet-50/40'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${activeTip === i ? 'text-violet-500' : 'text-slate-500'}`} strokeWidth={1.5} />
                <span className={`text-center text-[11px] font-medium ${activeTip === i ? 'text-violet-600' : 'text-slate-600'}`}>{label}</span>
              </button>
            ))}
          </div>
          <div className={`overflow-hidden transition-all duration-200 ${activeTip !== null ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            {activeTip !== null && (
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 space-y-1.5">
                {requirements[activeTip].tips.map((t, j) => (
                  <div key={j} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className={`mt-0.5 shrink-0 font-bold ${t.ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {t.ok ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-600">{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default UploadZone;
