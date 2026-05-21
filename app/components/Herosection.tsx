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
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-spring absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full bg-rose-200/45 blur-[130px]" />
        <div className="orb orb-summer absolute -bottom-32 -right-40 w-[580px] h-[580px] rounded-full bg-violet-200/40 blur-[120px]" />
        <div className="orb orb-autumn absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-amber-200/35 blur-[110px]" />
        <div className="orb orb-winter absolute top-1/4 right-1/3 w-[380px] h-[380px] rounded-full bg-sky-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12 py-28 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT — Headline */}
        <div className="flex flex-col gap-8">
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-200/70 bg-white/60 px-4 py-2 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              AI өнгөний шинжилгээ
            </span>
          </motion.div>

          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="font-serif text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.08] tracking-tight text-slate-900"
          >
            Танд төгс<br />
            зохих{' '}
            <em className="not-italic bg-gradient-to-r from-rose-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              палитр
            </em>
            <br />
            <span className="text-slate-400 font-normal text-3xl lg:text-4xl">
              AI-гаар олъё
            </span>
          </motion.h1>

          <motion.div
            custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="h-px w-2/3 bg-gradient-to-r from-slate-200 via-slate-300/60 to-transparent"
          />

          <motion.p
            custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="max-w-xs text-base leading-loose text-slate-400 font-light"
          >
            Компьютерийн харааны AI таны онцлогийг шинжилж улирлын өнгөний
            төрлийг секундэд тодорхойлно.
          </motion.p>

          <motion.div
            custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[
                { letter: 'S', bg: 'bg-rose-300' },
                { letter: 'M', bg: 'bg-violet-300' },
                { letter: 'A', bg: 'bg-sky-300' },
                { letter: 'J', bg: 'bg-amber-300' },
              ].map(({ letter, bg }, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FAFAFA] text-xs font-semibold text-white shadow-sm ${bg}`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">1,000+ хэрэглэгч</p>
              <p className="text-xs text-slate-400">өөртөө зохих өнгөө олсон</p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Upload Card */}
        <Card />
      </div>
    </section>
  );
}
