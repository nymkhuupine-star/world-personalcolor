'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { Ban, Camera, Check, Droplets, Eye, Sun, Upload, X } from 'lucide-react';

export type UploadZoneHandle = { openFilePicker: () => void };

// Deterministic face-mesh grid — fixed layout so server/client renders match (no Math.random).
const MESH_COLS = 6;
const MESH_ROWS = 8;
// big.png is a near-square, front-facing portrait cropped to 1:1 (object-cover) —
// the face sits centered, slightly above the vertical midpoint.
const MESH_X0 = 30, MESH_X1 = 72;
const MESH_Y0 = 12, MESH_Y1 = 58;

function FaceScanOverlay() {
  const nodes: { x: number; y: number }[] = [];
  for (let r = 0; r <= MESH_ROWS; r++) {
    for (let c = 0; c <= MESH_COLS; c++) {
      const baseX = MESH_X0 + (c / MESH_COLS) * (MESH_X1 - MESH_X0);
      const baseY = MESH_Y0 + (r / MESH_ROWS) * (MESH_Y1 - MESH_Y0);
      const jitter = Math.sin((r * MESH_COLS + c) * 12.9898) * 1.6;
      nodes.push({ x: baseX + jitter, y: baseY + jitter * 0.6 });
    }
  }
  const at = (r: number, c: number) => nodes[r * (MESH_COLS + 1) + c];

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let r = 0; r <= MESH_ROWS; r++) {
    for (let c = 0; c <= MESH_COLS; c++) {
      const p = at(r, c);
      if (c < MESH_COLS) { const q = at(r, c + 1); lines.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y }); }
      if (r < MESH_ROWS) { const q = at(r + 1, c); lines.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y }); }
    }
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
      style={{
        WebkitMaskImage: 'radial-gradient(ellipse 22% 24% at 51% 37%, black 55%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 22% 24% at 51% 37%, black 55%, transparent 100%)',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="face-scan-mesh absolute inset-0 h-full w-full">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,0.55)" strokeWidth={0.15} />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={0.55}
            fill="#e9d5ff"
            className="face-scan-node"
            style={{ animationDelay: `${(i % 12) * 0.15}s` }}
          />
        ))}
      </svg>
      <div className="face-scan-line" />
    </div>
  );
}

interface Props {
  previewUrl: string | null;
  cameraError: string | null;
  uploading: boolean;
  checking: boolean;
  analyzing: boolean;
  stageLabel: string | null;
  readyToPay: boolean;
  /** Owned by Card so it can gate the questionnaire behind the same checklist. */
  guidanceDone: boolean;
  onGuidanceDone: () => void;
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
    label: 'Bare Face',
    tips: [
      { ok: true,  text: 'No makeup and no glasses — your natural skin tone and eyes fully visible' },
      { ok: false, text: 'Foundation, tinted lenses, or sunglasses — masks your true coloring' },
    ],
  },
  {
    icon: Ban,
    label: 'No Filters',
    tips: [
      { ok: true,  text: 'A raw, unedited photo straight from the camera' },
      { ok: false, text: 'Filters, beauty apps, or heavy editing — alters your true skin tone' },
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
  { previewUrl, cameraError, uploading, checking, analyzing, stageLabel, readyToPay,
    guidanceDone, onGuidanceDone, onOpenCamera, onFileSelect, onRemovePhoto },
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
      {/* Upload zone — photo card, echoes the polaroid-style hero visual.
          Outer wrapper has no overflow-hidden so the floating teaser card can spill past its edge. */}
      <div className="relative">
        <div
          className="group relative overflow-hidden rounded-[2rem] border border-dashed border-slate-200 bg-white/60 transition-all duration-300 hover:border-violet-300/70 hover:bg-violet-50/30"
          style={{ aspectRatio: '1 / 1' }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {previewUrl ? (
            <>
              <Image src={previewUrl} alt="Uploaded photo" fill unoptimized className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw" />
              {!readyToPay && (
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
            <>
              <Image src="/big.png" alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
              <FaceScanOverlay />
            </>
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

        {/* Floating teaser cards — overlaid on the model photo, pre-upload only */}
        {!previewUrl && (
          <>
            <div className="absolute inset-x-4 -bottom-2 z-10 space-y-2 rounded-2xl bg-white/90 p-3 shadow-xl backdrop-blur-md">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50">
                  <Camera className="h-3.5 w-3.5 text-violet-500" strokeWidth={1.5} />
                </div>
                <p className="text-xs font-bold text-slate-800">Add your photo</p>
                <p className="text-[11px] text-slate-500">A clear, natural photo works best</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCamera()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-600"
                >
                  <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                  Take a Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-600"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                  Upload Photo
                </button>
              </div>
              {cameraError && <p className="text-center text-xs text-rose-400">{cameraError}</p>}
            </div>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          e.target.value = '';
        }} />

      {/* Post-selection guidance — inline, right under the photo itself, so
          the selected photo stays fully visible instead of being buried under
          a blur + dark overlay + modal stack. */}
      {previewUrl && !readyToPay && (
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Photo selected
          </p>
          {!guidanceDone && (
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                  <p className="text-sm font-bold text-slate-800">Is your photo ready for analysis?</p>
                  <p className="mt-0.5 text-xs text-slate-500">Make sure your photo follows these guidelines for the most accurate result.</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {requirements.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                          <Icon className="h-3.5 w-3.5 text-violet-500" strokeWidth={1.75} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={onGuidanceDone}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200/70 transition-transform active:scale-[0.98]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
            )}
        </div>
      )}

      {/* Tips — зураг оруулахаас өмнө л харагдана */}
      {!previewUrl && (
        <div className="space-y-2">
          <p className="text-center text-[10px] text-slate-400">Tap to see details</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
