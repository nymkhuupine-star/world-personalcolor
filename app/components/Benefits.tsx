'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Wallet } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'Boost Your Confidence',
    description: 'When you dress in colors that truly suit you, your complexion glows and you radiate confidence and charm with every step.',
    gradient: 'from-violet-500 to-pink-500',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    icon: ShoppingBag,
    title: 'Save Time',
    description: 'Stop wasting time shopping and picking clothes that don\'t work for you. By analyzing your skin, hair, and eye color together, we identify your ideal colors in seconds.',
    gradient: 'from-rose-400 to-orange-400',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: Wallet,
    title: 'Save Money',
    description: 'No more buying clothes and beauty products that don\'t suit you. Choosing colors that work best for you helps you shop smarter and avoid unnecessary spending.',
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
    <section className="relative bg-white py-28 overflow-hidden">
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
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Why You Need This
          </span>
          <h2 className="text-4xl font-bold text-slate-900 leading-tight"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            How will this analysis{' '}
            <em className="italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">transform</em>{' '}
            your life?
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              variants={cardVariant}
              className="group relative rounded-2xl border border-slate-100/80 bg-white p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className={`mt-4 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.text}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
