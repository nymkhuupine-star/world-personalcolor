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
    <section className="relative min-h-screen overflow-hidden flex items-center mt-[-100px] bg-pink-100/100 ">
      {/* Soft background glow — radial-gradient, no blur filter */}
      {/* <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(249,168,212,0.35) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 50% 55% at 100% 100%, rgba(216,180,254,0.28) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 45% 40% at 40% 80%, rgba(253,164,175,0.22) 0%, transparent 70%)' }} />
      </div> */}

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-20 px-6 py-40 lg:grid-cols-2 lg:px-12">
        {/* LEFT — Headline */} 
        <div className="flex flex-col gap-8">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex w-fit items-center gap-2 "
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" strokeWidth={1.7} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              Хувийн өнгөө тодорхойлох
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-3xl font-bold leading-tight text-slate-900 lg:text-4xl xl:text-5xl"
          >
            Таны төрөлхийн гоо үзэсгэлэнг тодотгох{' '}
            <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              хувийн өнгө
            </em>

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
            Таны гэрэл зурагт дүн шинжилгээ хийж, арьс, үс, нүдний өнгөнд тань хамгийн төгс зохицох хувийн өнгийг тодорхойлно.
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