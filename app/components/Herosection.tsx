'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Card from './Card';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.13,
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center bg-gradient-to-br from-[#FFF7FB] via-[#F7DCEB] to-[#F3D7F3]">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 min-h-screen w-[680px] rounded-full bg-pink-300/30 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 min-h-screen w-[620px] rounded-full bg-fuchsia-300/25 blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 min-h-screen w-[520px] rounded-full bg-rose-200/30 blur-[150px]" />
        <div className="absolute  right-1/3 min-h-screen w-[380px] rounded-full bg-white/35 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-20 px-6 py-28 lg:grid-cols-2 lg:px-12">
        {/* LEFT — Headline */}
        <div className="flex flex-col gap-8">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm shadow-pink-200/40 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" strokeWidth={1.7} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-800">
              Хувийн өнгөө тодорхойлох
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-5xl font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-950 drop-shadow-sm lg:text-6xl xl:text-[4.35rem]"
          >
            Таны байгалийн{' '}
            <em className="not-italic bg-gradient-to-r from-rose-500 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
              гоо үзэсгэлэн
            </em>
            <br />
            <span className="mt-3 block font-serif text-3xl font-semibold tracking-[-0.02em] text-slate-800 lg:text-4xl">
              Зургаар тань тодорхойлъё
            </span>
          </motion.h1>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="h-px w-2/3 bg-gradient-to-r from-slate-300/80 via-white/80 to-transparent"
          />

          <motion.p
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-sm text-[17px] font-medium leading-8 text-slate-700"
          >
            Таны зурагт үндэслэн арьс, үс, нүдний өнгөний зохицлыг харж,
            өөрт тань тохирох өнгөнүүдийг санал болгоно.
          </motion.p>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[
                { letter: 'S', bg: 'bg-rose-400' },
                { letter: 'M', bg: 'bg-violet-400' },
                { letter: 'A', bg: 'bg-sky-400' },
                { letter: 'J', bg: 'bg-amber-400' },
              ].map(({ letter, bg }, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ${bg}`}
                >
                  {letter}
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">1,000+ хэрэглэгч</p>
              <p className="text-xs font-medium text-slate-600">өөртөө зохих өнгөө олсон</p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Upload Card */}
        <Card />
      </div>
    </section>
  );
}