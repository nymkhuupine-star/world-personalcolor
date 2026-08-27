'use client';

import { motion } from 'framer-motion';
import { Upload, ScanLine, CreditCard, Mail } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Photo',
    description: 'A close-up portrait in natural light, plus your email address.',
    from: '#2dd4bf',
    to: '#0d9488',
  },
  {
    icon: CreditCard,
    title: 'Make Payment',
    description: 'Pay securely with Stripe, PayPal, or any major card.',
    from: '#a78bfa',
    to: '#7c3aed',
  },
  {
    icon: ScanLine,
    title: 'Scan & Analyze',
    description: 'We read your skin, hair, and eye color pigments.',
    from: '#60a5fa',
    to: '#2563eb',
  },
  {
    icon: Mail,
    title: 'Receive Your Report',
    description: 'Your palette and style guide, emailed within 24 hours.',
    from: '#86efac',
    to: '#16a34a',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-40 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            How It Works
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Discover your personal color in{' '}
            <em className="italic text-violet-600">4</em>{' '}
            <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">simple steps</em>
          </h2>
        </motion.div>

        {/* Numbered steps */}
        <div className="grid gap-y-14 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className={`relative text-left ${i % 2 === 1 ? 'sm:pl-8' : ''} ${
                  i > 0 ? 'lg:border-l lg:border-slate-200 lg:pl-8' : ''
                }`}
              >
                <span
                  className="block bg-clip-text font-serif text-7xl font-black leading-none text-transparent"
                  style={{ backgroundImage: `linear-gradient(180deg, ${step.from}, ${step.to})` }}
                >
                  0{i + 1}
                </span>
                <h3 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                  {step.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">{step.description}</p>
                <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: step.to }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
