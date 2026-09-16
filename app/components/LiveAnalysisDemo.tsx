'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MousePointerClick } from 'lucide-react';

type Season = {
  key: 'spring' | 'summer' | 'autumn' | 'winter';
  name: string;
  accent: string;
  imageFilter: string;
  overlay: string;
  contrastLabel: string;
  contrastPoint: { x: number; y: number };
  skinSmoothness: number;
  facialSymmetry: number;
  fifths: number[];
  fifthsScore: number;
  thirds: { upper: number; middle: number; lower: number; strongest: 'A' | 'B' | 'C' };
  lip: { ideal: number; you: number };
  sclera: number;
  hues: number[];
  satRange: [number, number];
};

const SEASONS: Season[] = [
  {
    key: 'spring',
    name: 'Warm Spring',
    accent: '#fb7185',
    imageFilter: 'saturate(1.2) brightness(1.06) contrast(1.03)',
    overlay: 'rgba(255,196,140,0.16)',
    contrastLabel: 'High Contrast Feminine',
    contrastPoint: { x: 0.64, y: 0.26 },
    skinSmoothness: 74,
    facialSymmetry: 91,
    fifths: [0.21, 0.19, 0.2, 0.19, 0.21],
    fifthsScore: 96,
    thirds: { upper: 0.32, middle: 0.35, lower: 0.33, strongest: 'B' },
    lip: { ideal: 0.55, you: 0.63 },
    sclera: 88,
    hues: [355, 25, 45, 130, 190, 280],
    satRange: [58, 74],
  },
  {
    key: 'summer',
    name: 'Soft Summer',
    accent: '#818cf8',
    imageFilter: 'saturate(0.94) brightness(1.05) contrast(1.0)',
    overlay: 'rgba(200,192,218,0.1)',
    contrastLabel: 'Low Contrast Feminine',
    contrastPoint: { x: 0.6, y: 0.7 },
    skinSmoothness: 68,
    facialSymmetry: 85,
    fifths: [0.19, 0.21, 0.2, 0.21, 0.19],
    fifthsScore: 92,
    thirds: { upper: 0.33, middle: 0.34, lower: 0.33, strongest: 'B' },
    lip: { ideal: 0.55, you: 0.52 },
    sclera: 82,
    hues: [340, 350, 210, 150, 260, 0],
    satRange: [28, 44],
  },
  {
    key: 'autumn',
    name: 'Soft Autumn',
    accent: '#c2703d',
    imageFilter: 'sepia(0.18) saturate(1.05) contrast(1.05) brightness(0.98)',
    overlay: 'rgba(200,140,80,0.16)',
    contrastLabel: 'Low Contrast Feminine',
    contrastPoint: { x: 0.54, y: 0.72 },
    skinSmoothness: 62,
    facialSymmetry: 88,
    fifths: [0.19, 0.21, 0.2, 0.21, 0.19],
    fifthsScore: 90,
    thirds: { upper: 0.3, middle: 0.34, lower: 0.37, strongest: 'B' },
    lip: { ideal: 0.55, you: 0.58 },
    sclera: 82,
    hues: [10, 30, 45, 90, 150, 25],
    satRange: [42, 58],
  },
  {
    key: 'winter',
    name: 'Cool Winter',
    accent: '#6366f1',
    imageFilter: 'saturate(1.25) contrast(1.12) brightness(1.0)',
    overlay: 'rgba(120,140,210,0.14)',
    contrastLabel: 'High Contrast Feminine',
    contrastPoint: { x: 0.66, y: 0.2 },
    skinSmoothness: 79,
    facialSymmetry: 94,
    fifths: [0.2, 0.2, 0.2, 0.2, 0.2],
    fifthsScore: 98,
    thirds: { upper: 0.34, middle: 0.33, lower: 0.33, strongest: 'A' },
    lip: { ideal: 0.55, you: 0.6 },
    sclera: 91,
    hues: [345, 0, 220, 160, 270, 210],
    satRange: [66, 82],
  },
];

function buildPalette(season: Season) {
  const lightness = [86, 70, 54, 38, 24];
  const colors: string[] = [];
  lightness.forEach((l, ri) => {
    const s = season.satRange[0] + ((season.satRange[1] - season.satRange[0]) * (ri / (lightness.length - 1)));
    season.hues.forEach((h) => {
      colors.push(`hsl(${h}, ${s}%, ${l}%)`);
    });
  });
  return colors;
}

function CardShell({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-slate-100/80 bg-white/95 p-4 backdrop-blur-sm ${className}`}
      style={{ boxShadow: '0 12px 34px rgba(0,0,0,0.06)' }}
    >
      {children}
    </div>
  );
}

function ValueBar({ value, accent, low, high }: { value: number; accent: string; low: string; high: string }) {
  return (
    <div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white"
          style={{ left: `${value}%`, background: accent, boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}
        />
        <div className="h-full rounded-full opacity-60" style={{ width: `${value}%`, background: accent }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] font-medium uppercase tracking-wide text-slate-400">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function Sparkline({ value, accent }: { value: number; accent: string }) {
  const x = 8 + (value / 100) * 224;
  return (
    <svg viewBox="0 0 240 46" className="w-full" preserveAspectRatio="none">
      <polyline
        points="8,34 40,30 72,36 104,22 136,28 168,14 200,20 232,10"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      <circle cx={x} cy={12} r="3.5" fill={accent} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function FifthsChart({ values, accent }: { values: number[]; accent: string }) {
  const labels = ['OUTER (A)', 'EYE (B)', 'CENTER (C)', 'EYE (D)', 'OUTER (E)'];
  const max = Math.max(...values);
  return (
    <div>
      <div className="flex h-16 items-end gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(v / max) * 100}%`, background: i === 2 ? accent : '#e2e8f0' }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[8px] font-medium leading-tight text-slate-400">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[9px] font-semibold text-slate-600">
        {values.map((v, i) => (
          <span key={i}>{v.toFixed(2)}</span>
        ))}
      </div>
    </div>
  );
}

function ContrastGrid({ point, accent }: { point: { x: number; y: number }; accent: string }) {
  const cols = 9;
  const rows = 9;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c / (cols - 1);
      const cy = r / (rows - 1);
      const d = Math.hypot(cx - point.x, cy - point.y);
      const opacity = Math.max(0, 1 - d * 2.6);
      cells.push(
        <div
          key={`${r}-${c}`}
          className="aspect-square rounded-[2px]"
          style={{ background: opacity > 0.06 ? accent : '#eef1f5', opacity: opacity > 0.06 ? opacity : 1 }}
        />
      );
    }
  }
  return (
    <div className="relative">
      <div className="mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">High Contrast</div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400" style={{ writingMode: 'vertical-rl' }}>Masculine</span>
        <div className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {cells}
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400" style={{ writingMode: 'vertical-rl' }}>Feminine</span>
      </div>
      <div className="mt-1 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">Low Contrast</div>
    </div>
  );
}

function ThirdsChart({ thirds, accent }: { thirds: Season['thirds']; accent: string }) {
  const rows: { label: string; key: 'A' | 'B' | 'C'; value: number }[] = [
    { label: 'UPPER THIRD (A)', key: 'A', value: thirds.upper },
    { label: 'MIDDLE THIRD (B)', key: 'B', value: thirds.middle },
    { label: 'LOWER THIRD (C)', key: 'C', value: thirds.lower },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            <span>{row.label}</span>
            <span className="text-slate-600">{row.value.toFixed(2)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${row.value * 200}%`, background: row.key === thirds.strongest ? accent : '#cbd5e1' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LipFullness({ lip, accent }: { lip: Season['lip']; accent: string }) {
  const rows = [
    { label: 'IDEAL', value: lip.ideal, color: '#cbd5e1' },
    { label: 'YOU', value: lip.you, color: accent },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{row.label}</div>
          <div className="relative h-1.5 rounded-full bg-slate-100">
            <div
              className="absolute -top-0.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white"
              style={{ left: `${row.value * 100}%`, background: row.color, boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LiveAnalysisDemo() {
  const [index, setIndex] = useState(0);
  const season = SEASONS[index];
  const palette = useMemo(() => buildPalette(season), [season]);

  const cycleSeason = () => setIndex((i) => (i + 1) % SEASONS.length);

  return (
    <section className="relative overflow-hidden py-24" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fdf4f0 45%, #f6f2fb 100%)' }}>
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center mb-8"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            See The Analysis Live
          </span>
          <h2
            className="text-4xl font-bold text-slate-900 leading-tight"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Here&apos;s how we read{' '}
            <em className="italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">your face</em>
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Every scan builds a full individual beauty profile and recommends a refined color palette.
          </p>
        </motion.div>

        <div className="mb-10 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <MousePointerClick className="h-3.5 w-3.5" strokeWidth={1.8} />
          Click the photo to preview a different season
        </div>

        {/* Desktop layout */}
        <div className="relative mx-auto hidden h-[700px] max-w-5xl lg:block">
          <button
            type="button"
            onClick={cycleSeason}
            className="absolute left-1/2 top-0 h-[660px] w-[320px] -translate-x-1/2 overflow-hidden rounded-[2rem] cursor-pointer"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 70% 92% at 50% 42%, black 60%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 70% 92% at 50% 42%, black 60%, transparent 100%)',
            }}
            aria-label="Cycle season preview"
          >
            <Image
              src="/big.png"
              alt="Model face analysis preview"
              fill
              className="object-cover transition-[filter] duration-700 ease-out"
              style={{ filter: season.imageFilter }}
            />
            <div className="absolute inset-0 transition-colors duration-700" style={{ background: season.overlay, mixBlendMode: 'soft-light' }} />
          </button>

          <CardShell className="absolute left-[2%] top-[4%] w-[230px]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Skin Smoothness</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={season.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-2 text-xl font-bold text-slate-900">{season.skinSmoothness}%</div>
                <ValueBar value={season.skinSmoothness} accent={season.accent} low="Rough" high="Smooth" />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute left-[38%] top-0 w-[240px]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facial Symmetry</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={season.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-1 text-xl font-bold text-slate-900">{season.facialSymmetry}%</div>
                <Sparkline value={season.facialSymmetry} accent={season.accent} />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute right-[1%] top-[8%] w-[260px]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facial Fifths</div>
            <div className="mb-2 text-[10px] font-medium text-slate-500">Alignment score: {season.fifthsScore}%</div>
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <FifthsChart values={season.fifths} accent={season.accent} />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute left-0 top-[27%] w-[260px]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Your face is {season.contrastLabel}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <ContrastGrid point={season.contrastPoint} accent={season.accent} />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute right-0 top-[30%] w-[280px]">
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Your color palette: <span style={{ color: season.accent }}>{season.name}</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {palette.map((c, i) => (
                    <div key={i} className="aspect-square rounded-[3px]" style={{ background: c }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute left-[1%] top-[64%] w-[280px]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Facial Thirds <span className="text-slate-500">— Strongest: {season.thirds.strongest}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <ThirdsChart thirds={season.thirds} accent={season.accent} />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute left-[1%] top-[88%] w-[230px]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lip Fullness</div>
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <LipFullness lip={season.lip} accent={season.accent} />
              </motion.div>
            </AnimatePresence>
          </CardShell>

          <CardShell className="absolute right-[2%] top-[82%] w-[230px]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sclera Freshness</div>
            <AnimatePresence mode="wait">
              <motion.div key={season.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
                <div className="mb-2 text-xl font-bold text-slate-900">
                  {season.sclera}% <span className="text-xs font-medium text-slate-400">Optimal</span>
                </div>
                <ValueBar value={season.sclera} accent={season.accent} low="Tired" high="Fresh" />
              </motion.div>
            </AnimatePresence>
          </CardShell>
        </div>

        {/* Mobile / tablet layout */}
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 lg:hidden">
          <button
            type="button"
            onClick={cycleSeason}
            className="relative h-[420px] w-[260px] overflow-hidden rounded-[2rem] cursor-pointer"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 70% 90% at 50% 42%, black 60%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 70% 90% at 50% 42%, black 60%, transparent 100%)',
            }}
            aria-label="Cycle season preview"
          >
            <Image
              src="/big.png"
              alt="Model face analysis preview"
              fill
              className="object-cover transition-[filter] duration-700 ease-out"
              style={{ filter: season.imageFilter }}
            />
            <div className="absolute inset-0 transition-colors duration-700" style={{ background: season.overlay, mixBlendMode: 'soft-light' }} />
          </button>

          <div className="grid w-full grid-cols-2 gap-3">
            <CardShell className="w-full">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Skin Smoothness</div>
              <div className="mb-2 text-lg font-bold text-slate-900">{season.skinSmoothness}%</div>
              <ValueBar value={season.skinSmoothness} accent={season.accent} low="Rough" high="Smooth" />
            </CardShell>
            <CardShell className="w-full">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facial Symmetry</div>
              <div className="mb-1 text-lg font-bold text-slate-900">{season.facialSymmetry}%</div>
              <Sparkline value={season.facialSymmetry} accent={season.accent} />
            </CardShell>
            <CardShell className="col-span-2 w-full">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Your face is {season.contrastLabel}
              </div>
              <ContrastGrid point={season.contrastPoint} accent={season.accent} />
            </CardShell>
            <CardShell className="col-span-2 w-full">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Your color palette: <span style={{ color: season.accent }}>{season.name}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {palette.map((c, i) => (
                  <div key={i} className="aspect-square rounded-[3px]" style={{ background: c }} />
                ))}
              </div>
            </CardShell>
            <CardShell className="col-span-2 w-full">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facial Fifths</div>
              <FifthsChart values={season.fifths} accent={season.accent} />
            </CardShell>
            <CardShell className="w-full">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facial Thirds</div>
              <ThirdsChart thirds={season.thirds} accent={season.accent} />
            </CardShell>
            <CardShell className="w-full">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lip Fullness</div>
              <LipFullness lip={season.lip} accent={season.accent} />
            </CardShell>
            <CardShell className="col-span-2 w-full">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sclera Freshness</div>
              <div className="mb-2 text-lg font-bold text-slate-900">
                {season.sclera}% <span className="text-xs font-medium text-slate-400">Optimal</span>
              </div>
              <ValueBar value={season.sclera} accent={season.accent} low="Tired" high="Fresh" />
            </CardShell>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {SEASONS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setIndex(i)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300"
              style={
                i === index
                  ? { background: s.accent, color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
