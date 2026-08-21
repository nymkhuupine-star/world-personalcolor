'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, Sparkles, Wallet } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'Feel More Confident',
    description: 'Wear colors that brighten your complexion and naturally bring out your best features.',
    gradient: 'from-violet-500 to-pink-500',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    icon: ShoppingBag,
    title: 'Shop With Confidence',
    description: 'Know exactly which colors work for you, so choosing clothes becomes faster and easier.',
    gradient: 'from-rose-400 to-orange-400',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: Wallet,
    title: 'Buy Less, Choose Better',
    description: 'Avoid colors that sit unworn in your closet and spend on pieces you\'ll actually love.',
    gradient: 'from-amber-400 to-yellow-400',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
] as const;

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.05,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 56 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Benefits() {
  return (
    <section className="relative bg-white py-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-100/40 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-rose-100/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center mb-14"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Why Personal Color Matters
          </span>
          <h2 className="text-4xl font-bold text-slate-900 leading-tight"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Feel confident in{' '}
            <em className="italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">every color</em>{' '}
            you wear
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Discover the practical benefits of knowing the colors that naturally suit you.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:items-start lg:gap-32">
          {/* LEFT — image */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[360px] shrink-0 lg:w-[400px] lg:max-w-none"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)]">
              <Image
                src="/nice2.png"
                alt="Editorial portrait with color-matched makeup swatches"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 400px, 360px"
              />
            </div>
          </motion.div>

          {/* RIGHT — stacked cards */}
          <motion.div
            className="flex w-full max-w-lg flex-col gap-5"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {benefits.map((item, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${item.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.text}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
