'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
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
    <section className="relative min-h-screen overflow-hidden flex items-center mt-[-100px]"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fdf4f0 40%, #fce8e2 70%, #fad4cc 100%)' }}
    >
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
              Discover Your Personal Color
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-3xl font-bold leading-tight text-slate-900 lg:text-4xl xl:text-5xl"
          >
            Reveal your natural beauty with your{' '}
            <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              personal color
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
            We analyze your photo to determine the personal colors that perfectly complement your skin, hair, and eye tone.
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
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/women/68.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/12.jpg',
              ].map((src, i) => (
                <div key={i} className="h-9 w-9 rounded-full border-2 border-white shadow-sm overflow-hidden">
                  <Image src={src} alt="user" width={36} height={36} className="object-cover" />
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-800">1,000+ users</p>
              <p className="text-xs font-medium text-slate-600">found their perfect colors</p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Upload Card */}
        <Card />
      </div>
    </section>
  );
}