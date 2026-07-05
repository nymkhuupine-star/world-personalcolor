'use client';

import { motion } from 'framer-motion';
import { ScanFace, SunMedium, Palette, BarChart3, Ban } from 'lucide-react';

const pipeline = [
  {
    icon: ScanFace,
    title: '468-Point Facial Mapping',
    description: 'We locate your cheeks, forehead, eyes, and hairline from 468 real facial points — your geometry, not a category.',
  },
  {
    icon: SunMedium,
    title: 'White Balance Calibration',
    description: 'We calibrate against the white of your own eye to cancel out warm or cool ambient light before reading your skin.',
  },
  {
    icon: Palette,
    title: 'CIE L*a*b* Pixel Measurement',
    description: 'Your undertone, depth, and clarity are measured in the same scientific color space used by textile and cosmetic labs.',
  },
  {
    icon: BarChart3,
    title: 'Deterministic 12-Season Scoring',
    description: 'A fixed, published formula scores all 12 seasons — the same rules, applied the same way, for every skin tone.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ScienceSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full bg-pink-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 mb-5 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            <Ban className="h-3.5 w-3.5" strokeWidth={2} />
            The Anti-AI Color Lab
          </span>
          <h2 className="text-4xl font-bold leading-tight text-white"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            We don&apos;t guess.{' '}
            <em className="italic bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              We measure.
            </em>
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-slate-400">
            Most color-analysis apps run on AI models trained mostly on lighter skin —
            so they guess, and they guess wrong for a lot of real faces. Our engine never
            guesses. It reads your actual skin pixels in the scientific CIE L*a*b* color
            space and scores every season with fixed, auditable math — pixel-perfect
            accuracy, for every skin tone.
          </p>
        </motion.div>

        <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-8 left-[12%] right-[12%] hidden h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent lg:block" />

          {pipeline.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-white/5 backdrop-blur-sm">
                  <Icon className="h-6 w-6 text-violet-300" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-[10px] font-bold text-white shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 px-1">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
